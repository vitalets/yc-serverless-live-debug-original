#!/bin/sh

# Exit on any error
set -euo pipefail

rm -rf dist
npx tsc -p tsconfig.build.json
cp package*.json dist/
