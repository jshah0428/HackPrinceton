# Health & Wellness Places MCP Server

An MCP (Model Context Protocol) server that intelligently maps health-related queries to valid Google Places API types and returns nearby medical facilities, doctors, pharmacies, and wellness centers.

## Features

- **Intelligent Query Mapping**: Automatically maps natural language queries (like "dental doctors", "urgent care", "prescription refill") to valid Google Places API types (like "dentist", "doctor", "pharmacy")
- **Fuzzy Matching**: Uses fuzzy search to find the best matching place type even with typos or variations
- **Health-Focused Place Types**: Supports health and wellness related place types including:
  - Hospitals and emergency care
  - Doctors and clinics (urgent care, general practitioners)
  - Dentists and dental clinics
  - Pharmacies and drugstores
  - Medical labs and diagnostic centers
  - Physical therapy and rehabilitation
  - Wellness centers and spas
- **Nearby Search**: Returns up to 5 nearby places matching the query within a 10km radius
- **Automatic Location Detection**: If coordinates aren't provided, automatically detects location from IP address (city-level accuracy, ~5-50km)

## Installation

```bash
cd mcp-server
bun install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Google Places API key to `.env`:
```
GOOGLE_PLACES_API_KEY=your_api_key_here
```

## Building

```bash
bun run build
```

## Running

### Development Mode
```bash
bun run dev
```

### Production Mode
```bash
bun run start
```

## MCP Configuration

To use this server with an MCP client (like Claude Desktop), add it to your MCP settings:

```json
{
  "mcpServers": {
    "places": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_PLACES_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or using bun:

```json
{
  "mcpServers": {
    "places": {
      "command": "bun",
      "args": ["run", "/path/to/mcp-server/src/index.ts"],
      "env": {
        "GOOGLE_PLACES_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Usage

The MCP server exposes one tool:

### `find_nearby_places`

Finds nearby places based on a search query.

**Parameters:**
- `query` (string, required): The type of place to search for (e.g., "dental doctors", "pharmacies", "urgent care")
- `latitude` (number, optional): Latitude of the search location. If not provided, automatically detects from IP address
- `longitude` (number, optional): Longitude of the search location. If not provided, automatically detects from IP address
- `maxResults` (number, optional): Maximum number of results to return (default: 5, max: 20)

**Example with coordinates:**

```typescript
{
  "query": "dental doctors",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "maxResults": 5
}
```

**Example with automatic IP location (no coordinates needed):**

```typescript
{
  "query": "pharmacies",
  "maxResults": 5
}
```

**Response:**

```json
{
  "places": [
    {
      "name": "Downtown Dental",
      "address": "123 Main St, New York, NY 10001",
      "type": "dentist"
    },
    {
      "name": "Smile Dental Care",
      "address": "456 Broadway, New York, NY 10012",
      "type": "dentist"
    }
  ],
  "matchedType": "dentist",
  "originalQuery": "dental doctors",
  "locationUsed": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "locationSource": "provided"
}
```

**Response with IP geolocation:**

```json
{
  "places": [...],
  "matchedType": "pharmacy",
  "originalQuery": "pharmacies",
  "locationUsed": {
    "latitude": 40.3699,
    "longitude": -74.6381
  },
  "locationSource": "ip"
}
```

## Query Mapping Examples

The server intelligently maps various health-related queries to valid place types:

- "dental doctors" → `dentist`
- "urgent care" → `doctor`
- "emergency room" → `hospital`
- "prescription refill" → `pharmacy`
- "flu shot" → `pharmacy` or `doctor`
- "physical therapy" → `physiotherapist`
- "blood test" → `medical_lab`
- "tooth pain" → `dentist`

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   ├── places-service.ts     # Places service with fuzzy matching
│   └── place-types.ts        # Complete list of valid place types
├── dist/                     # Compiled TypeScript output
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for building servers
- `fuse.js`: Fuzzy search library for intelligent query matching
- `zod`: Schema validation
- `dotenv`: Environment variable management

## Development

The server is built with TypeScript and uses the Model Context Protocol SDK. It runs as a stdio-based MCP server that can be integrated with any MCP client.

### Adding New Place Types

To add new place types or keywords, edit `src/place-types.ts` and add entries to the `PLACE_TYPES` array.

## License

MIT

