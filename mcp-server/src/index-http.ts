#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { PlacesService } from './places-service.js';
import { z } from 'zod';
import { 
  addToMacCalendar,
  formatPhoneNumber,
  AppointmentDetails 
} from './calendar-service.js';
import { sendCalendarInvite } from './imessage-service.js';

// Load environment variables
dotenv.config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PORT = process.env.PORT || 3000;

if (!API_KEY) {
  console.error('Error: GOOGLE_PLACES_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Places Service
const placesService = new PlacesService(API_KEY);

// Create MCP server with tools
const createMcpServer = () => {
  const server = new McpServer(
    {
      name: 'places-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register the find_nearby_places tool
  server.registerTool(
    'find_nearby_places',
    {
      title: 'Find Nearby Places',
      description: 'ALWAYS use this tool when users ask to find nearby healthcare facilities, doctors, dentists, pharmacies, urgent care centers, hospitals, or any medical services. This tool searches for nearby places based on the user\'s query and automatically detects their location. Examples: "find dentists near me", "show me pharmacies nearby", "where are urgent care centers", "I need a doctor", "find hospitals close to me".',
      inputSchema: {
        query: z.string().describe('The type of place to search for. Examples: "dentist", "dentists", "dental", "pharmacy", "pharmacies", "urgent care", "doctor", "doctors", "hospital", "hospitals", "clinic", "medical center".'),
        latitude: z.number().optional().describe('Optional: Latitude of the search location. If not provided, will automatically detect from IP address'),
        longitude: z.number().optional().describe('Optional: Longitude of the search location. If not provided, will automatically detect from IP address'),
        maxResults: z.number().min(1).max(3).default(3).describe('Maximum number of results to return (default: 3, max: 3)'),
      },
    },
    async ({ query, latitude, longitude, maxResults }) => {
      try {
        // If both latitude and longitude are provided, use them; otherwise use IP geolocation
        const location = (latitude !== undefined && longitude !== undefined)
          ? { latitude, longitude }
          : undefined;

        const result = await placesService.findPlaces(
          query,
          location,
          maxResults
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: errorMessage,
                query,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register the schedule_appointment tool
  server.registerTool(
    'schedule_appointment',
    {
      title: 'Schedule Appointment',
      description: 'Schedule a medical appointment and send a calendar invite via iMessage. Creates an Apple Calendar event and sends it as an .ics file to the specified phone number. Use this when users want to book an appointment at a healthcare facility.',
      inputSchema: {
        date: z.string().describe('Appointment date in ISO format (e.g., "2024-12-15" or "2024-12-15T00:00:00Z")'),
        time: z.string().describe('Appointment time in HH:MM format (24-hour, e.g., "14:30" for 2:30 PM)'),
        title: z.string().describe('Event title/description (e.g., "Dental Checkup at Dr. Smith\'s Office")'),
        location: z.string().optional().describe('Location/address of the appointment (e.g., "123 Main St, Princeton, NJ")'),
        phoneNumber: z.string().describe('Phone number to send the calendar invite to (any format accepted, will be normalized). Both the text message and .ics file will be sent to this number.'),
        notes: z.string().optional().describe('Additional notes or reason for visit (e.g., "Annual checkup", "Tooth pain follow-up")'),
      },
    },
    async ({ date, time, title, location, phoneNumber, notes }) => {
      try {
        // Format phone number to E.164
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        // Create appointment details
        const appointmentDetails: AppointmentDetails = {
          date,
          time,
          title,
          location,
          phoneNumber: formattedPhone,
          notes,
        };
        
        let calendarEventCreated = false;
        
        try {
          // Try to add to macOS Calendar (optional - may fail if permissions not granted)
          try {
            await addToMacCalendar(appointmentDetails);
            calendarEventCreated = true;
            console.log('Calendar event created successfully');
          } catch (calendarError) {
            console.warn('Failed to add to Calendar app (continuing anyway):', calendarError);
            // Continue even if Calendar app fails - we can still send the .ics file
          }
          
          // Send via iMessage - this will create the .ics file and send it
          await sendCalendarInvite(
            appointmentDetails,
            `Your appointment has been scheduled for ${date} at ${time}. ${title}${location ? ` at ${location}` : ''}. Please add this event to your calendar.`
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Appointment scheduled successfully',
                  details: {
                    date,
                    time,
                    title,
                    location: location || 'Not specified',
                    sentTo: formattedPhone,
                    calendarEventCreated,
                    iMessageSent: true,
                  },
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          // sendCalendarInvite handles file cleanup internally
          throw error;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error scheduling appointment:', error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: errorMessage,
                details: {
                  date,
                  time,
                  title,
                  phoneNumber,
                },
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
};

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
}));
app.use(express.json());

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'health-places-mcp-http',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with information
app.get('/', (req, res) => {
  res.json({
    name: 'Health & Wellness Places MCP Server (Streamable HTTP)',
    version: '1.0.0',
    description: 'MCP server for finding nearby health-related places using Streamable HTTP protocol',
    protocol: 'MCP Streamable HTTP',
    endpoints: {
      'GET /': 'This information page',
      'GET /health': 'Health check',
      'POST /mcp': 'MCP protocol endpoint (initialize and tool calls)',
      'GET /mcp': 'MCP SSE stream endpoint',
      'DELETE /mcp': 'MCP session termination'
    },
    tools: ['find_nearby_places']
  });
});

// MCP POST endpoint - handles initialization and tool calls
const mcpPostHandler = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  // Enhanced logging for debugging
  console.log('\n=== MCP Request Received ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Session ID:', sessionId || 'NONE');
  console.log('===========================\n');
  
  if (sessionId) {
    console.log(`Received MCP request for session: ${sessionId}`);
  } else {
    console.log('MCP request (no session):', JSON.stringify(req.body).substring(0, 200));
  }

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport for this session
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request - create new transport
      console.log('Creating new MCP session (initialize request)');
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          console.log(`✅ Session initialized with ID: ${newSessionId}`);
          transports[newSessionId] = transport;
        },
      });

      // Set up onclose handler to clean up transport
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`Transport closed for session ${sid}, removing from transports map`);
          delete transports[sid];
        }
      };

      // Connect the transport to the MCP server
      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else if (!sessionId && req.method === 'GET') {
      // GET request without session ID - likely SSE stream request
      // This should have a session ID, but let's provide a helpful error
      res.status(400).send('Invalid or missing session ID. Please initialize the MCP session first with a POST request containing an initialize method.');
      return;
    } else if (!sessionId) {
      // POST request without session ID and not an initialize request
      // This might be Vapi trying to call a tool without initializing first
      console.log('⚠️  WARNING: Received non-initialize request without session ID');
      console.log('Request method:', req.method);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided. Please initialize the MCP session first by sending an initialize request.',
          hint: 'Send a POST request with method "initialize" first to establish a session.'
        },
        id: req.body?.id || null
      });
      return;
    } else {
      // Session ID provided but transport doesn't exist
      console.log(`⚠️  WARNING: Session ID ${sessionId} not found in active transports`);
      res.status(404).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Session not found. The session may have expired or was never initialized.',
          hint: 'Please initialize a new session by sending an initialize request.'
        },
        id: req.body?.id || null
      });
      return;
    }

    // Handle the request with existing transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
};

