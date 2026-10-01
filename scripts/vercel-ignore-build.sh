#!/usr/bin/env bash
# Vercel Ignored Build Step. Exit 0 = skip, exit 1 = build.
set -u
log() { printf '[vercel-ignore] %s\n' "$*"; }
build() { log "BUILD: $*"; exit 1; }
skip() { log "SKIP: $*"; exit 0; }
current_sha="${VERCEL_GIT_COMMIT_SHA:-}"
previous_sha="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$current_sha" ]; then current_sha="$(git rev-parse HEAD 2>/dev/null || true)"; fi
[ -n "$current_sha" ] || build 'current commit SHA unavailable'
[ -n "$previous_sha" ] || build 'previous deployed SHA unavailable'
git cat-file -e "${current_sha}^{commit}" 2>/dev/null || build 'current commit unavailable locally'
git cat-file -e "${previous_sha}^{commit}" 2>/dev/null || build 'previous commit unavailable locally'
changed_files="$(git diff --name-only --no-renames "$previous_sha" "$current_sha" -- 2>/dev/null)" || build 'git diff failed'
[ -n "$changed_files" ] || skip 'no file changes detected'
is_safe_to_skip() {
  case "$1" in
    README.md|README.*|*.md|*.mdx) return 0 ;;
    docs/*|.github/*|tests/*|__tests__/*|*/__tests__/*|coverage/*|*/coverage/*|reports/*|*/reports/*|artifacts/*|*/artifacts/*) return 0 ;;
    *.test.js|*.test.jsx|*.test.ts|*.test.tsx|*.spec.js|*.spec.jsx|*.spec.ts|*.spec.tsx) return 0 ;;
    *) return 1 ;;
  esac
}
while IFS= read -r file; do
  [ -n "$file" ] || continue
  if ! is_safe_to_skip "$file"; then build "production-impacting path changed: $file"; fi
done <<EOF_CHANGED
$changed_files
EOF_CHANGED
skip 'all changed files are docs/test/CI/report artifacts'
