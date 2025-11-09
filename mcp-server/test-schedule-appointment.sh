#!/bin/bash

# Test script for schedule_appointment MCP tool
# This tests the existing MCP server tool

BASE_URL="http://localhost:3000"

echo "🧪 Testing schedule_appointment MCP Tool"
echo "======================================================"
echo ""

# Step 1: Initialize MCP session
echo "1. Initializing MCP session..."
FULL_RESPONSE=$(curl -s -i -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }')

echo "2. Getting session ID..."

# Extract session ID from headers (look for the actual header line with the ID value)
SESSION_ID=$(echo "$FULL_RESPONSE" | grep -i "^mcp-session-id:" | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r\n')

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to get session ID"
  echo "Response headers:"
  echo "$FULL_RESPONSE" | head -20
  exit 1
fi

echo "✓ Session ID: $SESSION_ID"
echo ""

# Step 2: Get tomorrow's date
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d 2>/dev/null || echo "2025-11-09")

# Step 3: Call schedule_appointment tool
echo "3. Calling schedule_appointment tool..."
echo "   Date: $TOMORROW"
echo "   Time: 09:00"
echo "   Location: Philadelphia Medical Center"
echo "   Phone: 2019937206"
echo ""

TOOL_RESPONSE=$(curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 2,
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"schedule_appointment\",
      \"arguments\": {
        \"date\": \"$TOMORROW\",
        \"time\": \"09:00\",
        \"title\": \"Medical Appointment\",
        \"location\": \"Philadelphia Medical Center\",
        \"phoneNumber\": \"2019937206\",
        \"notes\": \"Scheduled appointment\"
      }
    }
  }")

echo "$TOOL_RESPONSE" | json_pp 2>/dev/null || echo "$TOOL_RESPONSE"
echo ""

echo "======================================================"
echo "✅ Test complete!"
echo ""

