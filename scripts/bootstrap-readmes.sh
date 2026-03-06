#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

mkdir -p docs

write_readme_if_missing() {
  local dir="$1"
  local file="$dir/README.md"

  if [[ -f "$file" ]]; then
    echo "Keeping existing $file"
    return 0
  fi

  cat > "$file" <<EOF2
# $(basename "$dir")

TODO: document the purpose, ownership, entrypoints, and operational rules for \`$dir\`.
EOF2

  echo "Created $file"
}

for dir in ai @compliance compliance docker deploy infrastructure k8s terraform monitoring observability ops tests e2e k6 load-tests services payments configs scripts; do
  if [[ -d "$dir" ]]; then
    write_readme_if_missing "$dir"
  fi
done
