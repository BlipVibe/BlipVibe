#!/bin/bash
# Sync web files to native app projects
# Run this after making changes to HTML/CSS/JS files

echo "📱 Syncing web files to native apps..."

# Copy web files to www/
cp index.html dmca.html changelog.json www/
cp -r js css images www/ 2>/dev/null

# Sync to both platforms
npx cap sync

echo "✅ Done! Open in IDE:"
echo "   Android: npx cap open android"
echo "   iOS:     npx cap open ios (requires Mac)"