app.post('/mcp', mcpPostHandler);

// MCP GET endpoint - handles SSE streams
const mcpGetHandler = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const lastEventId = req.headers['last-event-id'];
  if (lastEventId) {
    console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
  } else {
    console.log(`Establishing new SSE stream for session ${sessionId}`);
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', mcpGetHandler);

// MCP DELETE endpoint - handles session termination
const mcpDeleteHandler = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  console.log(`Received session termination request for session ${sessionId}`);

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
};

app.delete('/mcp', mcpDeleteHandler);

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🏥 Health & Wellness Places MCP Server (Streamable HTTP)');
  console.log('='.repeat(60));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 MCP Protocol: Streamable HTTP`);
  console.log(`📡 Ready for ngrok tunneling`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET    http://localhost:${PORT}/`);
  console.log(`  GET    http://localhost:${PORT}/health`);
  console.log(`  POST   http://localhost:${PORT}/mcp (MCP protocol - initialize & tool calls)`);
  console.log(`  GET    http://localhost:${PORT}/mcp (MCP protocol - SSE stream)`);
  console.log(`  DELETE http://localhost:${PORT}/mcp (MCP protocol - session termination)`);
  console.log('');
  console.log('Tools:');
  console.log(`  - find_nearby_places: Find nearby health facilities`);
  console.log('');
  console.log('To expose with ngrok:');
  console.log(`  ngrok http ${PORT}`);
  console.log('');
  console.log('Vapi Configuration:');
  console.log(`  - Protocol: Streamable HTTP (SHTTP)`);
  console.log(`  - URL: https://your-ngrok-url.ngrok-free.dev/mcp`);
  console.log('='.repeat(60));
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});

