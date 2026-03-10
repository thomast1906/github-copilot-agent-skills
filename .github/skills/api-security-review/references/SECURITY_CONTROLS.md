# Security Controls Checklist

This reference file contains the complete 60+ security control checklist across 9 categories for Azure API Management security reviews.

## Categories

### NS- Network Security
- VNet Internal mode enabled
- Private Link / Private Endpoints configured for all PaaS dependencies
- NSG rules restrict inbound/outbound to required ports only
- No public IP addresses on internal services
- Subnet delegation configured correctly
- DDoS Protection enabled (Standard tier for production)

### IM- Identity Management
- Managed Identity used for all Azure resource authentication
- No service principals with client secrets where MI is possible
- Azure AD authentication enforced on APIs where applicable
- OAuth 2.0 / OIDC configured with correct audience and issuer
- Subscription keys rotated regularly (or replaced with token auth)
- Named Values used for all secrets (not inline policy)

### PA- Privileged Access
- RBAC roles follow least privilege
- No Owner/Contributor assigned to individuals on APIM resource
- APIM Management REST API access restricted
- Git integration (if used) secured with short-lived tokens
- Break-glass accounts documented and monitored

### DP- Data Protection
- TLS 1.2+ enforced on gateway and management endpoints
- Custom domain with valid certificate (not *.azure-api.net in prod)
- Cipher suites reviewed and weak ciphers disabled
- Backend communication uses HTTPS only
- Secrets stored in Key Vault, not hardcoded in policies

### LT- Logging & Threat Detection
- Diagnostic settings configured and sending to Log Analytics
- Application Insights connected to APIM instance
- Azure Monitor alerts for 4xx/5xx error spikes
- Microsoft Defender for APIs enabled
- Audit logs retained for minimum 90 days

### IR- Incident Response
- Playbooks defined for common incidents (key compromise, DDoS)
- Contacts configured in Azure Security Center
- SIEM integration (Sentinel) for threat detection

### PV- Posture & Vulnerability Management
- Azure Policy applied for APIM compliance
- Microsoft Defender for Cloud recommendations reviewed
- Regular penetration testing schedule
- Dependency scanning for developer portal customizations

### ES- Endpoint Security
- Developer portal hardened (custom domain, HTTPS only)
- Direct management endpoint access restricted to known IPs
- Self-hosted gateway nodes secured and monitored

### GS- Governance & Strategy
- APIM instance tagged per CAF naming conventions
- Resource locks applied to production instances
- Change management process for policy updates
- API versioning strategy documented and enforced

## Usage

Reference this checklist when running the `api-security-review` skill to ensure comprehensive coverage across all security domains for Azure API Management deployments.
