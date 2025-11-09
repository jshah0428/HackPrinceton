# DoctorVoice - AI-Powered Medical Analysis & Voice Healthcare Assistant

**Your voice. Your health. Guided by AI.**

DoctorVoice is an intelligent healthcare platform that combines advanced AI-powered medical document analysis with a sophisticated voice-based healthcare assistant. The system provides personalized health insights, predictive risk assessments, and seamless healthcare appointment scheduling through natural voice interactions.

---

## Overview

DoctorVoice revolutionizes healthcare accessibility by offering intelligent medical document analysis, predictive health trajectory modeling, and a conversational AI voice agent. The platform integrates cutting-edge technologies to deliver a comprehensive healthcare experience that bridges the gap between patients and medical insights.

**Core Capabilities:**
- Intelligent medical document analysis using Google Gemini AI
- Voice-based healthcare assistant powered by VAPI, Gemini, and ElevenLabs
- Predictive health modeling for 15-20 year risk projections
- Automated appointment scheduling with location-based services
- SMS notification system for appointment confirmations
- Real-time calendar integration

---

## Technology Stack

### Frontend
- Next.js 16.0.1 with Turbopack
- TypeScript
- Tailwind CSS
- React with Hooks for state management

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite database

### AI & Voice Technologies
- **Google Gemini 2.5 Flash API** - Core AI engine
- **VAPI** - Voice AI Platform for call handling
- **ElevenLabs** - Voice synthesis
- **Chestnut 40** - Health prediction model

### Integration Services
- **Photon** - SMS notification delivery
- **Dedalous** - MCP server deployment platform

### Document Processing
- PyPDF2 - PDF text extraction
- Pytesseract - OCR for scanned documents
- Pillow (PIL) - Image processing
- pdf2image - PDF to image conversion

---

## Architecture & Key Technologies

### Google Gemini AI - Foundation of Intelligence

Google Gemini 2.5 Flash serves as the core artificial intelligence engine powering DoctorVoice across all primary functions:

**Medical Document Analysis:**
- Processes and interprets complex medical reports, lab results, and pathology documents
- Extracts structured medical data from unstructured text
- Identifies key health indicators, risk factors, and abnormal values
- Generates comprehensive health assessments based on medical history

**Voice Agent Intelligence:**
- Powers the conversational AI agent that handles patient phone calls
- Provides natural language understanding for patient queries and requests
- Maintains contextual awareness throughout conversations
- Delivers medically accurate information and guidance

**Why Gemini for Healthcare:**
Gemini AI has been proven to be the best-performing AI model for healthcare-related applications. It demonstrates superior understanding of medical terminology, clinical context, and patient communication. The model's training on extensive medical literature and healthcare data enables it to provide accurate, contextually appropriate responses that are essential for patient safety and care quality.

### VAPI - Voice AI Platform

VAPI serves as the voice interface layer, handling real-time phone call orchestration and voice streaming. The platform integrates seamlessly with Gemini AI to enable:
- Incoming call reception and caller ID capture
- Real-time audio streaming and processing
- Bidirectional communication between patient and AI agent
- Session management and conversation state tracking

**Caller Identification:**
The system automatically identifies callers through phone number and Caller ID information. This enables immediate patient recognition and personalized interactions, allowing the AI agent to access the patient's medical history and provide contextually relevant assistance from the first moment of contact.

### ElevenLabs Voice Synthesis

ElevenLabs provides the voice output layer for the AI agent, operating on the Gemini AI backend. The integration delivers:
- Natural, human-like voice quality that creates a comfortable patient experience
- Accurate pronunciation of medical terminology
- Low-latency voice generation for real-time conversations
- Consistent, professional voice characteristics across all interactions

The combination of Gemini's intelligence with ElevenLabs' voice synthesis creates an industry-leading voice healthcare experience that rivals traditional human phone interactions while providing the scalability and 24/7 availability of an AI system.

### MCP Server - Dedalous Deployment

The Model Context Protocol (MCP) server acts as the operational backbone connecting the VAPI voice agent to external services and databases. Deployed on the Dedalous platform, the MCP server enables the AI agent to execute real-world actions during conversations.

**MCP Server Capabilities:**

**1. Appointment Scheduling:**
- Search provider databases for available healthcare professionals
- Check real-time calendar availability across multiple providers
- Book appointments directly through integrated scheduling systems
- Handle appointment modifications and cancellations
- Coordinate with multiple calendar systems simultaneously

