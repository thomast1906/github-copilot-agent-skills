#!/usr/bin/env bash
#
# Provisions and deploys the install counter. Run this yourself:
#
#   ./infra/deploy.sh
#
# Idempotent: safe to re-run. Re-running redeploys code without touching data.
#
# Creates:
#   - Resource group
#   - Storage account + 'installs' table   (event storage)
#   - Static Web App, Free tier            (redirect + stats API)
#
# Cost: £0. Free tier covers 1M function executions/month; you are at ~1.4k.

set -euo pipefail

# --- Configuration -----------------------------------------------------------
# Static Web Apps backends are only available in a subset of regions:
# westus2, centralus, eastus2, westeurope, eastasia. West Europe is closest to UK.
LOCATION="${LOCATION:-westeurope}"
ENVIRONMENT="${ENVIRONMENT:-prod}"
WORKLOAD="${WORKLOAD:-skills}"
INSTANCE="${INSTANCE:-001}"

RG="rg-${WORKLOAD}-${ENVIRONMENT}-${LOCATION}-${INSTANCE}"
SWA="swa-${WORKLOAD}-${ENVIRONMENT}-${LOCATION}-${INSTANCE}"

# Storage accounts: lowercase alphanumeric, max 24 chars. Full region names
# overflow that limit, so use a short code rather than silently truncating.
case "${LOCATION}" in
  westeurope)  LOC_SHORT="weu" ;;
  eastasia)    LOC_SHORT="ea"  ;;
  westus2)     LOC_SHORT="wus2" ;;
  centralus)   LOC_SHORT="cus" ;;
  eastus2)     LOC_SHORT="eus2" ;;
  *)           LOC_SHORT="$(echo "${LOCATION}" | cut -c1-4)" ;;
esac

STORAGE="st${WORKLOAD}${ENVIRONMENT}${LOC_SHORT}${INSTANCE}"
if (( ${#STORAGE} > 24 )); then
  echo "Storage account name '${STORAGE}' exceeds 24 characters. Shorten WORKLOAD." >&2
  exit 1
fi
TABLE="installs"

TAGS=(
  "environment=${ENVIRONMENT}"
  "project=github-copilot-agent-skills"
  "owner=thomast1906"
  "cost-center=personal"
  "managed-by=az-cli"
)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

# --- Preflight ---------------------------------------------------------------
command -v az >/dev/null || { echo "az CLI not found"; exit 1; }
az account show >/dev/null 2>&1 || { echo "Not logged in. Run: az login"; exit 1; }

echo "Subscription : $(az account show --query name -o tsv)"
echo "Resource group: ${RG}"
echo "Static Web App: ${SWA}"
echo "Storage       : ${STORAGE}"

# --- Bundle manifest ---------------------------------------------------------
# Generated from packages/*/apm.yml so redirect targets cannot drift from the
# bundle definitions.
info "Generating bundle manifest"
node "${ROOT}/scripts/build-manifest.mjs"

info "Running API tests"
npm --prefix "${ROOT}/api" ci --silent
npm --prefix "${ROOT}/api" test

# --- Resource group ----------------------------------------------------------
info "Creating resource group"
az group create \
  --name "${RG}" \
  --location "${LOCATION}" \
  --tags "${TAGS[@]}" \
  --output none

# --- Storage -----------------------------------------------------------------
info "Creating storage account"
az storage account create \
  --name "${STORAGE}" \
  --resource-group "${RG}" \
  --location "${LOCATION}" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --https-only true \
  --tags "${TAGS[@]}" \
  --output none

STORAGE_CONNECTION="$(az storage account show-connection-string \
  --name "${STORAGE}" --resource-group "${RG}" \
  --query connectionString -o tsv)"

info "Creating '${TABLE}' table"
az storage table create \
  --name "${TABLE}" \
  --connection-string "${STORAGE_CONNECTION}" \
  --output none

# --- Static Web App ----------------------------------------------------------
info "Creating Static Web App (Free)"
az staticwebapp create \
  --name "${SWA}" \
  --resource-group "${RG}" \
  --location "${LOCATION}" \
  --sku Free \
  --tags "${TAGS[@]}" \
  --output none

# --- Application settings ----------------------------------------------------
# SWA managed functions do not support Managed Identity, so a connection string
# is unavoidable here. It lives only in app settings, never in the repository.
#
# HASH_SECRET salts the visitor hash. Generated once and preserved on re-runs:
# rotating it would break unique-visitor continuity across the rotation.
info "Configuring application settings"
EXISTING_SETTINGS="$(az staticwebapp appsettings list \
  --name "${SWA}" --resource-group "${RG}" -o json 2>/dev/null || echo '{}')"

# Read via node rather than a JMESPath query: if the response shape changes, a
# silent empty result would rotate the salt on every deploy and break unique
# visitor continuity. This fails loudly instead.
EXISTING_SECRET="$(node -e '
  let raw = "";
  process.stdin.on("data", (d) => (raw += d));
  process.stdin.on("end", () => {
    try {
      const j = JSON.parse(raw || "{}");
      process.stdout.write(j?.properties?.HASH_SECRET ?? j?.HASH_SECRET ?? "");
    } catch { process.stdout.write(""); }
  });
' <<<"${EXISTING_SETTINGS}")"

if [[ -z "${EXISTING_SECRET}" ]]; then
  HASH_SECRET="$(openssl rand -hex 32)"
  echo "Generated a new HASH_SECRET."
else
  HASH_SECRET="${EXISTING_SECRET}"
  echo "Reusing existing HASH_SECRET (unique-visitor continuity preserved)."
fi

az staticwebapp appsettings set \
  --name "${SWA}" \
  --resource-group "${RG}" \
  --setting-names \
    "STORAGE_CONNECTION=${STORAGE_CONNECTION}" \
    "HASH_SECRET=${HASH_SECRET}" \
    "EVENTS_TABLE=${TABLE}" \
  --output none

# --- Deploy ------------------------------------------------------------------
info "Deploying site and API"
DEPLOY_TOKEN="$(az staticwebapp secrets list \
  --name "${SWA}" --resource-group "${RG}" \
  --query "properties.apiKey" -o tsv)"

npx --yes @azure/static-web-apps-cli deploy "${ROOT}/swa" \
  --api-location "${ROOT}/api" \
  --deployment-token "${DEPLOY_TOKEN}" \
  --env production

# --- Done --------------------------------------------------------------------
HOSTNAME="$(az staticwebapp show \
  --name "${SWA}" --resource-group "${RG}" \
  --query defaultHostname -o tsv)"

info "Deployed"
cat <<EOF

  Install endpoint : https://${HOSTNAME}/i/architect
  Stats endpoint   : https://${HOSTNAME}/api/stats

Verify:

  curl -sI "https://${HOSTNAME}/i/architect" | head -3    # expect 302 + Location
  curl -s  "https://${HOSTNAME}/api/stats" | jq

Point the CLI at it:

  SKILLS_INSTALL_HOST="https://${HOSTNAME}" node cli/bin/cli.mjs add architect

Custom domain (optional, free TLS):

  az staticwebapp hostname set \\
    --name "${SWA}" --resource-group "${RG}" \\
    --hostname skills.thomasthornton.cloud

Tear down everything:

  az group delete --name "${RG}" --yes

EOF
