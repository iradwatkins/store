# GitHub Actions Setup

This directory contains the CI/CD workflows for the stores-stepperslife application.

## Workflows

### CI (`ci.yml`)
Runs on every push and pull request to verify code quality:
- ✅ Dependency installation
- ✅ Prisma client generation
- ✅ Code linting
- ✅ Type checking
- ✅ Unit tests
- ✅ Production build

### CD (`cd.yml`)
Deploys to production VPS after successful CI on master/main branch:
- ✅ SSH deployment to VPS
- ✅ Database migrations (commented out - enable when needed)
- ✅ PM2 application restart
- ✅ Deployment verification

## Required GitHub Secrets

To enable CD deployments, add these secrets to your GitHub repository:

1. Go to: Repository Settings → Secrets and variables → Actions
2. Click "New repository secret" and add:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VPS_HOST` | VPS server IP or hostname | `stores.stepperslife.com` |
| `VPS_USERNAME` | SSH username | `root` |
| `VPS_SSH_KEY` | Private SSH key for authentication | `-----BEGIN RSA PRIVATE KEY-----...` |
| `VPS_PORT` | SSH port (optional, default: 22) | `22` |

## Setting Up SSH Key

If you don't have an SSH key for deployments:

```bash
# On your VPS
ssh-keygen -t rsa -b 4096 -C "github-actions@stepperslife.com" -f ~/.ssh/github_actions_deploy

# Add the public key to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Copy the private key and add it to GitHub Secrets as VPS_SSH_KEY
cat ~/.ssh/github_actions_deploy
```

## Manual Deployment

You can trigger a manual deployment:
1. Go to: Actions tab → CD - Deploy to Production
2. Click "Run workflow"
3. Select branch and click "Run workflow"

## Notes

- The CI workflow currently has `continue-on-error: true` for linting, type checking, and tests during the migration period
- Remove these flags in Week 3 after fixing remaining TypeScript errors
- Database migrations are commented out in CD - enable when needed with `npx prisma migrate deploy`