**2. Location-Based Services:**
- Find healthcare providers, clinics, and facilities near the patient
- Calculate distances and provide routing information
- Filter results based on specialty, insurance acceptance, and availability
- Identify nearest pharmacies and urgent care centers

**3. Patient Data Access:**
- Retrieve medical history and previous visit records
- Access latest lab results and diagnostic reports
- Query medication lists and allergy information
- Review risk assessments and health predictions

**4. Calendar Integration:**
- Add scheduled appointments to patient's personal calendar
- Create calendar events with full appointment details
- Set up automated reminders for upcoming appointments
- Synchronize across multiple calendar platforms (Google Calendar, Outlook, Apple Calendar)

**Dedalous Deployment:**
The MCP server is deployed on Dedalous infrastructure, providing serverless architecture with high availability and low latency. This deployment ensures that voice agent interactions remain smooth and responsive, with minimal delay between patient requests and system actions.

### Photon - SMS Notification System

Photon handles all SMS communication with patients, delivering critical information directly to their mobile devices:
- Appointment confirmation messages with date, time, and location details
- Pre-appointment reminders sent 24 hours and 1 hour before scheduled visits
- Prescription refill notifications
- Lab result availability alerts
- General health tips and wellness information

The integration occurs after the MCP server completes an appointment booking. Photon receives the appointment details and patient phone number, then generates and sends confirmation messages automatically.

### Chestnut 40 - Predictive Health Modeling

Chestnut 40 is a specialized health prediction model that analyzes current health metrics to project long-term health trajectories. The model evaluates patient data to determine future health outlooks 15-20 years from the present.

**Predictive Analysis:**
- Processes current health indicators (blood sugar, cholesterol, blood pressure, etc.)
- Identifies risk trajectories for major health conditions
- Projects likelihood of disease development without intervention
- Generates evidence-based recommendations for risk mitigation

**Key Predictions:**
- Diabetes progression probability based on glycemic markers
- Cardiovascular disease risk from lipid profiles and blood pressure trends
- Metabolic syndrome development likelihood
- Overall health trajectory and quality of life projections

The model's outputs inform both the predictive health dashboard and the AI voice agent's recommendations, ensuring patients receive consistent, data-driven health guidance across all interaction channels.

---

## Core Features

### Medical Document Analysis

**Upload and Processing:**
Patients upload medical documents in PDF format through the web interface. The system processes these documents through multiple stages:

1. **Text Extraction:** PyPDF2 extracts text from digital PDFs. For scanned documents, pdf2image converts pages to images, and Pytesseract performs optical character recognition.

2. **Text Normalization:** Extracted text undergoes cleaning to remove headers, footers, page numbers, and other artifacts that could interfere with analysis.

3. **AI Analysis:** The cleaned text is sent to Google Gemini AI, which analyzes the content and extracts structured medical data including:
   - Patient demographics (name, age, gender, date of birth, blood type)
   - Vital signs (blood pressure, heart rate, temperature, weight, height, BMI)
   - Metabolic indicators (fasting glucose, HbA1c, cholesterol levels, triglycerides)
   - Medical history (medications, allergies, chronic conditions)
   - Lifestyle factors (smoking status, alcohol consumption, exercise habits)

4. **Database Storage:** Extracted data is validated and stored in the SQLite database, creating a longitudinal health record for each patient.

### Predictive Health Dashboard

The dashboard provides comprehensive visualization of health status and future risk projections:

**Current Health Metrics:**
Displays all extracted health indicators from the most recent medical document, including lab values, vital signs, and clinical measurements.

**Risk Assessment Cards:**
Three primary risk categories are evaluated and displayed:
- Diabetes progression risk
- Cardiovascular event risk
- Metabolic syndrome burden

Each risk category shows both current risk level and projected risk 15-20 years into the future, calculated using the Chestnut 40 model combined with Gemini AI insights.

**Primary Risk Drivers:**
For each risk category, the system identifies and displays the specific biomarkers or health factors contributing most significantly to the risk score. This allows patients to understand which aspects of their health require attention.

**Recommendations:**
The dashboard provides actionable guidance in two categories:

1. **Medication Watchlist:** Preventive medications that may be appropriate to discuss with a healthcare provider, based on current risk profile and projected trajectory.

2. **Lifestyle Modifications:** Specific, measurable lifestyle changes addressing diet, exercise, stress management, sleep, and health monitoring that can positively impact risk trajectories.

### Voice Healthcare Assistant

**Architecture:**
The voice assistant combines VAPI for call handling, Gemini AI for intelligence, and ElevenLabs for voice synthesis into a cohesive conversational agent.

