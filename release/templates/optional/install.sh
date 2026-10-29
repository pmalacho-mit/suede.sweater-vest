#!/usr/bin/env bash
# Installs sweater-vest.d.ts into a library, so its test snippets type-check
# where sweater-vest itself is not installed.
#
#   bash install.sh <dest-dir>     # e.g. bash install.sh src/lib
#
# <dest-dir> must be somewhere your tsconfig includes; it is created if missing.
# Run it from the library that carries the snippets and commit the result, so
# it ships with the components.
set -euo pipefail

dest="${1:-}"
if [[ -z "$dest" || "$dest" == -* ]]; then
  echo "usage: bash $0 <dest-dir>" >&2
  exit 1
fi

src="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/sweater-vest.d.ts"
[[ -f "$src" ]] || { echo "missing $src" >&2; exit 1; }

mkdir -p "$dest"
cp "$src" "$dest/sweater-vest.d.ts"
echo "installed $dest/sweater-vest.d.ts"
echo "Snippets importing */dsl.import.meta.vitest now type-check without sweater-vest."
echo "Where sweater-vest is installed, its real types win; nothing to remove."
