import { exec } from 'child_process';
import { promisify } from 'util';
import { 
  createCalendarEvent, 
  saveIcsFile, 
  deleteIcsFile,
  AppointmentDetails 
} from './calendar-service.js';

const execPromise = promisify(exec);

/**
 * Create a calendar invite (.ics file) and send it via iMessage
 * Always uses the default iMessage account on this device.
 * Creates the .ics file from appointment details and sends it to the recipient.
 * 
 * IMPORTANT: Messages app's AppleScript has very limited file attachment support.
 * This implementation uses System Events to simulate drag-and-drop, which is the
 * most reliable method for attaching files to Messages.
 * 
 * @param appointmentDetails - Appointment details to create the .ics file from
 * @param message - Optional message text
 */
export async function sendCalendarInvite(
  appointmentDetails: AppointmentDetails,
  message?: string
): Promise<void> {
  const messageText = message || `Your appointment has been scheduled for ${appointmentDetails.date} at ${appointmentDetails.time}. ${appointmentDetails.title}${appointmentDetails.location ? ` at ${appointmentDetails.location}` : ''}. Please add this event to your calendar.`;
  
  // Create the .ics calendar event
  console.log('Creating .ics calendar file...');
  const icsContent = await createCalendarEvent(appointmentDetails);
  
  // Save to temporary file
  const icsFilePath = await saveIcsFile(icsContent);
  console.log(`✓ Created .ics file: ${icsFilePath}`);
  
  // Escape the file path and message for AppleScript
  const escapedFilePath = icsFilePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const escapedMessage = messageText.replace(/"/g, '\\"').replace(/\n/g, ' ');
  
  // Use the phone number from appointment details
  const phoneNumber = appointmentDetails.phoneNumber;
  
  // Comprehensive approach: Send message, then attach file using drag-and-drop simulation
  const appleScript = `
    -- Step 1: Send the text message first
    tell application "Messages"
      activate
      set targetService to 1st account whose service type = iMessage
      set targetBuddy to participant "${phoneNumber}" of targetService
      send "${escapedMessage}" to targetBuddy
      delay 3
    end tell
    
    -- Step 2: Attach the .ics file using System Events drag-and-drop simulation
    tell application "System Events"
      -- Open Finder and reveal the file
      tell application "Finder"
        set icsFile to POSIX file "${escapedFilePath}" as alias
        reveal icsFile
        delay 2
        select icsFile
      end tell
      
      -- Copy the file to clipboard
      tell process "Finder"
        set frontmost to true
        delay 0.5
        keystroke "c" using command down
        delay 0.5
      end tell
      
      -- Switch to Messages
      tell process "Messages"
        set frontmost to true
        activate
        delay 2
        
        -- Click in the message input area to ensure focus
        -- Then paste the file - in Messages, pasting a copied file should attach it
        keystroke "v" using command down
        delay 3
        
        -- Send the message with the attached file
        keystroke return
        delay 1
      end tell
    end tell
    
    return "success"
  `;
  
  try {
    console.log(`Attempting to send iMessage with .ics file to ${phoneNumber}...`);
    console.log(`ICS file path: ${icsFilePath}`);
    
    const { stdout, stderr } = await execPromise(`osascript -e '${appleScript.replace(/'/g, "'\"'\"'")}'`, { 
      timeout: 40000
    });
    
    // Clean up temporary file after sending (or if sending fails)
    await deleteIcsFile(icsFilePath);
    
    if (stdout && stdout.includes('success')) {
      console.log(`✓ iMessage with .ics attachment sent to ${phoneNumber}`);
      return;
    }
    
    if (stderr && stderr.trim()) {
      console.warn(`AppleScript stderr: ${stderr.trim()}`);
    }
    
    // If no explicit success, log warning
    console.warn(`⚠️  AppleScript completed but file attachment may not have worked`);
    console.log(`✓ iMessage text sent to ${phoneNumber}`);
  } catch (error) {
    // Clean up temporary file even if sending fails
    await deleteIcsFile(icsFilePath);
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to send .ics file: ${errorDetails}`);
    throw new Error(`Failed to send .ics file attachment: ${errorDetails}`);
  }
}
