#!/bin/bash
# Sync new-main branch to main branch for production deployment
# This ensures production always has the latest code

set -e

echo "🔄 Syncing new-main to main..."

# Make sure we're on new-main and it's up to date
git checkout new-main
git pull origin new-main

# Push new-main to main (this triggers Vercel production deployment)
echo "📤 Pushing to main (production)..."
git push origin new-main:main --force-with-lease

echo "✅ Done! Production will automatically deploy the latest code."
echo "🌐 Check Vercel dashboard for deployment status."

