# Azure delivery through GitHub Actions

The workflow in `.github/workflows/frontend-ci-cd.yml` installs the committed npm dependency graph, audits production dependencies, runs the complete Vitest suite with coverage, verifies a production Angular build, and packages only the browser output. On `dev`, it deploys the tested ZIP to Azure App Service through OpenID Connect and requires the public site to respond successfully.

## Protected GitHub environment

Create an `azure-dev` environment for OIDC protection. Add these non-secret repository variables from the backend infrastructure's `azd env get-values` output; repository scope lets the package job compile `API_URL` before the protected deployment job starts:

| Variable                | Source                           |
| ----------------------- | -------------------------------- |
| `AZURE_CLIENT_ID`       | Delivery identity client ID      |
| `AZURE_TENANT_ID`       | Azure tenant ID                  |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID            |
| `AZURE_RESOURCE_GROUP`  | AZD resource group output        |
| `SERVICE_WEB_NAME`      | Frontend App Service name output |
| `API_URL`               | API URL output                   |
| `WEB_URL`               | Frontend URL output              |
| `AZURE_DEPLOY_ENABLED`  | Set to `true` after provisioning |

The infrastructure federated credential uses audience `api://AzureADTokenExchange` and this subject:

```text
repo:GeorgeBacalu/fit-journal-frontend:environment:azure-dev
```

No Azure client secret is required. Protect `dev` and configure environment reviewers if deployment approval is desired. The workflow generates the production API endpoint inside its isolated runner; no provider credential or Azure secret is compiled into the SPA.

Until provisioning has completed, leave `AZURE_DEPLOY_ENABLED` unset or `false`. Quality and packaging still run, but the deployment job is skipped instead of failing against missing infrastructure.
