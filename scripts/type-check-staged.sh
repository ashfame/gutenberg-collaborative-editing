#!/bin/bash

# Script to handle TypeScript checking in lint-staged context
# This script ignores the file arguments passed by lint-staged and
# runs TypeScript on the entire project using tsconfig.json

echo "Running TypeScript check on project..."
./node_modules/.bin/tsc --noEmit --project tsconfig.json
