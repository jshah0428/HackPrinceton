from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
from typing import List
import PyPDF2
import io
from PIL import Image
import pytesseract
from dotenv import load_dotenv
from pathlib import Path
import json
from database import init_db, get_db, MedicalRecord
from parser import parse_medical_report, flatten_parsed_data, normalize_text

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Get API key - try multiple methods
api_key = os.getenv("GEMINI_API_KEY")

# If not in environment, read directly from .env file
if not api_key and env_path.exists():
    try:
        with open(env_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    if key.strip() == 'GEMINI_API_KEY':
                        api_key = value.strip()
                        os.environ['GEMINI_API_KEY'] = api_key
                        break
    except Exception as e:
        print(f"Error reading .env file: {e}")

# Verify API key and configure Gemini
if not api_key:
    print("[ERROR] GEMINI_API_KEY not found!")
    print(f"   .env file path: {env_path}")
    print(f"   .env file exists: {env_path.exists()}")
    if env_path.exists():
        print(f"   .env file content: {env_path.read_text(encoding='utf-8-sig')[:100]}")
    model = None
else:
    print(f"[OK] API Key loaded: {api_key[:10]}...{api_key[-4:]}")
    print(f"   Key length: {len(api_key)}")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    print("[OK] Gemini client initialized!")

app = FastAPI()

# Initialize database
init_db()

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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
async def analyze_medical_files(files: List[UploadFile] = File(...), record_id: str = None, db: Session = Depends(get_db)):
    """
    Analyze uploaded medical files and predict disease risks using ChatGPT
    """
    try:
        print(f"\n{'#'*80}")
        print(f"# NEW FILE UPLOAD - Record ID: {record_id}")
        print(f"# Files: {', '.join([f.filename for f in files])}")
        print(f"{'#'*80}\n")
        
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
            extracted_text = normalize_text(extracted_text)
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

Please provide a detailed analysis in a clear, readable format. Structure your response as follows:

=== HEALTH ASSESSMENT REPORT ===

📊 OVERVIEW
[Brief summary of overall health status]

⚠️ DISEASE RISKS IDENTIFIED

For each risk, include:
• Disease Name (SEVERITY: HIGH/MEDIUM/LOW | Probability: X%)
• Why this risk exists based on the medical records
• Specific evidence from the records
• Key symptoms to watch for

🔍 KEY RISK FACTORS
• [List important risk factors found in the records]

💊 RECOMMENDED ACTIONS

For each recommendation, include:
• [PRIORITY LEVEL] Action item
• Timeline: When to take action
• Why: Explanation of importance

📋 NEXT STEPS
1. [Immediate action]
2. [Follow-up action]
3. [Long-term action]

⚠️ IMPORTANT DISCLAIMER
This analysis is for educational purposes only. Always consult with healthcare professionals for proper diagnosis and treatment.

Write in a professional but clear and easy-to-read style. Use bullet points, headings, and spacing to make it scannable."""

        # Ensure API key is loaded - use the global api_key first (loaded at startup)
        current_api_key = api_key
        
        # If not available, try environment variable
        if not current_api_key:
            current_api_key = os.getenv("GEMINI_API_KEY")
        
        # If still not found, try reading from .env file directly
        if not current_api_key and env_path.exists():
            try:
                with open(env_path, 'r', encoding='utf-8-sig') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            if key.strip() == 'GEMINI_API_KEY':
                                current_api_key = value.strip()
                                # Remove any BOM or hidden characters
                                current_api_key = current_api_key.replace('\ufeff', '').strip()
                                break
            except Exception as e:
                print(f"Error reading .env in analyze: {e}")
        
        if not current_api_key:
            raise HTTPException(
                status_code=500, 
                detail="API key not configured. Please set GEMINI_API_KEY in .env file."
            )
        
        # Debug: Print key info (first 10 and last 4 chars only for security)
        print(f"[KEY] Using API key: {current_api_key[:10]}...{current_api_key[-4:]}")
        print(f"[KEY] Key length: {len(current_api_key)}")
        
        # Configure Gemini with the key
        try:
            genai.configure(api_key=current_api_key)
            analyze_model = genai.GenerativeModel('gemini-2.5-flash')
            print(f"[OK] Gemini client initialized successfully")
        except Exception as e:
            print(f"[ERROR] Failed to initialize Gemini client: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize Gemini client: {str(e)}"
            )
        
        try:
            print(f"Sending {len(all_text)} characters to Gemini API...")
            print(f"Prompt length: {len(prompt)} characters")
            print(f"Using API key: {current_api_key[:10]}...{current_api_key[-4:]}")
            
            # Gemini has a larger context window, so we can be more generous
            max_response_tokens = min(8000, len(all_text) // 5)  # Adaptive based on input size
            
            response = analyze_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_response_tokens,
                    temperature=0.7,
                )
            )
            
            analysis = response.text
            print(f"[OK] Received analysis: {len(analysis)} characters")
        except Exception as api_error:
            error_msg = str(api_error)
            print(f"[ERROR] Gemini API Error: {error_msg}")
            
            # Better error messages
            if "rate limit" in error_msg.lower() or "quota" in error_msg.lower():
                raise HTTPException(status_code=429, detail="API rate limit exceeded. Please try again in a moment.")
            elif "invalid" in error_msg.lower() or "authentication" in error_msg.lower() or "api_key" in error_msg.lower():
                raise HTTPException(status_code=401, detail="API authentication failed. Please check your API key.")
            elif "token" in error_msg.lower() or "length" in error_msg.lower():
                raise HTTPException(status_code=400, detail="File is too large for analysis. Please try a smaller file or split it into multiple files.")
            else:
                raise HTTPException(status_code=500, detail=f"Gemini API error: {error_msg}")
        
        # Parse medical fields and save to database using deterministic parser
        if record_id:
            try:
                print(f"[PARSER] Parsing medical fields for record {record_id}...")
                
                # Use deterministic parser to extract fields
                parsed_data = parse_medical_report(all_text)
                fields_data = flatten_parsed_data(parsed_data)
                
                non_null_count = len([v for v in fields_data.values() if v is not None])
                print(f"[PARSER] Extracted {non_null_count}/{len(fields_data)} fields")
                
                # Debug: Show what was extracted
                print("[PARSER] Extracted fields:")
                for key, value in fields_data.items():
                    if value is not None:
                        print(f"  ✓ {key}: {value}")
                
                # Map parsed fields to database columns
                db_fields = {
                    # Patient Demographics
                    "patient_name": fields_data.get("patient_name"),
                    "age": fields_data.get("age"),
                    "gender": fields_data.get("gender"),
                    "blood_type": fields_data.get("blood_group"),
                    "date_of_birth": fields_data.get("date_of_birth"),
                    
                    # Vital Signs - NOW MAPPED FROM PARSER!
                    "blood_pressure": fields_data.get("blood_pressure"),
                    "heart_rate": fields_data.get("heart_rate"),
                    "temperature": fields_data.get("temperature"),
                    "weight": fields_data.get("weight"),
                    "height": fields_data.get("height"),
                    
                    # Metabolic Indicators
                    "bmi": None,  # Can calculate if weight/height available
                    "blood_sugar_fasting": fields_data.get("fasting_blood_sugar"),
                    "hemoglobin_a1c": fields_data.get("hba1c"),
                    "cholesterol_total": fields_data.get("total_cholesterol"),
                    "cholesterol_hdl": fields_data.get("hdl_cholesterol"),
                    "cholesterol_ldl": fields_data.get("ldl_cholesterol"),
                    "triglycerides": fields_data.get("triglycerides"),
                    
                    # Medical History - These need to be in actual documents to extract
                    "medications": None,
                    "allergies": None,
                    "chronic_conditions": None,
                    "recent_symptoms": None,
                    "family_history": None,
                    "smoking_status": None,
                    "alcohol_consumption": None,
                    "exercise_frequency": None,
                }
                
                # Debug: Show what will be saved to database
                fields_to_save = {k: v for k, v in db_fields.items() if v is not None}
                print(f"[PARSER] Saving {len(fields_to_save)} non-null fields to database:")
                for key, value in fields_to_save.items():
                    print(f"  → {key}: {value}")
                
                # Check if record exists, update or create
                existing_record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
                if existing_record:
                    # Update existing record
                    print(f"[DB] Updating existing record {record_id}")
                    for key, value in db_fields.items():
                        if hasattr(existing_record, key) and value is not None:
                            setattr(existing_record, key, value)
                    existing_record.extracted_text = all_text[:10000]  # Store first 10k chars
                    existing_record.file_names = ", ".join([f['filename'] for f in file_summaries])
                else:
                    # Create new record
                    print(f"[DB] Creating new record {record_id}")
                    new_record = MedicalRecord(
                        record_id=record_id,
                        extracted_text=all_text[:10000],
                        file_names=", ".join([f['filename'] for f in file_summaries]),
                        **db_fields
                    )
                    db.add(new_record)
                
                db.commit()
                print(f"[OK] Successfully saved parsed fields to database for record {record_id}")
                
                # Display final database record summary
                print(f"\n{'='*80}")
                print(f"DATABASE RECORD SUMMARY - Record ID: {record_id}")
                print(f"{'='*80}")
                
                # Query the record we just saved to show what's actually in the database
                saved_record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
                if saved_record:
                    print("\n[PATIENT DEMOGRAPHICS]:")
                    if saved_record.patient_name: print(f"  ✓ Patient Name: {saved_record.patient_name}")
                    if saved_record.age: print(f"  ✓ Age: {saved_record.age} years")
                    if saved_record.gender: print(f"  ✓ Gender: {saved_record.gender}")
                    if saved_record.blood_type: print(f"  ✓ Blood Type: {saved_record.blood_type}")
                    if saved_record.date_of_birth: print(f"  ✓ Date of Birth: {saved_record.date_of_birth}")
                    
                    print("\n[VITAL SIGNS]:")
                    vital_found = False
                    if saved_record.blood_pressure: 
                        print(f"  ✓ Blood Pressure: {saved_record.blood_pressure}")
                        vital_found = True
                    if saved_record.heart_rate: 
                        print(f"  ✓ Heart Rate: {saved_record.heart_rate} bpm")
                        vital_found = True
                    if saved_record.temperature: 
                        print(f"  ✓ Temperature: {saved_record.temperature} °F")
                        vital_found = True
                    if saved_record.weight: 
                        print(f"  ✓ Weight: {saved_record.weight} kg")
                        vital_found = True
                    if saved_record.height: 
                        print(f"  ✓ Height: {saved_record.height} cm")
                        vital_found = True
                    if not vital_found:
                        print("  (No vital signs found in document)")
                    
                    print("\n[METABOLIC INDICATORS]:")
                    if saved_record.bmi: print(f"  ✓ BMI: {saved_record.bmi}")
                    if saved_record.blood_sugar_fasting: print(f"  ✓ Fasting Blood Sugar: {saved_record.blood_sugar_fasting} mg/dL")
                    if saved_record.hemoglobin_a1c: print(f"  ✓ HbA1c: {saved_record.hemoglobin_a1c} %")
                    if saved_record.cholesterol_total: print(f"  ✓ Total Cholesterol: {saved_record.cholesterol_total} mg/dL")
                    if saved_record.cholesterol_hdl: print(f"  ✓ HDL Cholesterol: {saved_record.cholesterol_hdl} mg/dL")
                    if saved_record.cholesterol_ldl: print(f"  ✓ LDL Cholesterol: {saved_record.cholesterol_ldl} mg/dL")
                    if saved_record.triglycerides: print(f"  ✓ Triglycerides: {saved_record.triglycerides} mg/dL")
                    
                    print("\n[MEDICAL HISTORY]:")
                    history_found = False
                    if saved_record.medications: 
                        print(f"  ✓ Medications: {saved_record.medications}")
                        history_found = True
                    if saved_record.allergies: 
                        print(f"  ✓ Allergies: {saved_record.allergies}")
                        history_found = True
                    if saved_record.chronic_conditions: 
                        print(f"  ✓ Chronic Conditions: {saved_record.chronic_conditions}")
                        history_found = True
                    if saved_record.smoking_status: 
                        print(f"  ✓ Smoking Status: {saved_record.smoking_status}")
                        history_found = True
                    if saved_record.alcohol_consumption: 
                        print(f"  ✓ Alcohol Consumption: {saved_record.alcohol_consumption}")
                        history_found = True
                    if saved_record.exercise_frequency: 
                        print(f"  ✓ Exercise Frequency: {saved_record.exercise_frequency}")
                        history_found = True
                    if not history_found:
                        print("  (No medical history found in document)")
                    
                    # Count total fields populated
                    total_fields = 23  # Total medical fields in database
                    populated_fields = sum([
                        1 if saved_record.patient_name else 0,
                        1 if saved_record.age else 0,
                        1 if saved_record.gender else 0,
                        1 if saved_record.blood_type else 0,
                        1 if saved_record.date_of_birth else 0,
                        1 if saved_record.blood_pressure else 0,
                        1 if saved_record.heart_rate else 0,
                        1 if saved_record.temperature else 0,
                        1 if saved_record.weight else 0,
                        1 if saved_record.height else 0,
                        1 if saved_record.bmi else 0,
                        1 if saved_record.blood_sugar_fasting else 0,
                        1 if saved_record.hemoglobin_a1c else 0,
                        1 if saved_record.cholesterol_total else 0,
                        1 if saved_record.cholesterol_hdl else 0,
                        1 if saved_record.cholesterol_ldl else 0,
                        1 if saved_record.triglycerides else 0,
                        1 if saved_record.medications else 0,
                        1 if saved_record.allergies else 0,
                        1 if saved_record.chronic_conditions else 0,
                        1 if saved_record.smoking_status else 0,
                        1 if saved_record.alcohol_consumption else 0,
                        1 if saved_record.exercise_frequency else 0,
                    ])
                    
                    print(f"\n{'='*80}")
                    print(f"TOTAL: {populated_fields}/{total_fields} medical fields populated in database")
                    print(f"{'='*80}\n")
                
            except Exception as e:
                print(f"[ERROR] Failed to parse/save medical fields: {str(e)}")
                import traceback
                traceback.print_exc()
                # Don't fail the whole request if field extraction fails
        
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
        "api_configured": bool(api_key),
        "api_key_length": len(api_key) if api_key else 0,
        "api_key_preview": f"{api_key[:10]}...{api_key[-4:]}" if api_key else "None",
        "env_file_exists": env_path.exists(),
        "model_initialized": model is not None
    }

@app.get("/records")
async def get_all_records(db: Session = Depends(get_db)):
    """
    Get all medical records from the database
    """
    try:
        records = db.query(MedicalRecord).all()
        
        records_data = []
        for record in records:
            record_dict = {
                "id": record.id,
                "record_id": record.record_id,
                "upload_date": record.upload_date.isoformat() if record.upload_date else None,
                
                # Patient Demographics
                "patient_name": record.patient_name,
                "age": record.age,
                "gender": record.gender,
                "blood_type": record.blood_type,
                "date_of_birth": record.date_of_birth,
                
                # Vital Signs
                "blood_pressure": record.blood_pressure,
                "heart_rate": record.heart_rate,
                "temperature": record.temperature,
                "weight": record.weight,
                "height": record.height,
                
                # Metabolic Indicators
                "bmi": record.bmi,
                "blood_sugar_fasting": record.blood_sugar_fasting,
                "hemoglobin_a1c": record.hemoglobin_a1c,
                "cholesterol_total": record.cholesterol_total,
                "cholesterol_hdl": record.cholesterol_hdl,
                "cholesterol_ldl": record.cholesterol_ldl,
                "triglycerides": record.triglycerides,
                
                # Medical History
                "medications": record.medications,
                "allergies": record.allergies,
                "chronic_conditions": record.chronic_conditions,
                "recent_symptoms": record.recent_symptoms,
                "family_history": record.family_history,
                "smoking_status": record.smoking_status,
                "alcohol_consumption": record.alcohol_consumption,
                "exercise_frequency": record.exercise_frequency,
                
                # Files
                "file_names": record.file_names,
                "extracted_text_preview": record.extracted_text[:500] if record.extracted_text else None
            }
            records_data.append(record_dict)
        
        return {
            "success": True,
            "count": len(records_data),
            "records": records_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch records: {str(e)}")

@app.get("/records/{record_id}")
async def get_record_by_id(record_id: str, db: Session = Depends(get_db)):
    """
    Get a specific medical record by record_id
    """
    try:
        record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
        
        if not record:
            raise HTTPException(status_code=404, detail=f"Record {record_id} not found")
        
        return {
            "success": True,
            "record": {
                "id": record.id,
                "record_id": record.record_id,
                "upload_date": record.upload_date.isoformat() if record.upload_date else None,
                
                # Patient Demographics
                "patient_name": record.patient_name,
                "age": record.age,
                "gender": record.gender,
                "blood_type": record.blood_type,
                "date_of_birth": record.date_of_birth,
                
                # Vital Signs
                "blood_pressure": record.blood_pressure,
                "heart_rate": record.heart_rate,
                "temperature": record.temperature,
                "weight": record.weight,
                "height": record.height,
                
                # Metabolic Indicators
                "bmi": record.bmi,
                "blood_sugar_fasting": record.blood_sugar_fasting,
                "hemoglobin_a1c": record.hemoglobin_a1c,
                "cholesterol_total": record.cholesterol_total,
                "cholesterol_hdl": record.cholesterol_hdl,
                "cholesterol_ldl": record.cholesterol_ldl,
                "triglycerides": record.triglycerides,
                
                # Medical History
                "medications": record.medications,
                "allergies": record.allergies,
                "chronic_conditions": record.chronic_conditions,
                "recent_symptoms": record.recent_symptoms,
                "family_history": record.family_history,
                "smoking_status": record.smoking_status,
                "alcohol_consumption": record.alcohol_consumption,
                "exercise_frequency": record.exercise_frequency,
                
                # Raw Data
                "file_names": record.file_names,
                "extracted_text": record.extracted_text
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch record: {str(e)}")

