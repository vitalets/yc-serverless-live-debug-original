#!/bin/sh
#
# Deploy all components with terraform:
# ./scripts/deploy.sh

# Exit on any error
set -euo pipefail

#npm run build

export YC_TOKEN=$(yc iam create-token)

# terraform -chdir=terraform apply
npx cdktf deploy

# npx ts-node YC_TOKEN=$(yc iam create-token) npx cdktf destroy
