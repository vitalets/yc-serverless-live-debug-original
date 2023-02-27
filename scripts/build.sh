#!/bin/sh

# Exit on any error
set -euo pipefail

rm -rf dist
npx tsc -p tsconfig.build.json

# cli assets
cp src/client/cli/live-debug dist/client/cli
cp src/client/cdktf/apigw.tpl.yaml dist/client/cdktf

# fn-stub
mkdir -p dist/fn-stub-zip && cp -R dist/fn-stub dist/helpers dist/fn-stub-zip
npx ts-node scripts/pkg dist/fn-stub-zip \
  cdktf \
  cdktf-cli \
  constructs

# fn-store
mkdir -p dist/fn-store-zip && cp -R dist/fn-store dist/helpers dist/fn-store-zip
npx ts-node scripts/pkg dist/fn-store-zip \
  cdktf \
  cdktf-cli \
  constructs \
  @yandex-cloud/nodejs-sdk \
  ws \
  @types/ws
