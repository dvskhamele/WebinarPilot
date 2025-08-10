#!/bin/bash
# Exit on any error
set -e

echo "🚀 Starting setup and deployment..."

# 1. Ensure required dependency exists (safe to run if already present)
echo "📦 Ensuring serverless-http is installed..."
npm install serverless-http@^3.2.0

# 2. Build client and Netlify function (uses package.json scripts)
echo "🏗️  Building project..."
npm run build

# 3. Git operations: commit any changes and push to origin
echo "🐙 Pushing changes to Git..."
if [ -d ".git" ]; then
  git add -A
  if git diff --cached --quiet; then
    echo "No changes to commit."
  else
    git commit -m "deploy: build artifacts and dependency updates"
  fi

  # Push using existing upstream if configured, otherwise set upstream to origin/<branch>
  if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
    git push
  else
    if git remote get-url origin >/dev/null 2>&1; then
      git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
    else
      echo "No remote 'origin' found. Skipping push. Add a remote and re-run."
    fi
  fi
else
  echo "No git repository detected. Initializing and pushing..."
  git init -b main
  git add -A
  git commit -m "Initial commit"
  if command -v gh >/dev/null 2>&1; then
    gh repo create WebinarPilot --public --source=. --remote=origin || true
  fi
  git push -u origin main || true
fi

echo "✅ Done!"