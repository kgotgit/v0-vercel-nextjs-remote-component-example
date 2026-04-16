#!/bin/bash
set -e

echo "Regenerating pnpm-lock.yaml..."
pnpm install --lockfile-only

echo "Lock file regenerated successfully!"
ls -la pnpm-lock.yaml
