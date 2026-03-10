# Infrastructure as Code Templates

This reference file contains complete Bicep and Terraform templates for deploying Azure API Management in production configurations.

## Bicep Templates

### Complete Production APIM Instance

```bicep
@description('Location for all resources')
param location string = 'uksouth'

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Workload name')
param workloadName string

@description('Publisher email for APIM')
param publisherEmail string

@description('Publisher name for APIM')
param publisherName string

@description('VNet resource ID for VNet integration')
param vnetId string

@description('Subnet resource ID for APIM subnet')
param apimSubnetId string

var apimName = 'apim-${workloadName}-${environment}-${location}-001'
var logAnalyticsName = 'log-${workloadName}-${environment}-${location}-001'
var appInsightsName = 'appi-${workloadName}-${environment}-${location}-001'
var keyVaultName = 'kv-${workloadName}-${environment}-${location}-001'

var tags = {
  environment: environment
  project: workloadName
  'managed-by': 'bicep'
}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apimName
  location: location
  tags: tags
  sku: {
    name: environment == 'prod' ? 'Premium' : 'Developer'
    capacity: environment == 'prod' ? 2 : 1
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
    virtualNetworkType: 'Internal'
    virtualNetworkConfiguration: {
      subnetResourceId: apimSubnetId
    }
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Ssl30': 'false'
    }
  }
  zones: environment == 'prod' ? ['1', '2', '3'] : null
}

// Diagnostic settings
resource apimDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'apim-diagnostics'
  scope: apim
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          days: 90
          enabled: true
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

// Application Insights logger
resource apimLogger 'Microsoft.ApiManagement/service/loggers@2022-08-01' = {
  name: 'appInsightsLogger'
  parent: apim
  properties: {
    loggerType: 'applicationInsights'
    credentials: {
      instrumentationKey: appInsights.properties.InstrumentationKey
    }
    isBuffered: true
    resourceId: appInsights.id
  }
}

output apimId string = apim.id
output apimName string = apim.name
output apimGatewayUrl string = apim.properties.gatewayUrl
output apimManagedIdentityPrincipalId string = apim.identity.principalId
```

### APIM API Definition

```bicep
param apimName string
param apiName string
param apiDisplayName string
param apiPath string
param backendUrl string

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' existing = {
  name: apimName
}

resource api 'Microsoft.ApiManagement/service/apis@2022-08-01' = {
  name: apiName
  parent: apim
  properties: {
    displayName: apiDisplayName
    path: apiPath
    protocols: ['https']
    subscriptionRequired: true
    subscriptionKeyParameterNames: {
      header: 'Ocp-Apim-Subscription-Key'
      query: 'subscription-key'
    }
  }
}

resource backend 'Microsoft.ApiManagement/service/backends@2022-08-01' = {
  name: '${apiName}-backend'
  parent: apim
  properties: {
    url: backendUrl
    protocol: 'http'
    tls: {
      validateCertificateChain: true
      validateCertificateName: true
    }
  }
}
```

---

## Terraform Templates

### Provider Configuration

```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.9"
}

provider "azurerm" {
  features {}
}
```

### APIM Resource

```hcl
locals {
  apim_name = "apim-${var.workload_name}-${var.environment}-${var.location}-001"
  tags = {
    environment = var.environment
    project     = var.workload_name
    managed-by  = "terraform"
  }
}

resource "azurerm_api_management" "apim" {
  name                = local.apim_name
  location            = var.location
  resource_group_name = var.resource_group_name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email

  sku_name = var.environment == "prod" ? "Premium_2" : "Developer_1"

  identity {
    type = "SystemAssigned"
  }

  virtual_network_type = "Internal"
  virtual_network_configuration {
    subnet_id = var.apim_subnet_id
  }

  security {
    enable_backend_ssl30  = false
    enable_backend_tls10  = false
    enable_backend_tls11  = false
    enable_frontend_ssl30 = false
    enable_frontend_tls10 = false
    enable_frontend_tls11 = false
  }

  zones = var.environment == "prod" ? ["1", "2", "3"] : null

  tags = local.tags
}

resource "azurerm_monitor_diagnostic_setting" "apim" {
  name                       = "apim-diagnostics"
  target_resource_id         = azurerm_api_management.apim.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category_group = "allLogs"
  }

  metric {
    category = "AllMetrics"
  }
}
```

### Variables

```hcl
variable "workload_name" {
  type        = string
  description = "Name of the workload"
}

variable "environment" {
  type        = string
  description = "Environment (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

variable "location" {
  type        = string
  description = "Azure region"
  default     = "uksouth"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "publisher_name" {
  type        = string
  description = "APIM publisher name"
}

variable "publisher_email" {
  type        = string
  description = "APIM publisher email"
}

variable "apim_subnet_id" {
  type        = string
  description = "Subnet resource ID for APIM VNet integration"
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace resource ID"
}
```

---

## GitHub Actions CI/CD Pipeline

### Deploy APIM via Bicep

```yaml
name: Deploy APIM Infrastructure

on:
  push:
    branches: [main]
    paths:
      - 'infrastructure/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        type: choice
        options: [dev, staging, prod]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'dev' }}
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy Bicep
        uses: azure/arm-deploy@v2
        with:
          scope: resourcegroup
          resourceGroupName: rg-apim-${{ github.event.inputs.environment || 'dev' }}-001
          template: infrastructure/main.bicep
          parameters: >
            environment=${{ github.event.inputs.environment || 'dev' }}
            publisherEmail=${{ secrets.APIM_PUBLISHER_EMAIL }}
            publisherName=${{ secrets.APIM_PUBLISHER_NAME }}
```
