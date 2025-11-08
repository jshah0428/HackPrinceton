from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from anthropic import Anthropic
import os
from typing import List
import PyPDF2
import io
from PIL import Image
import pytesseract
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Get API key - try multiple methods
api_key = os.getenv("ANTHROPIC_API_KEY")

# If not in environment, read directly from .env file
if not api_key and env_path.exists():
    try:
        with open(env_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    if key.strip() == 'ANTHROPIC_API_KEY':
                        api_key = value.strip()
                        os.environ['ANTHROPIC_API_KEY'] = api_key
                        break
    except Exception as e:
        print(f"Error reading .env file: {e}")

# Verify API key
if not api_key:
    print("❌ ERROR: ANTHROPIC_API_KEY not found!")
    print(f"   .env file path: {env_path}")
    print(f"   .env file exists: {env_path.exists()}")
    if env_path.exists():
        print(f"   .env file content: {env_path.read_text(encoding='utf-8-sig')[:100]}")
    client = None
else:
    print(f"✅ API Key loaded: {api_key[:15]}...{api_key[-4:]}")
    print(f"   Key length: {len(api_key)}")
    client = Anthropic(api_key=api_key)
    print("✅ Anthropic client initialized!")

app = FastAPI()

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        return f"Error extracting PDF: {str(e)}"

def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from image using OCR"""
    try:
        image = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        return f"Error extracting from image: {str(e)}"

def extract_text_from_file(file: UploadFile, file_bytes: bytes) -> str:
    """Extract text based on file type"""
    filename = file.filename.lower()
    
    if filename.endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    elif filename.endswith(('.png', '.jpg', '.jpeg')):
        return extract_text_from_image(file_bytes)
    elif filename.endswith('.txt'):
        return file_bytes.decode('utf-8')
    else:
        return "Unsupported file type"

@app.post("/analyze")
async def analyze_medical_files(files: List[UploadFile] = File(...)):
    """
    Analyze uploaded medical files and predict disease risks using ChatGPT
    """
    try:
        # File size limits (50MB per file, 100MB total)
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
        MAX_TOTAL_SIZE = 100 * 1024 * 1024  # 100MB
        MAX_TEXT_LENGTH = 100000  # 100k characters max for API
        
        total_size = 0
        all_text = ""
        file_summaries = []
        
        for file in files:
            file_bytes = await file.read()
            file_size = len(file_bytes)
            total_size += file_size
            
            # Check file size
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400, 
                    detail=f"File {file.filename} is too large ({file_size / 1024 / 1024:.1f}MB). Maximum file size is 50MB."
                )
            
            if total_size > MAX_TOTAL_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Total file size ({total_size / 1024 / 1024:.1f}MB) exceeds limit of 100MB."
                )
            
            print(f"Processing file: {file.filename} ({file_size / 1024 / 1024:.2f}MB)")
            extracted_text = extract_text_from_file(file, file_bytes)
            print(f"Extracted {len(extracted_text)} characters from {file.filename}")
            
            # Truncate if too long (keep first part which is usually most important)
            if len(extracted_text) > MAX_TEXT_LENGTH:
                print(f"⚠️ File {file.filename} is very large ({len(extracted_text)} chars). Truncating to first {MAX_TEXT_LENGTH} characters.")
                extracted_text = extracted_text[:MAX_TEXT_LENGTH] + "\n\n[File truncated - showing first 100,000 characters]"
            
            all_text += f"\n\n--- {file.filename} ---\n{extracted_text}\n"
            file_summaries.append({
                "filename": file.filename,
                "size": file_size,
                "size_mb": round(file_size / 1024 / 1024, 2),
                "extracted": len(extracted_text) > 0,
                "extracted_length": len(extracted_text),
                "truncated": len(extracted_text) > MAX_TEXT_LENGTH
            })
        
        # Truncate total text if still too long
        if len(all_text) > MAX_TEXT_LENGTH:
            print(f"⚠️ Total text is very large ({len(all_text)} chars). Truncating to first {MAX_TEXT_LENGTH} characters.")
            all_text = all_text[:MAX_TEXT_LENGTH] + "\n\n[Content truncated - showing first 100,000 characters for analysis]"
        
        print(f"Total extracted text length: {len(all_text)} characters")
        
        if not all_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from files. Please ensure files contain readable text (PDF, images with text, or text files).")
        
        # Create ChatGPT prompt
        prompt = f"""You are a medical AI assistant analyzing patient medical records. 
        
Based on the following medical history, provide a comprehensive disease risk analysis:

{all_text}

Please provide:
1. **Top Disease Risks** (3-5 diseases with risk levels: HIGH, MEDIUM, or LOW)
2. **Key Symptoms or Risk Factors** identified
3. **Recommendations** for prevention or further consultation

Format your response as JSON with this structure:
{{
  "risks": [
    {{
      "disease": "Disease Name",
      "severity": "HIGH/MEDIUM/LOW",
      "description": "Brief explanation of why this risk exists",
      "symptoms": ["symptom1", "symptom2"]
    }}
  ],
  "key_factors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"]
}}

