#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { PlacesService } from './places-service.js';
import { 
  addToMacCalendar,
  formatPhoneNumber,
  AppointmentDetails 
} from './calendar-service.js';
import { sendCalendarInvite } from './imessage-service.js';

// Load environment variables
dotenv.config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_PLACES_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Places Service
const placesService = new PlacesService(API_KEY);

// Define the tool schema
const FindPlacesTool: Tool = {
  name: 'find_nearby_places',
  description: 'Finds nearby places based on a search query. Automatically maps user queries (like "dental doctors", "pharmacies") to valid Google Places API types and returns up to 5 nearby locations. If latitude/longitude are not provided, automatically detects location from IP address (city-level accuracy). Use this tool when users ask to find places "near me" or "nearby".',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The type of place to search for (e.g., "dental doctors", "pharmacies", "urgent care", "hospitals"). Will be automatically mapped to the closest valid place type.',
      },
      latitude: {
        type: 'number',
        description: 'Optional: Latitude of the search location. If not provided, will automatically detect from IP address (city-level accuracy).',
      },
      longitude: {
        type: 'number',
        description: 'Optional: Longitude of the search location. If not provided, will automatically detect from IP address (city-level accuracy).',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 3, max: 3)',
        default: 3,
      },
    },
    required: ['query'],
  },
};

// Define the schedule_appointment tool schema
const ScheduleAppointmentTool: Tool = {
  name: 'schedule_appointment',
  description: 'Schedule a medical appointment and send a calendar invite via iMessage. Creates an Apple Calendar event and sends it as an .ics file to the specified phone number. Use this when users want to book an appointment at a healthcare facility.',
  inputSchema: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description: 'Appointment date in ISO format (e.g., "2024-12-15" or "2024-12-15T00:00:00Z")',
      },
      time: {
        type: 'string',
        description: 'Appointment time in HH:MM format (24-hour, e.g., "14:30" for 2:30 PM)',
      },
      title: {
        type: 'string',
        description: 'Event title/description (e.g., "Dental Checkup at Dr. Smith\'s Office")',
      },
      location: {
        type: 'string',
        description: 'Location/address of the appointment (e.g., "123 Main St, Princeton, NJ")',
      },
      phoneNumber: {
        type: 'string',
        description: 'Phone number to send the calendar invite to (any format accepted, will be normalized). Both the text message and .ics file will be sent to this number.',
      },
      notes: {
        type: 'string',
        description: 'Additional notes or reason for visit (e.g., "Annual checkup", "Tooth pain follow-up")',
      },
    },
    required: ['date', 'time', 'title', 'phoneNumber'],
  },
};

// Create MCP server
const server = new Server(
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

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [FindPlacesTool, ScheduleAppointmentTool],
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'find_nearby_places') {
    // Validate arguments - latitude and longitude are now optional
    const argsSchema = z.object({
      query: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      maxResults: z.number().min(1).max(3).default(3),
    });

    const args = argsSchema.parse(request.params.arguments);

    try {
      // If both latitude and longitude are provided, use them; otherwise use IP geolocation
      const location = (args.latitude !== undefined && args.longitude !== undefined)
        ? { latitude: args.latitude, longitude: args.longitude }
        : undefined;

      const result = await placesService.findPlaces(
        args.query,
        location,
        args.maxResults
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
              query: args.query,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  } else if (request.params.name === 'schedule_appointment') {
    // Validate arguments
    const argsSchema = z.object({
      date: z.string(),
      time: z.string(),
      title: z.string(),
      location: z.string().optional(),
      phoneNumber: z.string(),
      notes: z.string().optional(),
    });

    const args = argsSchema.parse(request.params.arguments);

    try {
      // Format phone number to E.164
      const formattedPhone = formatPhoneNumber(args.phoneNumber);
      
      // Create appointment details
      const appointmentDetails: AppointmentDetails = {
        date: args.date,
        time: args.time,
        title: args.title,
        location: args.location,
        phoneNumber: formattedPhone,
        notes: args.notes,
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
          `Your appointment has been scheduled for ${args.date} at ${args.time}. ${args.title}${args.location ? ` at ${args.location}` : ''}. Please add this event to your calendar.`
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Appointment scheduled successfully',
                details: {
                  date: args.date,
                  time: args.time,
                  title: args.title,
                  location: args.location || 'Not specified',
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
                date: args.date,
                time: args.time,
                title: args.title,
                phoneNumber: args.phoneNumber,
              },
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  } else {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Places MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

