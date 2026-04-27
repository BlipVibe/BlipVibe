#!/bin/bash
# Sync web files to native app projects
# Run this after making changes to HTML/CSS/JS files
#
# What this does:
#   1. Recreate the www/ build directory (Capacitor's webDir)
#   2. Copy the static web bundle into www/
#   3. Run `npx cap sync` to push www/ into ios/ and android/ native projects
#
# Note: sw.js is intentionally NOT copied — index.html unregisters service
# workers at runtime to avoid stale-cache issues inside the native WebView.

set -e

echo "📱 Syncing web files to native apps..."

# Recreate www/ from scratch so stale files from a previous build don't linger
rm -rf www
mkdir -p www

# Static HTML / config / data files referenced from the app
cp index.html dmca.html changelog.json manifest.json www/

# Static assets
cp -r js css images www/

# Push www/ into ios/ and android/ native projects via Capacitor
npx cap sync

echo "✅ Done! Open in IDE:"
echo "   Android: npx cap open android"
echo "   iOS:     npx cap open ios (requires Mac)"
