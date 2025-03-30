# Deploying Chat App to Azure

This guide explains how to deploy the Chat App, consisting of three components (Backend, WebApp, and SlackApp), to Microsoft Azure.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Azure Resources Setup](#azure-resources-setup)
4. [Backend Deployment](#backend-deployment)
5. [WebApp Deployment](#webapp-deployment)
6. [SlackApp Deployment](#slackapp-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Networking and Security](#networking-and-security)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Architecture Overview

The Chat App consists of three main components:

1. **Backend**: Python FastAPI application that uses Azure OpenAI to generate chat responses
2. **WebApp**: Next.js web application that communicates with the backend API
3. **SlackApp**: Slack bot built with the Slack Bolt framework that also communicates with the backend API

These components interact as follows:

- The WebApp and SlackApp both communicate with the Backend API
- The Backend API communicates with Azure OpenAI to generate responses

## Prerequisites

Before deploying, ensure you have:

- An active Azure subscription
- Azure CLI installed and configured (choco install azure-cli -y)
- Node.js and npm installed (for WebApp and SlackApp)
- Python 3.8+ installed (for Backend)
- Git installed
- Slack App created in Slack API (for SlackApp component)
- Access to Azure OpenAI service
- Zip installed (choco install zip)

## Azure Resources Setup

### 1. Create Resource Group

```bash
# Create a resource group to contain all resources
az group create --name chatapp-rg --location australiaeast
```

### 2. Create Azure OpenAI Resource

```bash
# Create Azure OpenAI resource
az cognitiveservices account create --name chatapp-openai --resource-group chatapp-rg --kind OpenAI --sku S0 --location australiaeast

# Deploy a model to your Azure OpenAI resource
az cognitiveservices account deployment create --name chatapp-openai --resource-group chatapp-rg --deployment-name gpt-4o --model-name gpt-4o --model-version latest --model-format OpenAI
```

### 3. Create Key Vault for Secrets

```bash
# Create Key Vault
# Option 1: Create Key Vault with traditional access policies (default)
az keyvault create --name chatapp-keyvault --resource-group chatapp-rg --location australiaeast

# Option 2: Create Key Vault with RBAC authorization
# az keyvault create --name chatapp-keyvault --resource-group chatapp-rg --location australiaeast --enable-rbac-authorization true

# Store secrets in Key Vault
az keyvault secret set --vault-name chatapp-keyvault --name "AZURE-OPENAI-API-KEY" --value "<your-openai-api-key>"
az keyvault secret set --vault-name chatapp-keyvault --name "SLACK-BOT-TOKEN" --value "<your-slack-bot-token>"
az keyvault secret set --vault-name chatapp-keyvault --name "SLACK-SIGNING-SECRET" --value "<your-slack-signing-secret>"
az keyvault secret set --vault-name chatapp-keyvault --name "SLACK-APP-TOKEN" --value "<your-slack-app-token>"
```

### 4. Create App Service Plan

```bash
# Create a single App Service Plan for both Backend and SlackApp
az appservice plan create --name chatapp-plan --resource-group chatapp-rg --sku B1 --is-linux
```

## Backend Deployment

### 1. Create App Service for Backend

```bash
# Create App Service for Backend (find / replace and name this uniquely)
az webapp create --name chatapp-leewsimpson-backend --resource-group chatapp-rg --plan chatapp-plan --runtime "PYTHON:3.10"
```

### 2. Configure Backend Environment Variables

```bash
# Set environment variables for Backend
az webapp config appsettings set --name chatapp-leewsimpson-backend --resource-group chatapp-rg --settings AZURE_OPENAI_API_KEY="@Microsoft.KeyVault(SecretUri=https://chatapp-keyvault.vault.azure.net/secrets/AZURE-OPENAI-API-KEY)" AZURE_OPENAI_ENDPOINT="https://openai-ai-dev-aueast-01.openai.azure.com/" AZURE_OPENAI_MODEL_NAME="gpt-4o" AZURE_OPENAI_API_VERSION="2024-08-01-preview" WEBSITES_PORT=8000
```

### 3. Deploy Backend Code

```bash
# Since we have a monorepo with the BackEnd as a subdirectory, we can deploy using zip deployment
cd c:/Github/ChatApp

# Package the BackEnd directory
zip -r backend.zip BackEnd

# Deploy using zip deployment (Or configure via GitHub - easier)
az webapp deploy --name chatapp-leewsimpson-backend --resource-group chatapp-rg --src-path backend.zip

# Alternatively, for Windows PowerShell:
# Compress-Archive -Path .\BackEnd\* -DestinationPath backend.zip
# az webapp deploy --name chatapp-leewsimpson-backend --resource-group chatapp-rg --src-path backend.zip
```

### 4. Configure Startup Command

```bash
# Set startup command for the FastAPI app
az webapp config set --name chatapp-leewsimpson-backend --resource-group chatapp-rg --startup-file "gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"

# Make sure gunicorn is in requirements.txt
echo "gunicorn" >> requirements.txt
```

## WebApp Deployment

### 1. Create Static Web App for WebApp

```bash
# Create Static Web App
az staticwebapp create --name chatapp-webapp --resource-group chatapp-rg --location "australiasoutheast" --source https://github.com/yourusername/ChatApp --branch main --app-location "WebApp" --output-location ".next" --login-with-github
```

### 2. Configure WebApp Environment Variables

```bash
# Set environment variables for WebApp
az staticwebapp appsettings set --name chatapp-webapp --resource-group chatapp-rg --setting-names NEXT_PUBLIC_API_URL="https://chatapp-leewsimpson-backend.azurewebsites.net/api"
```

### 3. Configure Build Settings

Create a `staticwebapp.config.json` file in the WebApp directory:

```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"],
      "backendUri": "https://chatapp-leewsimpson-backend.azurewebsites.net/api/*"
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/404.html",
      "statusCode": 404
    }
  }
}
```

### 4. Update API URL in WebApp

Update the API_URL in `WebApp/src/app/page.tsx` to use an environment variable:

```typescript
// API URL for the Python FastAPI backend
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/message_stream";
```

### 5. Deploy WebApp

```bash
# Since we have a monorepo with the WebApp as a subdirectory
cd c:/Github/ChatApp

# Install dependencies and build the app
npm --prefix WebApp install
npm --prefix WebApp run build

# For Static Web Apps, you can deploy using the Azure CLI or GitHub Actions
# Option 1: Deploy using the Azure CLI (if you're not using GitHub)
az staticwebapp deploy --name chatapp-webapp --resource-group chatapp-rg --source WebApp --location ".next" --api-location ""

# Option 2: If using GitHub, the deployment will happen automatically through GitHub Actions
# Make sure your GitHub repository is connected to the Static Web App
```

## SlackApp Deployment

### 1. Create App Service for SlackApp

```bash
# Create App Service for SlackApp
az webapp create --name chatapp-slackapp --resource-group chatapp-rg --plan chatapp-plan --runtime "NODE:18-lts"
```

### 2. Configure SlackApp Environment Variables

```bash
# Set environment variables for SlackApp
az webapp config appsettings set --name chatapp-slackapp --resource-group chatapp-rg --settings SLACK_BOT_TOKEN="@Microsoft.KeyVault(SecretUri=https://chatapp-keyvault.vault.azure.net/secrets/SLACK-BOT-TOKEN)" SLACK_SIGNING_SECRET="@Microsoft.KeyVault(SecretUri=https://chatapp-keyvault.vault.azure.net/secrets/SLACK-SIGNING-SECRET)" SLACK_APP_TOKEN="@Microsoft.KeyVault(SecretUri=https://chatapp-keyvault.vault.azure.net/secrets/SLACK-APP-TOKEN)" API_URL="https://chatapp-leewsimpson-backend.azurewebsites.net/api/message" PORT=8080
```

### 3. Update API URL in SlackApp

Update the API_URL in `SlackApp/app.ts` to use an environment variable:

```typescript
// API URL for the Python FastAPI backend
const API_URL = process.env.API_URL || "http://localhost:8000/api/message";
```

### 4. Deploy SlackApp Code

```bash
# Since we have a monorepo with the SlackApp as a subdirectory, we can deploy using zip deployment
cd c:/Github/ChatApp

# Install dependencies and build the app
npm --prefix SlackApp install
npm --prefix SlackApp run build

# Package the SlackApp directory
zip -r slackapp.zip SlackApp

# Deploy using zip deployment
az webapp deploy --name chatapp-slackapp --resource-group chatapp-rg --src-path slackapp.zip

# Alternatively, for Windows PowerShell:
# Compress-Archive -Path .\SlackApp\* -DestinationPath slackapp.zip
# az webapp deploy --name chatapp-slackapp --resource-group chatapp-rg --src-path slackapp.zip
```

### 5. Configure Startup Command

```bash
# Set startup command for the SlackApp
az webapp config set --name chatapp-slackapp --resource-group chatapp-rg --startup-file "node dist/app.js"
```

## Environment Configuration

### 1. Managed Identity for Key Vault Access

```bash
# Enable managed identity for Backend
az webapp identity assign --name chatapp-leewsimpson-backend --resource-group chatapp-rg

# Get the principal ID
BACKEND_PRINCIPAL_ID=$(az webapp identity show --name chatapp-leewsimpson-backend --resource-group chatapp-rg --query principalId --output tsv)

# Enable managed identity for SlackApp
az webapp identity assign --name chatapp-slackapp --resource-group chatapp-rg

# Get the principal ID
SLACKAPP_PRINCIPAL_ID=$(az webapp identity show --name chatapp-slackapp --resource-group chatapp-rg --query principalId --output tsv)

# Grant access to Key Vault
# Option 1: If Key Vault was created WITHOUT --enable-rbac-authorization (using access policies)
az keyvault set-policy --name chatapp-keyvault --object-id $BACKEND_PRINCIPAL_ID --secret-permissions get list
az keyvault set-policy --name chatapp-keyvault --object-id $SLACKAPP_PRINCIPAL_ID --secret-permissions get list

# Option 2: If Key Vault was created WITH --enable-rbac-authorization (using RBAC)
# Get the Key Vault resource ID
# KEYVAULT_ID=$(az keyvault show --name chatapp-keyvault --resource-group chatapp-rg --query id --output tsv)

# Assign "Key Vault Secrets User" role to the managed identities
# az role assignment create --assignee $BACKEND_PRINCIPAL_ID --role "Key Vault Secrets User" --scope $KEYVAULT_ID
# az role assignment create --assignee $SLACKAPP_PRINCIPAL_ID --role "Key Vault Secrets User" --scope $KEYVAULT_ID
```

### 2. Configure CORS for Backend

```bash
# Configure CORS for Backend
az webapp cors add --name chatapp-leewsimpson-backend --resource-group chatapp-rg --allowed-origins "https://chatapp-webapp.azurestaticapps.net"
```

## Networking and Security

### 1. Configure Network Security

```bash
# Create a Virtual Network
az network vnet create --name chatapp-vnet --resource-group chatapp-rg --address-prefix 10.0.0.0/16 --subnet-name default --subnet-prefix 10.0.0.0/24

# Integrate Backend with VNet
az webapp vnet-integration add --name chatapp-leewsimpson-backend --resource-group chatapp-rg --vnet chatapp-vnet --subnet default

# Integrate SlackApp with VNet
az webapp vnet-integration add --name chatapp-slackapp --resource-group chatapp-rg --vnet chatapp-vnet --subnet default
```

### 2. Configure Private Endpoints (Optional)

```bash
# Create private endpoint for Key Vault
az network private-endpoint create --name chatapp-keyvault-pe --resource-group chatapp-rg --vnet-name chatapp-vnet --subnet default --private-connection-resource-id $(az keyvault show --name chatapp-keyvault --resource-group chatapp-rg --query id -o tsv) --group-id vault --connection-name keyvault-connection
```

### 3. Enable HTTPS Only

```bash
# Enable HTTPS Only for Backend
az webapp update --name chatapp-leewsimpson-backend --resource-group chatapp-rg --https-only true

# Enable HTTPS Only for SlackApp
az webapp update --name chatapp-slackapp --resource-group chatapp-rg --https-only true
```

## Monitoring and Maintenance

### 1. Set Up Application Insights

```bash
# Create Application Insights
az monitor app-insights component create --app chatapp-insights --location australiaeast --resource-group chatapp-rg --application-type web

# Get the instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show --app chatapp-insights --resource-group chatapp-rg --query instrumentationKey --output tsv)

# Configure Backend with Application Insights
az webapp config appsettings set --name chatapp-leewsimpson-backend --resource-group chatapp-rg --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"

# Configure SlackApp with Application Insights
az webapp config appsettings set --name chatapp-slackapp --resource-group chatapp-rg --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

### 2. Set Up Alerts

```bash
# Create an action group for alerts
az monitor action-group create --name chatapp-admins --resource-group chatapp-rg --action email admin@example.com

# Create an alert rule for high CPU usage
az monitor metrics alert create --name "High CPU Alert" --resource-group chatapp-rg --scopes $(az webapp show --name chatapp-leewsimpson-backend --resource-group chatapp-rg --query id -o tsv) --condition "avg Percentage CPU > 80" --window-size 5m --evaluation-frequency 1m --action $(az monitor action-group show --name chatapp-admins --resource-group chatapp-rg --query id -o tsv)
```

### 3. Configure Diagnostic Settings

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create --name chatapp-logs --resource-group chatapp-rg

# Enable diagnostic settings for Backend
az monitor diagnostic-settings create --name chatapp-leewsimpson-backend-diagnostics --resource $(az webapp show --name chatapp-leewsimpson-backend --resource-group chatapp-rg --query id -o tsv) --logs '[{"category": "AppServiceHTTPLogs", "enabled": true}, {"category": "AppServiceConsoleLogs", "enabled": true}, {"category": "AppServiceAppLogs", "enabled": true}]' --metrics '[{"category": "AllMetrics", "enabled": true}]' --workspace $(az monitor log-analytics workspace show --name chatapp-logs --resource-group chatapp-rg --query id -o tsv)
```

### 4. Set Up Auto-Scaling

```bash
# Configure auto-scaling for Backend
az monitor autoscale create --name chatapp-leewsimpson-backend-autoscale --resource $(az webapp show --name chatapp-leewsimpson-backend --resource-group chatapp-rg --query id -o tsv) --resource-group chatapp-rg --min-count 1 --max-count 5 --count 1

# Add a scale rule based on CPU percentage
az monitor autoscale rule create --autoscale-name chatapp-leewsimpson-backend-autoscale --resource-group chatapp-rg --condition "Percentage CPU > 70 avg 5m" --scale out 1
```

## Conclusion

Your Chat App is now deployed to Azure with all three components properly configured and secured. The WebApp is accessible via the Static Web App URL, the SlackApp is connected to your Slack workspace, and both communicate with the Backend API which uses Azure OpenAI for generating responses.

For ongoing maintenance:

- Regularly update dependencies and security patches
- Monitor application performance and logs
- Set up CI/CD pipelines for automated deployments
- Perform regular backups of any persistent data
- Review and rotate secrets periodically
