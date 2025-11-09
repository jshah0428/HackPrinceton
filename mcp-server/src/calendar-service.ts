import { createEvents, EventAttributes, DateArray } from 'ics';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execPromise = promisify(exec);

export interface AppointmentDetails {
  date: string; // ISO format date string
  time: string; // HH:MM format
  title: string;
  location?: string;
  phoneNumber: string;
  notes?: string;
}

/**
 * Format phone number to E.164 format
 * Handles various input formats and defaults to US country code
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If already has country code (starts with 1 and is 11 digits)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If 10 digits, assume US number
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If already formatted, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Otherwise, add + and assume it's formatted
  return `+${digits}`;
}

/**
 * Parse date and time strings into ics DateArray format
 */
function parseDateTime(dateString: string, timeString: string): DateArray {
  const date = new Date(dateString);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  date.setHours(hours, minutes, 0, 0);
  
  return [
    date.getFullYear(),
    date.getMonth() + 1, // ics months are 1-indexed
    date.getDate(),
    hours,
    minutes
  ];
}

/**
 * Create an .ics calendar file for the appointment
 */
export async function createCalendarEvent(details: AppointmentDetails): Promise<string> {
  const startDateTime = parseDateTime(details.date, details.time);
  
  // Default duration: 1 hour
  const duration = { hours: 1 };
  
  const event: EventAttributes = {
    start: startDateTime,
    duration,
    title: details.title,
    description: details.notes || '',
    location: details.location || '',
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: 'Wellness Partners', email: 'noreply@wellness.com' },
  };
  
  return new Promise((resolve, reject) => {
    createEvents([event], (error, value) => {
      if (error) {
        reject(new Error(`Failed to create calendar event: ${error.message}`));
        return;
      }
      resolve(value);
    });
  });
}

/**
 * Save .ics content to a temporary file
 */
export async function saveIcsFile(icsContent: string): Promise<string> {
  const fileName = `appointment-${Date.now()}.ics`;
  const filePath = join(tmpdir(), fileName);
  
  await writeFile(filePath, icsContent, 'utf-8');
  
  return filePath;
}

/**
 * Delete temporary .ics file
 */
export async function deleteIcsFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('Failed to delete temporary .ics file:', error);
  }
}

/**
 * Add event to macOS Calendar using AppleScript
 * This creates the event in the default calendar
 */
export async function addToMacCalendar(details: AppointmentDetails): Promise<void> {
  const { date, time, title, location, notes } = details;
  
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour later
  
  // Format dates for AppleScript
  const formatForAppleScript = (d: Date) => {
    return d.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const startDateStr = formatForAppleScript(startDateTime);
  const endDateStr = formatForAppleScript(endDateTime);
  
  const appleScript = `
    tell application "Calendar"
      tell calendar "Calendar"
        set newEvent to make new event with properties {summary:"${title.replace(/"/g, '\\"')}", start date:date "${startDateStr}", end date:date "${endDateStr}", description:"${(notes || '').replace(/"/g, '\\"')}", location:"${(location || '').replace(/"/g, '\\"')}"}
      end tell
    end tell
  `;
  
  try {
    await execPromise(`osascript -e '${appleScript.replace(/'/g, "'\"'\"'")}'`);
    console.log('Event added to macOS Calendar successfully');
  } catch (error) {
    console.error('Failed to add event to macOS Calendar:', error);
    throw new Error('Failed to add event to Calendar app');
  }
}