IMPORTANT: This is for educational purposes only. Always recommend consulting with healthcare professionals."""

        # Ensure API key is loaded
        current_api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        
        # If still not found, try reading from .env file directly
        if not current_api_key and env_path.exists():
            try:
                with open(env_path, 'r', encoding='utf-8-sig') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            if key.strip() == 'ANTHROPIC_API_KEY':
                                current_api_key = value.strip()
                                break
            except Exception as e:
                print(f"Error reading .env in analyze: {e}")
        
        if not current_api_key:
            raise HTTPException(
                status_code=500, 
                detail="API key not configured. Please set ANTHROPIC_API_KEY in .env file."
            )
        
        # Initialize client with the key
        try:
            analyze_client = Anthropic(api_key=current_api_key)
            print(f"✅ Client initialized with key: {current_api_key[:15]}...{current_api_key[-4:]}")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize Anthropic client: {str(e)}"
            )
        
        try:
            print(f"Sending {len(all_text)} characters to Claude API...")
            print(f"Prompt length: {len(prompt)} characters")
            print(f"Using API key: {current_api_key[:15]}...{current_api_key[-4:]}")
            
            # Increase max_tokens for larger responses
            max_response_tokens = min(4000, len(all_text) // 10)  # Adaptive based on input size
            
            response = analyze_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=max_response_tokens,
                temperature=0.7,
                system="You are a medical AI assistant that analyzes medical records and provides disease risk assessments. Always be professional and remind users to consult healthcare professionals.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            analysis = response.content[0].text
            print(f"✅ Received analysis: {len(analysis)} characters")
        except Exception as api_error:
            error_msg = str(api_error)
            print(f"❌ Claude API Error: {error_msg}")
            
            # Better error messages
            if "rate limit" in error_msg.lower():
                raise HTTPException(status_code=429, detail="API rate limit exceeded. Please try again in a moment.")
            elif "invalid" in error_msg.lower() or "authentication" in error_msg.lower():
                raise HTTPException(status_code=401, detail="API authentication failed. Please check your API key.")
            elif "token" in error_msg.lower() or "length" in error_msg.lower():
                raise HTTPException(status_code=400, detail="File is too large for analysis. Please try a smaller file or split it into multiple files.")
            else:
                raise HTTPException(status_code=500, detail=f"Claude API error: {error_msg}")
        
        return {
            "success": True,
            "files_processed": file_summaries,
            "analysis": analysis,
            "extracted_text_length": len(all_text),
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "analysis_length": len(analysis)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/")
async def root():
    return {"message": "DoctorVoice API - Medical File Analysis", "status": "running"}

@app.get("/health")
async def health_check():
    # Use the global api_key variable that was loaded at startup
    return {
        "status": "healthy", 
        "anthropic_configured": bool(api_key),
        "api_key_length": len(api_key) if api_key else 0,
        "api_key_preview": f"{api_key[:15]}...{api_key[-4:]}" if api_key else "None",
        "env_file_exists": env_path.exists(),
        "client_initialized": client is not None
    }

