# DoctorVoice Backend

Medical file analysis API using OpenAI GPT-4.

## Setup

1. **Install dependencies:**
```bash
uv add fastapi uvicorn openai python-multipart pypdf2 pillow pytesseract
```

2. **Set up your OpenAI API key:**
   - Get your API key from: https://platform.openai.com/api-keys
   - Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   - Add your key to `.env`:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Install Tesseract OCR (for image analysis):**
   - **Windows:** Download from https://github.com/UB-Mannheim/tesseract/wiki
   - **Mac:** `brew install tesseract`
   - **Linux:** `sudo apt install tesseract-ocr`

## Run the Server

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

## API Endpoints

### `POST /analyze`
Upload medical files for analysis.

**Request:** 
- Form data with multiple files
- Supported formats: PDF, PNG, JPG, TXT

**Response:**
```json
{
  "success": true,
  "analysis": "Disease risk analysis from GPT-4",
  "files_processed": [...]
}
```

### `GET /health`
Check API health and configuration status.

