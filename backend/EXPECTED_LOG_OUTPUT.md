# Expected Log Output When Uploading Files

When you upload a medical document through the frontend, you will now see a **complete audit trail** in your backend console.

## Complete Example Log Output

```
################################################################################
# NEW FILE UPLOAD - Record ID: 1762654930470m18im8ksb
# Files: patient_blood_test.pdf
################################################################################

Processing file: patient_blood_test.pdf (0.85MB)
Extracted 12543 characters from patient_blood_test.pdf
Total extracted text length: 12543 characters

Sending 12543 characters to Gemini API...
Prompt length: 2456 characters
Using API key: AIzaSyB...xY4z

[OK] Received analysis: 3421 characters

[PARSER] Parsing medical fields for record 1762654930470m18im8ksb...

[PARSER] Starting to parse medical report...
[PARSER] Text length: 12543 characters
    [MATCH] Found field: John Doe
    [MATCH] Found value: 35 
    [MATCH] Found field: Male
    [MATCH] Found value: 120.5 mg/dL
    [MATCH] Found value: 6.8 %
    [MATCH] Found value: 185.0 mg/dL
    [MATCH] Found value: 55.0 mg/dL
    [MATCH] Found value: 95.0 mg/dL
    [MATCH] Found value: 145.0 mg/dL

[PARSER] Successfully extracted 15/40 fields

[PARSER] Extracted fields:
  ✓ patient_name: John Doe
  ✓ age: 35
  ✓ gender: Male
  ✓ blood_group: A Positive
  ✓ date_of_birth: 15-Jan-1988
  ✓ fasting_blood_sugar: 120.5
  ✓ hba1c: 6.8
  ✓ total_cholesterol: 185.0
  ✓ hdl_cholesterol: 55.0
  ✓ ldl_cholesterol: 95.0
  ✓ triglycerides: 145.0
  ✓ hemoglobin: 14.2
  ✓ wbc_count: 7500.0
  ✓ platelet_count: 250000.0
  ✓ creatinine: 0.9

[PARSER] Saving 15 non-null fields to database:
  → patient_name: John Doe
  → age: 35
  → gender: Male
  → blood_type: A Positive
  → date_of_birth: 15-Jan-1988
  → blood_sugar_fasting: 120.5
  → hemoglobin_a1c: 6.8
  → cholesterol_total: 185.0
  → cholesterol_hdl: 55.0
  → cholesterol_ldl: 95.0
  → triglycerides: 145.0

[DB] Creating new record 1762654930470m18im8ksb
[OK] Successfully saved parsed fields to database for record 1762654930470m18im8ksb

================================================================================
DATABASE RECORD SUMMARY - Record ID: 1762654930470m18im8ksb
================================================================================

[PATIENT DEMOGRAPHICS]:
  ✓ Patient Name: John Doe
  ✓ Age: 35 years
  ✓ Gender: Male
  ✓ Blood Type: A Positive
  ✓ Date of Birth: 15-Jan-1988

[VITAL SIGNS]:
  (No vital signs found in document)

[METABOLIC INDICATORS]:
  ✓ Fasting Blood Sugar: 120.5 mg/dL
  ✓ HbA1c: 6.8 %
  ✓ Total Cholesterol: 185.0 mg/dL
  ✓ HDL Cholesterol: 55.0 mg/dL
  ✓ LDL Cholesterol: 95.0 mg/dL
  ✓ Triglycerides: 145.0 mg/dL

[MEDICAL HISTORY]:
  (No medical history found in document)

================================================================================
TOTAL: 11/23 medical fields populated in database
================================================================================
```

---

## What Each Section Tells You

### 1. **Upload Header** (`#####`)
- Shows which record is being processed
- Lists all uploaded files
- Marks the start of a new upload

### 2. **File Processing**
- File size and extraction progress
- Total characters extracted
- Confirms text was successfully read from PDF/image

### 3. **AI Analysis**
- Gemini API call details
- Response length
- Confirms AI analysis completed

### 4. **Parser Extraction** (`[PARSER]`)
- Real-time regex matches as they're found
- **`[MATCH]`** - Shows each field as it's extracted
- Total fields extracted from document

### 5. **Extracted Fields List**
- Complete list of all non-null values found
- Shows the raw data before database mapping

### 6. **Database Saving** (`→`)
- Shows exactly what values are being saved
- Confirms database operation (create vs update)
- Success confirmation

### 7. **Final Summary** (`DATABASE RECORD SUMMARY`)
- **Complete database record** grouped by category
- Shows only populated fields
- Indicates missing sections with messages
- **Final count**: X/23 fields populated

---

## How to Use This Information

### ✅ **If Fields Are Populated**
You'll see them in the final summary with checkmarks (✓)

### ❌ **If Fields Are Missing**
1. Check if `[MATCH]` appeared for that field during parsing
2. If no match, the field isn't in your document
3. If match appeared but not saved, check the field mapping in code

### 🔍 **Debugging Tips**

**Problem**: Field shows `[MATCH]` but doesn't appear in final summary
- Check the "Saving X fields to database" section
- The field name might be mapped incorrectly

**Problem**: No `[MATCH]` for expected field
- The regex pattern needs adjustment for your document format
- Share the document format for custom regex patterns

**Problem**: Shows "No vital signs found"
- These fields simply aren't in your test document
- Try uploading a document with vital signs (BP, weight, height, etc.)

---

## Quick Test

After restarting your backend:

```bash
cd backend
python -m uvicorn main:app --reload
```

Upload a document and watch your console. You should see:
1. ✅ Upload header with record ID
2. ✅ File processing progress
3. ✅ Parser matches as they happen
4. ✅ Complete database summary at the end
5. ✅ Field count (X/23)

The logs tell you **exactly** what's happening at every step!

