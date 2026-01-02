#!/bin/bash

# itkmmshop Deployment Script for Hostatom
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
PM2_APP_NAME="itkmmshop-api"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main
if [ $? -eq 0 ]; then
    print_success "Code pulled successfully"
else
    print_error "Failed to pull code"
    exit 1
fi

# Backend deployment
echo ""
echo "🔧 Deploying Backend..."
cd $BACKEND_DIR

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install --production
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found, installing..."
    npm install -g pm2
fi

# Restart backend with PM2
echo "🔄 Restarting backend application..."
if pm2 list | grep -q $PM2_APP_NAME; then
    pm2 restart $PM2_APP_NAME
    print_success "Backend restarted"
else
    pm2 start server.js --name $PM2_APP_NAME
    pm2 save
    print_success "Backend started"
fi

cd ..

# Frontend deployment
echo ""
echo "🎨 Deploying Frontend..."
cd $FRONTEND_DIR

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend
echo "🏗️  Building frontend..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Failed to build frontend"
    exit 1
fi

cd ..

# Create uploads directories if they don't exist
echo ""
echo "📁 Checking uploads directories..."
mkdir -p $BACKEND_DIR/uploads/products
mkdir -p $BACKEND_DIR/uploads/receipts
chmod 755 $BACKEND_DIR/uploads
chmod 755 $BACKEND_DIR/uploads/products
chmod 755 $BACKEND_DIR/uploads/receipts
print_success "Uploads directories ready"

# Display PM2 status
echo ""
echo "📊 Application Status:"
pm2 list

echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Check application logs: pm2 logs $PM2_APP_NAME"
echo "2. Monitor application: pm2 monit"
echo "3. Test the application: https://yourdomain.com"
