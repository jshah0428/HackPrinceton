#!/bin/bash

# MCP Server Installation Verification Script

echo "🏥 Health & Wellness MCP Server - Installation Verification"
echo "============================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mcp-server directory"
    exit 1
fi

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run: npm install"
    exit 1
else
    echo "✓ node_modules found"
fi

echo ""
echo "🔨 Checking build..."
if [ ! -d "dist" ]; then
    echo "❌ dist folder not found. Run: npm run build"
    exit 1
else
    echo "✓ dist folder found"
fi

echo ""
echo "🔑 Checking API key..."
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "   Create one with: echo 'GOOGLE_PLACES_API_KEY=your_key' > .env"
    exit 1
else
    if grep -q "GOOGLE_PLACES_API_KEY=" .env; then
        echo "✓ .env file found with API key"
    else
        echo "❌ .env file exists but no API key found"
        exit 1
    fi
fi

echo ""
echo "🧪 Running tests..."
echo ""

# Run the test
npx tsx test-server.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "✅ All checks passed! MCP server is ready to use."
    echo ""
    echo "Next steps:"
    echo "  1. Configure your MCP client (see SETUP.md)"
    echo "  2. Restart your MCP client"
    echo "  3. The 'find_nearby_places' tool will be available"
else
    echo ""
    echo "============================================================"
    echo "❌ Tests failed. Please check the errors above."
fi

