#!/bin/bash
# POS System Deployment Script
# Usage: ./deploy.sh <server_path>
# Example: ./deploy.sh /var/www/html/pos
#
# IMPORTANT: The database is stored in .pos_data folder OUTSIDE the web root
# Your data will survive deployments and git pulls!

if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <server_path>"
    echo "Example: ./deploy.sh /var/www/html/pos"
    exit 1
fi

SERVER_PATH="$1"
POS_DATA_DIR="$SERVER_PATH/../.pos_data"

echo "Deploying POS System to $SERVER_PATH..."

# Backup existing database if it exists
if [ -f "$POS_DATA_DIR/database.sqlite" ]; then
    echo "Backing up existing database..."
    cp "$POS_DATA_DIR/database.sqlite" "$POS_DATA_DIR/database.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
fi

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

# Create .pos_data directory outside web root
mkdir -p "$POS_DATA_DIR"

echo ""
echo "✅ Deployment complete!"
echo "📁 Files deployed to: $SERVER_PATH"
echo "💾 Database location: $POS_DATA_DIR/database.sqlite"
echo ""
echo "Your data is stored OUTSIDE the web folder!"
echo "Git pulls and deployments will NOT delete your data."
