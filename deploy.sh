#!/bin/bash
# POS System Deployment Script
# Usage: ./deploy.sh <server_path>
# Example: ./deploy.sh /var/www/html/pos

if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <server_path>"
    echo "Example: ./deploy.sh /var/www/html/pos"
    exit 1
fi

SERVER_PATH="$1"
echo "Deploying POS System to $SERVER_PATH..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "Error: dist folder not found. Run 'npm run build' first."
    exit 1
fi

# Create server directory if not exists
mkdir -p "$SERVER_PATH"

# Copy dist files
cp -r dist/* "$SERVER_PATH/"

# Copy api folder (PHP backend)
cp -r api "$SERVER_PATH/"

# Copy root files
cp index.html router.php .htaccess "$SERVER_PATH/" 2>/dev/null || true

echo "Deployment complete!"
echo "Files deployed to: $SERVER_PATH"
