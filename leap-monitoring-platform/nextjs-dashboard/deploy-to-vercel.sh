#!/bin/bash

# LEAP Monitoring Platform - Vercel Deployment Script
# This script prepares and deploys the Next.js dashboard to Vercel
# 
# Prerequisites:
# - Node.js 16+ installed
# - GitHub account with repo
# - Vercel account (free at https://vercel.com)
# - Vercel CLI installed (npm install -g vercel)

set -e

echo "🚀 LEAP Monitoring Platform - Vercel Deployment"
echo "================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "Please run this script from the nextjs-dashboard directory"
  exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js not installed"
  echo "Install from https://nodejs.org/"
  exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "📦 Installing Vercel CLI..."
  npm install -g vercel
fi

echo "✓ Vercel CLI ready"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --silent
echo "✓ Dependencies installed"
echo ""

# Build the Next.js app
echo "🔨 Building Next.js application..."
npm run build
echo "✓ Build complete"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""
echo "You'll be prompted to:"
echo "  1. Connect your GitHub account (if first time)"
echo "  2. Link to your Vercel project or create new one"
echo "  3. Set environment variables"
echo ""
echo "Environment variable to set:"
echo "  NEXT_PUBLIC_API_BASE_URL = https://your-backend-url/api/v1"
echo ""
echo "Press Enter to continue..."
read

# Deploy
vercel

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your dashboard is live! Check the URL above."
echo ""
echo "🎯 Next Steps:"
echo "  1. Verify the dashboard loads at the provided URL"
echo "  2. Log in with demo@leapmonitoring.com / demo123"
echo "  3. Check that you can see API monitoring data"
echo "  4. Share the URL with recruiters"
echo ""
echo "📧 Demo Credentials:"
echo "  Email: demo@leapmonitoring.com"
echo "  Password: demo123"
echo ""
echo "Or create a new account:"
echo "  Email: user1@leapmonitoring.com"
echo "  Password: password1"
echo ""
echo "For 60 test users, use:"
echo "  user1@leapmonitoring.com to user60@leapmonitoring.com"
echo "  password1 to password60"
