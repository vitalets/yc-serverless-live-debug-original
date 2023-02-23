#!/bin/sh
#
# Deploy all components with terraform:
# ./scripts/deploy.sh

# Exit on any error
set -euo pipefail

npm run build

export YC_TOKEN=$(yc iam create-token)
export YC_CLOUD_ID=$(yc config get cloud-id)

# terraform -chdir=terraform apply
cdktf deploy
