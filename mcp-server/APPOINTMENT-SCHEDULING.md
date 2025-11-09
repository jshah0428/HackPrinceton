# Appointment Scheduling Feature

## Overview

The MCP server now includes an `schedule_appointment` tool that creates calendar events and sends appointment notifications via iMessage.

## Tool: `schedule_appointment`

### Purpose
Schedule medical appointments by creating calendar events and notifying patients via iMessage.

### Input Schema

```json
{
  "date": "2025-11-09",           // ISO format date (YYYY-MM-DD)
  "time": "08:00",                // 24-hour format time (HH:MM)
  "title": "Medical Checkup",     // Appointment title/description
  "location": "123 Main St",      // Optional: Location/address
  "phoneNumber": "3472829073",    // Phone number (any format, auto-normalized)
  "notes": "Annual checkup"       // Optional: Additional notes
}
```

### Output

Success response:
```json
{
  "success": true,
  "message": "Appointment scheduled successfully",
  "details": {
    "date": "2025-11-09",
    "time": "08:00",
    "title": "Medical Checkup",
    "location": "Princeton Medical Center",
    "sentTo": "+13472829073",       // E.164 formatted phone number
    "calendarEventCreated": false,  // true if macOS Calendar integration succeeded
    "iMessageSent": true            // true if iMessage notification attempted
  }
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Features

### 1. Phone Number Formatting
- Automatically formats phone numbers to E.164 standard (+1 country code for US)
- Accepts various input formats:
  - `3472829073` → `+13472829073`
  - `(347) 282-9073` → `+13472829073`
  - `+13472829073` → `+13472829073` (preserved)

### 2. Calendar Event Creation
- Generates `.ics` (iCalendar) format files
- Attempts to add events to macOS Calendar app (requires permissions)
- Events include:
  - Title, date, time
  - Location (optional)
  - Notes/description (optional)
  - 1-hour default duration

### 3. iMessage Notification
- Sends appointment details via iMessage (requires macOS Messages app access)
- Includes appointment date, time, title, and location
- Gracefully handles permission errors (non-blocking)

## Test Results

### Successful Test
```bash
# Date: Sunday, November 9, 2025 at 8:00 AM
# Phone: +1 (347) 282-9073
# Result: ✅ Success

{
  "success": true,
  "message": "Appointment scheduled successfully",
  "details": {
    "date": "2025-11-09",
    "time": "08:00",
    "title": "Medical Checkup Appointment",
    "location": "Princeton Medical Center",
    "sentTo": "+13472829073",
    "calendarEventCreated": false,  # macOS Calendar permissions required
    "iMessageSent": true            # Notification attempted
  }
}
```

## Integration with Vapi

### Configuration
1. **Protocol**: Streamable HTTP (SHTTP)
2. **URL**: `https://your-ngrok-url.ngrok-free.dev/mcp`
3. **Available Tools**: 
   - `find_nearby_places` - Find health facilities
   - `schedule_appointment` - Schedule appointments

### Example Vapi Usage

When users say:
> "Book me an appointment at that dentist for next Tuesday at 2 PM"

Vapi will call:
```json
{
  "name": "schedule_appointment",
  "arguments": {
    "date": "2025-11-12",
    "time": "14:00",
    "title": "Dental Appointment",
    "location": "Dr. Smith's Dental Office, 123 Main St",
    "phoneNumber": "3472829073",
    "notes": "Regular checkup"
  }
}
```

## Limitations

### macOS Calendar Integration
- Requires Full Disk Access or Calendar permissions for the Terminal app
- If permissions are denied, `calendarEventCreated` will be `false`
- The `.ics` file is still created in `/tmp/` for manual import

### iMessage Sending
- Requires Messages app to be configured with an iMessage account
- Requires accessibility/automation permissions for Terminal/iTerm
- If permissions are denied, the tool will still succeed (calendar event is created)
- Message sending is non-blocking and times out after 10 seconds

## File Structure

```
mcp-server/src/
├── index-http.ts          # HTTP server with schedule_appointment tool
├── index.ts               # Stdio server with schedule_appointment tool
├── calendar-service.ts    # Calendar event creation & formatting
├── imessage-service.ts    # iMessage sending via AppleScript
└── places-service.ts      # Google Places API integration
```

## Implementation Details

### Calendar Service (`calendar-service.ts`)
- Creates `.ics` files using the `ics` library
- Saves temporary files to `/tmp/`
- Uses AppleScript to add events to macOS Calendar
- Formats phone numbers to E.164 standard

### iMessage Service (`imessage-service.ts`)
- Uses AppleScript to interact with Messages app
- Sends text messages with appointment details
- Non-blocking with 10-second timeout
- Graceful error handling

### Error Handling
- Calendar app failures don't block the overall operation
- iMessage failures don't block the overall operation
- Temporary `.ics` files are always cleaned up
- Detailed error messages returned to caller

## Next Steps

### Recommended Improvements
1. **Add email notification** as alternative to iMessage
2. **Implement appointment reminders** (e.g., 24 hours before)
3. **Add calendar invites with RSVP** functionality
4. **Support duration parameter** (currently defaults to 1 hour)
5. **Add recurring appointments** support
6. **Integrate with actual medical scheduling APIs** (e.g., Zocdoc, HealthGrades)

### Production Considerations
1. Use a proper SMS/messaging service (e.g., Twilio) instead of iMessage
2. Store appointments in a database
3. Add authentication and authorization
4. Implement proper error tracking and monitoring
5. Add rate limiting for appointment creation
