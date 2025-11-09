#!/bin/bash

# Test script for HTTP MCP server
# Run with: ./test-http-server.sh

echo "🧪 Testing HTTP MCP Server"
echo "======================================================"
echo ""

BASE_URL="http://localhost:3000"

echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | json_pp
echo ""
echo ""

echo "2. Testing root endpoint..."
curl -s "$BASE_URL/" | json_pp
echo ""
echo ""

echo "3. Testing tools listing..."
curl -s "$BASE_URL/tools" | json_pp
echo ""
echo ""

echo "4. Testing find_nearby_places (with automatic IP location)..."
curl -s -X POST "$BASE_URL/tools/find_nearby_places" \
  -H "Content-Type: application/json" \
  -d '{"query": "pharmacy", "maxResults": 3}' | json_pp
echo ""
echo ""

echo "5. Testing find_nearby_places (with explicit coordinates)..."
curl -s -X POST "$BASE_URL/tools/find_nearby_places" \
  -H "Content-Type: application/json" \
  -d '{"query": "dentist", "latitude": 40.7128, "longitude": -74.0060, "maxResults": 2}' | json_pp
echo ""
echo ""

echo "======================================================"
echo "✅ Tests complete!"
echo ""
echo "To test with ngrok:"
echo "  1. Start ngrok: ngrok http 3000"
echo "  2. Replace localhost:3000 with your ngrok URL"
echo "  3. Run these curl commands again"

