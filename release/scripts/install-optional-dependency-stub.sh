#!/usr/bin/env bash
# install-optional-dependency-stub.sh
#
# Makes sweater-vest an OPTIONAL dependency for the consumers of your library.
#
# Your components carry test snippets that `import type` from sweater-vest's
# `dsl.import.meta.vitest`. Anyone who installs your library as source but not
# sweater-vest would see that import fail to resolve. This script copies
# templates/optional/sweater-vest.d.ts into your library; it declares
# `*/dsl.import.meta.vitest` as an ambient module with loose types.
#
# TypeScript consults an ambient pattern module only when an import does not
# resolve to a file. So:
#   - sweater-vest absent:  imports fall back to the stub; the project
#                           type-checks and builds (snippets are erased).
#   - sweater-vest present: the real types win; the stub is inert. Opting in
#                           never requires deleting anything.
#
# Usage (from the library that carries the snippets):
#   bash <path>/sweater-vest-suede/scripts/install-optional-dependency-stub.sh <dest-dir>
#   e.g. ... src/lib
#
# <dest-dir> must be inside what your tsconfig includes; it is created if
# missing. Commit the written `sweater-vest.d.ts` so it ships with your
# components. Re-running overwrites it (use that to pick up an updated stub).
set -euo pipefail

dest="${1:-}"
if [[ -z "$dest" || "$dest" == -* ]]; then
  echo "usage: bash $0 <dest-dir>" >&2
  exit 1
fi

src="$(cd "$(dirname "${BASH_SOURCE[0]}")/../templates/optional" && pwd)/sweater-vest.d.ts"
[[ -f "$src" ]] || { echo "missing $src" >&2; exit 1; }

mkdir -p "$dest"
cp "$src" "$dest/sweater-vest.d.ts"
echo "installed $dest/sweater-vest.d.ts"