**Patient Interaction Flow:**

1. **Call Reception:** Patient calls the DoctorVoice phone number. VAPI receives the call and captures the Caller ID.

2. **Patient Identification:** The system queries the database using the phone number to retrieve the patient's profile and medical history.

3. **Personalized Greeting:** ElevenLabs synthesizes a personalized greeting using the patient's name, establishing immediate rapport.

4. **Conversational Interaction:** The patient speaks naturally to express their needs or ask questions. Gemini AI processes the audio input, understands the intent, and formulates appropriate responses.

5. **Action Execution:** When the conversation requires external actions (scheduling appointments, finding locations, etc.), the MCP server executes these operations in real-time.

6. **Response Delivery:** ElevenLabs synthesizes the AI agent's responses into natural speech, maintaining conversational flow throughout the interaction.

### Appointment Scheduling System

**Complete End-to-End Process:**

**Step 1: Patient Request**
Patient expresses need for an appointment during voice call: "I need to see a cardiologist."

**Step 2: Location Determination**
MCP server determines patient location through phone number area code or by asking the patient directly.

**Step 3: Provider Search**
System searches integrated healthcare provider databases to identify relevant specialists within the patient's geographic area. Search parameters include:
- Provider specialty matching request
- Distance from patient location
- Insurance plan acceptance
- Patient rating and reviews

**Step 4: Availability Check**
For each potential provider, the system queries their scheduling system to identify open appointment slots. The search considers:
- Patient's availability preferences (time of day, day of week)
- Urgency level of the appointment
- Required appointment duration based on visit type

**Step 5: Option Presentation**
Voice agent presents available options to patient: "I found three cardiologists near you. Dr. Smith at HeartCare Clinic has availability tomorrow at 2 PM or Thursday at 10 AM. Dr. Johnson at Cardiac Associates has an opening Friday at 3 PM. Which would you prefer?"

**Step 6: Appointment Booking**
Once patient selects a time, MCP server books the appointment through the provider's scheduling API. The system collects and confirms:
- Provider name and facility location
- Appointment date and time
- Required pre-appointment preparation (fasting, medication adjustments, etc.)
- Insurance information verification

**Step 7: Calendar Addition**
System automatically adds the appointment to the patient's personal calendar with all relevant details, including:
- Event title and description
- Location with address
- Reminder notifications (24 hours prior, 1 hour prior)

**Step 8: SMS Confirmation**
Photon sends confirmation SMS to patient's phone: "Your appointment with Dr. Smith is confirmed for Thursday, November 14 at 10:00 AM at HeartCare Clinic, 123 Main Street. Reply CONFIRM to acknowledge or call us to reschedule."

### Pharmacy Locator

The system provides pharmacy location services through the MCP server:
- Identifies pharmacies within specified radius of patient location
- Provides pharmacy contact information and hours of operation
- Can check medication availability at specific locations
- Offers price comparison across different pharmacies
- Supports prescription transfer requests between pharmacies

---

## System Integration

### Data Flow Architecture

**Document Upload Path:**
Web Interface → FastAPI Backend → Document Processor (PyPDF2/Pytesseract) → Gemini AI Analysis → SQLite Database → Web Dashboard

**Voice Interaction Path:**
Phone Call → VAPI Platform → Gemini AI Processing → MCP Server (Dedalous) → External Services (Scheduling, Location, Calendar) → ElevenLabs Voice Synthesis → Patient

**Notification Path:**
Appointment Booking → MCP Server → Photon SMS Service → Patient Mobile Device

### Database Schema

Medical records are stored with comprehensive field structure:
- Patient identification and demographics
- Complete vital signs and measurements
- Laboratory test results and values
- Medication and allergy information
- Lifestyle and risk factors
- Document metadata (upload date, file names, processing status)

Each record maintains a unique identifier enabling correlation between uploaded documents, voice interactions, and scheduled appointments.

---

## Installation and Setup

### Prerequisites
- Node.js 18+ with bun package manager (frontend)
- Python 3.10+ with uv package manager (backend)
- Google Gemini API key
- VAPI account for voice agent functionality
- ElevenLabs API key for voice synthesis
- Photon account for SMS services
- Dedalous account for MCP server deployment

