# How to View Database Contents

There are **3 ways** to view the contents of your `medical_records.db` database:

## 🚀 Method 1: API Endpoints (Recommended)

The backend now has API endpoints to view records:

### View All Records
```bash
# In your browser or use curl:
http://localhost:8000/records
```

Or with curl:
```bash
curl http://localhost:8000/records
```

### View Specific Record
```bash
http://localhost:8000/records/{record_id}
```

Example:
```bash
curl http://localhost:8000/records/123e4567-e89b-12d3-a456-426614174000
```

## 🐍 Method 2: Python Script (Quick Debug)

Run the included Python script:

```bash
cd backend

# View all records with nice formatting
python view_database.py

# Export to JSON file
python view_database.py export

# View specific record by ID
python view_database.py view <record_id>
```

## 🔍 Method 3: SQLite Browser Tools

Download and install a SQLite browser:
- **DB Browser for SQLite**: https://sqlitebrowser.org/
- **SQLiteStudio**: https://sqlitestudio.pl/

Then open the database file:
```
backend/medical_records.db
```

## 📊 What's in the Database?

Each record contains these fields:

### Patient Demographics (5 fields)
- patient_name
- age
- gender
- blood_type
- date_of_birth

### Vital Signs (5 fields)
- blood_pressure
- heart_rate
- temperature
- weight
- height

### Metabolic Indicators (7 fields)
- bmi
- blood_sugar_fasting
- hemoglobin_a1c
- cholesterol_total
- cholesterol_hdl
- cholesterol_ldl
- triglycerides

### Medical History (8 fields)
- medications
- allergies
- chronic_conditions
- recent_symptoms
- family_history
- smoking_status
- alcohol_consumption
- exercise_frequency

### Raw Data
- extracted_text (full text from uploaded files)
- file_names (list of uploaded files)

## 🐛 Debugging Parser Issues

To see what the parser is extracting:

1. Check the backend console logs when uploading files
2. Look for lines starting with `[PARSER]` and `[MATCH]`
3. Use the Python script to see what's actually in the database:
   ```bash
   python view_database.py
   ```

## 🔧 Testing the Parser

If fields aren't being extracted:

1. **Check the console logs** for `[PARSER]` and `[MATCH]` messages
2. **View the database** to see what was actually saved
3. **Look at the extracted text** in the database to see if it matches your regex patterns
4. **Update parser.py** with better regex patterns for your specific document format

## 💡 Example Usage

```bash
# Start the backend
cd backend
python -m uvicorn main:app --reload

# In another terminal, view the database
cd backend
python view_database.py

# Or visit in browser:
# http://localhost:8000/records
```

