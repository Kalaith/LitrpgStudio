#!/bin/bash

# Production Deployment Script for LitRPG Studio Backend
# This script optimizes the vendor directory for production deployment

set -e

echo "🚀 Starting production deployment optimization..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the backend directory
if [ ! -f "composer.json" ]; then
    print_error "composer.json not found. Please run this script from the backend directory."
    exit 1
fi

# Step 1: Clean existing vendor directory
print_status "Removing existing vendor directory..."
if [ -d "vendor" ]; then
    rm -rf vendor
    print_success "Vendor directory removed"
else
    print_warning "Vendor directory not found, skipping removal"
fi

# Step 2: Install production dependencies
print_status "Installing production dependencies..."
composer install --no-dev --optimize-autoloader --classmap-authoritative --no-interaction --quiet

if [ $? -eq 0 ]; then
    print_success "Production dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Run vendor cleanup
print_status "Running vendor cleanup to remove unnecessary files..."
php scripts/vendor-cleanup.php

# Step 4: Remove development files from root
print_status "Removing development files from backend root..."

# Files to remove in production
DEV_FILES=(
    "phpunit.xml"
    ".phpunit.cache"
    "tests"
    "docs"
    ".gitignore"
    "server.log"
)

for file in "${DEV_FILES[@]}"; do
    if [ -e "$file" ]; then
        rm -rf "$file"
        print_success "Removed: $file"
    fi
done

# Step 5: Create production-ready .htaccess for Apache
print_status "Creating production .htaccess file..."
cat > public/.htaccess << 'EOF'
# Production .htaccess for LitRPG Studio API

# Enable URL rewriting
RewriteEngine On

# Handle CORS preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Redirect all requests to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]

# Security Headers
<IfModule mod_headers.c>
    # CORS headers for API
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Accept, Origin, Authorization, X-Requested-With"
    Header always set Access-Control-Allow-Credentials "true"

    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# Disable directory browsing
Options -Indexes

# Protect sensitive files
<FilesMatch "\.(env|log|ini)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# PHP settings for production
<IfModule mod_php.c>
    php_value display_errors 0
    php_value log_errors 1
    php_value error_log /var/log/php_errors.log
</IfModule>
EOF

print_success "Production .htaccess created"

# Step 6: Display final statistics
print_status "Calculating final vendor size..."
VENDOR_SIZE=$(du -sh vendor 2>/dev/null | cut -f1 || echo "Unknown")
print_success "Final vendor directory size: $VENDOR_SIZE"

# Step 7: Create deployment summary
print_status "Creating deployment summary..."
echo "# Production Deployment Summary" > DEPLOYMENT_SUMMARY.md
echo "Generated: $(date)" >> DEPLOYMENT_SUMMARY.md
echo "" >> DEPLOYMENT_SUMMARY.md
echo "## Optimizations Applied:" >> DEPLOYMENT_SUMMARY.md
echo "- ✅ Production dependencies only (no dev packages)" >> DEPLOYMENT_SUMMARY.md
echo "- ✅ Optimized autoloader with classmap" >> DEPLOYMENT_SUMMARY.md
echo "- ✅ Vendor directory cleaned of unnecessary files" >> DEPLOYMENT_SUMMARY.md
echo "- ✅ Development files removed" >> DEPLOYMENT_SUMMARY.md
echo "- ✅ Production .htaccess configured" >> DEPLOYMENT_SUMMARY.md
echo "" >> DEPLOYMENT_SUMMARY.md
echo "## Final Stats:" >> DEPLOYMENT_SUMMARY.md
echo "- Vendor size: $VENDOR_SIZE" >> DEPLOYMENT_SUMMARY.md
echo "- Deployment ready: $(date)" >> DEPLOYMENT_SUMMARY.md

print_success "Deployment summary created: DEPLOYMENT_SUMMARY.md"

echo ""
echo "🎉 Production optimization complete!"
echo ""
echo "Next steps:"
echo "1. Upload the entire backend directory to your production server"
echo "2. Ensure your web server points to the 'public' directory"
echo "3. Set up your production .env file with database credentials"
echo "4. Run the database initialization via web call (see README.md)"
echo ""
print_warning "Remember: Never upload your .env file with sensitive credentials to version control!"