### Backend Configuration

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
uv add fastapi uvicorn python-multipart sqlalchemy python-dotenv PyPDF2 pytesseract Pillow pdf2image google-generativeai
```

3. Create environment configuration file (.env):
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Install Tesseract OCR for document scanning:
- Windows: Download from GitHub releases
- macOS: `brew install tesseract`
- Linux: `apt-get install tesseract-ocr`

5. Initialize database:
```bash
uv run python -c "from database import init_db; init_db()"
```

6. Start backend server:
```bash
uv run uvicorn main:app --reload
```

Backend runs at http://localhost:8000 with API documentation at http://localhost:8000/docs

### Frontend Configuration

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
bun install
```

3. Start development server:
```bash
bun run dev
```

Frontend accessible at http://localhost:3000

### Voice Agent Setup

**VAPI Configuration:**
1. Create VAPI account and new voice agent
2. Configure agent with Gemini 2.5 Flash as the AI model
3. Set ElevenLabs as voice provider
4. Configure initial greeting message
5. Add MCP server endpoint URL for function calling

**ElevenLabs Integration:**
1. Generate ElevenLabs API key
2. Add key to VAPI dashboard
3. Select appropriate voice model for healthcare context

**MCP Server Deployment:**
1. Deploy MCP server code to Dedalous platform
2. Configure environment variables for database and external service connections
3. Define available functions: schedule_appointment, find_nearby_providers, get_patient_data, add_to_calendar, send_sms_notification
4. Connect VAPI agent to MCP server endpoint

**Photon SMS Setup:**
1. Create Photon account and generate API key
2. Configure SMS templates for confirmations and reminders
3. Add Photon credentials to MCP server environment

---

## API Endpoints

### Health Check
```
GET /health
```
Returns server status, API configuration, and model initialization state.

Response includes:
- Server health status
- API key configuration status
- API key length and preview
- Environment file detection
- Model initialization confirmation

### Document Analysis
```
POST /analyze?record_id={record_id}
```
Upload and analyze medical documents.

Parameters:
- record_id: Unique identifier for medical record (query string)
- files: One or more PDF files (multipart form data)

Response includes:
- Processing success status
- List of processed files
- Extracted text length
- Total file size
- AI-generated analysis
- Analysis text length

### Medical Records Retrieval
```
GET /records
```
Retrieve all medical records from database.

Returns array of medical record objects with complete patient data, health metrics, and document metadata.

```
GET /records/{record_id}
```
Retrieve specific medical record by ID.

Returns single medical record object with all associated data.

---

## Security and Privacy

### Data Protection
- Medical records stored in local SQLite database
- API keys secured in environment variables
- CORS middleware for controlled frontend-backend communication
- Input validation and sanitization on all endpoints

### Privacy Considerations
- Patient data remains within system boundaries
- No unauthorized third-party data sharing
- Production deployment would implement full HIPAA compliance measures

---

## Performance and Scalability

### Current Architecture
- FastAPI provides high-performance request handling
- SQLite offers lightweight data persistence suitable for prototype scale
- VAPI handles voice call infrastructure at scale
- Dedalous deployment ensures MCP server availability

### Production Considerations
- Database migration to PostgreSQL for multi-user environments
- Implement caching layer for frequent data access
- Load balancing for backend services
- CDN deployment for frontend assets

---

## Future Development

### Planned Enhancements
- Multi-user authentication and authorization system
- Provider dashboard for healthcare professional access
- Integration with wearable health devices
- Expanded predictive modeling for additional health conditions
- Telemedicine video consultation integration
- Insurance claim processing automation
- Medication adherence tracking system
- Family health record management
- Multi-language voice agent support

---

## Technical Support

### Database Management

View all records:
```bash
cd backend
uv run python view_database.py
```

Reset database:
```bash
rm backend/medical_records.db
uv run python -c "from database import init_db; init_db()"
```

### Troubleshooting

**API Authentication Errors:**
Verify Gemini API key is correctly configured in .env file and backend has been restarted.

**Voice Agent Connection Issues:**
Confirm MCP server endpoint is accessible and VAPI agent configuration includes correct endpoint URL.

**Document Processing Failures:**
Ensure Tesseract OCR is installed and accessible in system PATH.

---


## Acknowledgments

- Google Gemini AI for providing advanced artificial intelligence capabilities optimized for healthcare applications
- ElevenLabs for industry-leading voice synthesis technology
- VAPI for robust voice AI platform infrastructure
- Photon for reliable SMS notification services
- Dedalous for scalable MCP server deployment
- Chestnut Health for the Chestnut 40 predictive health model

---

## License

This project is licensed under the MIT License.

---

## Contact

For questions, support requests, or collaboration inquiries, please open an issue on the GitHub repository.

---

**DoctorVoice - Making healthcare intelligent, accessible, and voice-activated.**

Built for HackPrinceton
