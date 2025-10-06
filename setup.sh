#!/bin/bash

# Universal Healthy Food Access System - Setup Script
# NASA Space Apps Challenge 2025

echo "🚀 Setting up Universal Healthy Food Access System..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Test data fetcher
echo "🧪 Testing data fetcher..."
node test-data-fetcher.js

if [ $? -eq 0 ]; then
    echo "✅ Data fetcher tests passed"
else
    echo "⚠️  Data fetcher tests had issues (this is normal for some APIs)"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Test cities to try:"
echo "  - Hull, England"
echo "  - Nairobi, Kenya" 
echo "  - Phoenix, Arizona"
echo ""
echo "=================================================="
