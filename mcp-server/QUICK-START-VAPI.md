# Quick Start: Vapi Integration

## 🚀 Start in 3 Steps

### Step 1: Start HTTP Server
```bash
cd mcp-server
npm run start:http
```

Leave this terminal running.

### Step 2: Start ngrok (in new terminal)
```bash
ngrok http 3000
```

Copy the **https** URL (e.g., `https://abc123.ngrok-free.app`)

### Step 3: Add to Vapi

In Vapi, create a custom tool:
- **Name:** find_nearby_places
- **URL:** `https://abc123.ngrok-free.app/tools/find_nearby_places`
- **Method:** POST
- **Content-Type:** application/json

**Parameters:**
```json
{
  "query": "string (required)",
  "latitude": "number (optional)",
  "longitude": "number (optional)",
  "maxResults": "number (optional, default 5)"
}
```

## ✅ Test It

In Vapi voice agent, say:
- "Find pharmacies near me"
- "Show me dentists nearby"
- "Where's the nearest urgent care?"

## 📝 Example Request

```json
{
  "query": "pharmacy"
}
```

Server will automatically detect location from IP if coords not provided.

## 🔄 Daily Use

Terminal 1:
```bash
npm run start:http
```

Terminal 2:
```bash
ngrok http 3000
```

That's it! Your MCP server is accessible via the ngrok URL.

## 📖 Full Documentation

See `NGROK-VAPI-SETUP.md` for complete details.

