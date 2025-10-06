#!/bin/bash

# Universal Healthy Food Access System - GitHub Deployment Script
# NASA Space Apps Challenge 2025

echo "🚀 Deploying Universal Healthy Food Access System to GitHub"
echo "=========================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the correct project directory"
    echo "   Please run this script from the food-access-system folder"
    exit 1
fi

# Get GitHub username
echo ""
echo "🔧 GitHub Setup"
echo "==============="
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

# Set repository name
REPO_NAME="universal-healthy-food-access-system"
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo ""
echo "📦 Preparing for deployment..."
echo "Repository: $REPO_URL"

# Add all files
echo "📝 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Deploy Universal Healthy Food Access System - NASA Space Apps 2025"
fi

# Add remote if it doesn't exist
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin $REPO_URL
fi

# Set main branch
echo "🌿 Setting main branch..."
git branch -M main

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "========================"
    echo ""
    echo "Your app will be available at:"
    echo "https://$GITHUB_USERNAME.github.io/$REPO_NAME"
    echo ""
    echo "Next steps:"
    echo "1. Go to your repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "2. Click Settings → Pages"
    echo "3. Select 'GitHub Actions' as source"
    echo "4. Wait 5-10 minutes for deployment"
    echo "5. Visit your live app!"
    echo ""
    echo "🌍 Your NASA Space Apps project is now live worldwide!"
else
    echo ""
    echo "❌ Deployment failed"
    echo "==================="
    echo ""
    echo "Please check:"
    echo "1. GitHub repository exists: $REPO_URL"
    echo "2. You have push permissions"
    echo "3. Internet connection is working"
    echo ""
    echo "Manual steps:"
    echo "1. Create repository on GitHub: $REPO_NAME"
    echo "2. Run: git push -u origin main"
fi
