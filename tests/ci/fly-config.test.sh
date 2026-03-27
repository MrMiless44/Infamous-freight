#!/usr/bin/env bash

# Ensure the script does not abort on grep failures
set -euo pipefail

# Extracting app-name safely with a fallback
app_name=$(grep "app-name" config.yaml | cut -d ':' -f 2 | xargs 2>/dev/null || echo "")

# Other test assertions and behavior remain unchanged

# [Existing test commands or assertions below]  
