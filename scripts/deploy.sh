#!/bin/sh
# Deploy all components:
# ./scripts/deploy-stack.sh
#
# Deploy stub/bridge module (for dev):
# TARGET=stub ./scripts/deploy.sh
# TARGET=bridge ./scripts/deploy.sh

# Exit on any error
set -euo pipefail

npm run build

export YC_TOKEN=$(yc iam create-token)
export YC_CLOUD_ID=$(yc config get cloud-id)

if [[ -z "${TARGET:-}" ]]; then
  terraform -chdir=terraform apply
else
  terraform -chdir=terraform apply -target=module.$TARGET
fi
