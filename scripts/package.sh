#!/bin/bash

# A script to prepare a distributable zip file for the plugin.

# Exit on error.
set -e

# Define variables.
PLUGIN_SLUG="gutenberg-collaborative-editing"
DIST_DIR="dist"
BUILD_DIR="build"

# Clean up previous build.
echo "Cleaning up previous build..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Build assets.
echo "Building assets..."
npm run build

# Create a temporary directory for the plugin.
PLUGIN_DIR="$DIST_DIR/$PLUGIN_SLUG"
mkdir -p "$PLUGIN_DIR"

# Copy plugin files.
echo "Copying plugin files..."
cp "$PLUGIN_SLUG.php" "$PLUGIN_DIR/"
cp -R "$BUILD_DIR" "$PLUGIN_DIR/"
cp "README.md" "$PLUGIN_DIR/"

# Copy PHP files from src, preserving directory structure.
echo "Copying PHP files from src..."
find src -type f -name "*.php" | cpio -pdm "$PLUGIN_DIR"

# Create a zip file.
echo "Creating zip file..."
cd "$DIST_DIR"
zip -r "${PLUGIN_SLUG}.zip" "$PLUGIN_SLUG"
cd ..

# Clean up temporary directory.
echo "Cleaning up..."
rm -rf "$PLUGIN_DIR"

echo "Package created successfully at $DIST_DIR/${PLUGIN_SLUG}.zip"
