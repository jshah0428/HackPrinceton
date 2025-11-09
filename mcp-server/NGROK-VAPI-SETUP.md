# Ngrok & Vapi Integration Guide

This guide explains how to expose your MCP server via ngrok for use with Vapi.

## Overview

Your MCP server now has two modes:
1. **Stdio mode** (`src/index.ts`) - for Claude Desktop/Cursor
2. **HTTP mode** (`src/index-http.ts`) - for Vapi via ngrok

## Step-by-Step Setup

### 1. Start the HTTP Server

In your first terminal window:

```bash
cd mcp-server
npm run start:http
```

You should see:
```
============================================================
🏥 Health & Wellness Places MCP Server (HTTP)
============================================================
✅ Server running on http://localhost:3000
📡 Ready for ngrok tunneling

Endpoints:
  GET  http://localhost:3000/
  GET  http://localhost:3000/health
  GET  http://localhost:3000/tools
  POST http://localhost:3000/tools/find_nearby_places
============================================================
```

### 2. Start ngrok

In a second terminal window:

```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       your@email.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### 3. Test the Endpoints

Test that your ngrok tunnel is working:

```bash
# Health check
curl https://abc123.ngrok-free.app/health

# List tools
curl https://abc123.ngrok-free.app/tools

# Test find nearby places
curl -X POST https://abc123.ngrok-free.app/tools/find_nearby_places \
  -H "Content-Type: application/json" \
  -d '{"query": "pharmacy"}'
```

### 4. Configure Vapi

In your Vapi dashboard:

1. Go to **Tools** or **Custom Functions**
2. Add a new tool/function
3. Configure:

**Tool Configuration:**
```json
{
  "name": "find_nearby_places",
  "description": "Finds nearby health places like pharmacies, doctors, dentists, hospitals",
  "url": "https://abc123.ngrok-free.app/tools/find_nearby_places",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameters": {
    "query": {
      "type": "string",
      "description": "Type of place to find (pharmacy, doctor, dentist, hospital, urgent care)",
      "required": true
    },
    "latitude": {
      "type": "number",
      "description": "Optional: User's latitude",
      "required": false
    },
    "longitude": {
      "type": "number",
      "description": "Optional: User's longitude",
      "required": false
    },
    "maxResults": {
      "type": "number",
      "description": "Max results to return (default 5)",
      "required": false
    }
  }
}
```

### 5. Test in Vapi

Create a test phone call or voice agent in Vapi and ask:
- "Find pharmacies near me"
- "What dentists are nearby?"
- "Show me urgent care centers"

## API Endpoints Reference

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "health-places-mcp-http",
  "version": "1.0.0",
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

### GET /tools
List available tools

**Response:**
```json
{
  "tools": [
    {
      "name": "find_nearby_places",
      "description": "...",
      "endpoint": "POST /tools/find_nearby_places",
      "inputSchema": {...}
    }
  ]
}
```

### POST /tools/find_nearby_places
Find nearby places

**Request:**
```json
{
  "query": "pharmacy",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "maxResults": 5
}
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "places": [
      {
        "name": "CVS Pharmacy",
        "address": "123 Main St, New York, NY",
        "type": "pharmacy"
      }
    ],
    "matchedType": "pharmacy",
    "originalQuery": "pharmacy",
    "locationUsed": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "locationSource": "provided"
  },
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

**Response (with automatic IP location):**
```json
{
  "query": "pharmacy"
}
```

The server will automatically detect location from IP if not provided.

## Troubleshooting

### ngrok Session Expired
- Free ngrok sessions expire after 2 hours
- Restart ngrok to get a new URL
- Update the URL in Vapi

### Server Not Responding
- Make sure HTTP server is running: `npm run start:http`
- Check ngrok is forwarding to the correct port (3000)
- Test locally first: `curl http://localhost:3000/health`

### Vapi Can't Connect
- Verify ngrok URL is HTTPS (not HTTP)
- Test the endpoint with curl first
- Check Vapi logs for error messages

## Development vs Production

### Development (localhost + ngrok)
```bash
# Terminal 1
npm run start:http

# Terminal 2
ngrok http 3000
```

### Production (deploy to server)
For production, deploy the HTTP server to a cloud service:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS/GCP/Azure

Then use the production URL instead of ngrok.

## Keep Both Modes Running

You can run both stdio (for Claude Desktop) and HTTP (for Vapi) simultaneously:

**Terminal 1 - HTTP server for Vapi:**
```bash
npm run start:http
```

**Terminal 2 - ngrok:**
```bash
ngrok http 3000
```

**Claude Desktop:** Still uses the stdio version automatically

## Useful Commands

```bash
# Start HTTP server
npm run start:http

# Start HTTP server in watch mode (auto-restart on changes)
npm run dev:http

# Test health check
curl http://localhost:3000/health

# Test with ngrok
curl https://your-ngrok-url.ngrok-free.app/health

# Test finding places
curl -X POST http://localhost:3000/tools/find_nearby_places \
  -H "Content-Type: application/json" \
  -d '{"query": "pharmacy", "maxResults": 3}'
```

## Security Notes

- ngrok URLs are public - anyone with the URL can access your server
- For production, add authentication middleware
- Consider rate limiting for production use
- Keep your Google Places API key secure (in .env, not in code)

## Support

If you encounter issues:
1. Check server logs in Terminal 1
2. Check ngrok dashboard at http://127.0.0.1:4040
3. Test endpoints with curl before Vapi integration
4. Verify .env file has GOOGLE_PLACES_API_KEY set

