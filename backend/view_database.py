#!/usr/bin/env python3
"""
Simple script to view the contents of the medical_records.db database
Run this with: python view_database.py
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path

# Database file path
DB_PATH = Path(__file__).parent / "medical_records.db"

def format_value(value):
    """Format a value for display"""
    if value is None:
        return "NULL"
    if isinstance(value, str) and len(value) > 100:
        return f"{value[:100]}... (truncated)"
    return value

def view_all_records():
    """View all records in the database"""
    if not DB_PATH.exists():
        print(f"[X] Database not found at: {DB_PATH}")
        print("    Upload some medical records first to create the database.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    cursor = conn.cursor()
    
    # Get all records
    cursor.execute("SELECT * FROM medical_records")
    records = cursor.fetchall()
    
    if not records:
        print("\n[i] No records found in database")
        print("    Upload some medical records first.\n")
        return
    
    print(f"\n{'='*80}")
    print(f"MEDICAL RECORDS DATABASE - {len(records)} record(s) found")
    print(f"{'='*80}\n")
    
    for idx, record in enumerate(records, 1):
        print(f"{'-'*80}")
        print(f"RECORD #{idx} (ID: {record['record_id']})")
        print(f"{'-'*80}")
        
        # Patient Demographics
        print("\n[PATIENT DEMOGRAPHICS]:")
        print(f"   Name:          {format_value(record['patient_name'])}")
        print(f"   Age:           {format_value(record['age'])}")
        print(f"   Gender:        {format_value(record['gender'])}")
        print(f"   Blood Type:    {format_value(record['blood_type'])}")
        print(f"   Date of Birth: {format_value(record['date_of_birth'])}")
        
        # Vital Signs
        print("\n[VITAL SIGNS]:")
        print(f"   Blood Pressure: {format_value(record['blood_pressure'])}")
        print(f"   Heart Rate:     {format_value(record['heart_rate'])} bpm")
        print(f"   Temperature:    {format_value(record['temperature'])} F")
        print(f"   Weight:         {format_value(record['weight'])} kg")
        print(f"   Height:         {format_value(record['height'])} cm")
        
        # Metabolic Indicators
        print("\n[METABOLIC INDICATORS]:")
        print(f"   BMI:                 {format_value(record['bmi'])}")
        print(f"   Fasting Blood Sugar: {format_value(record['blood_sugar_fasting'])} mg/dL")
        print(f"   HbA1c:               {format_value(record['hemoglobin_a1c'])} %")
        print(f"   Total Cholesterol:   {format_value(record['cholesterol_total'])} mg/dL")
        print(f"   HDL Cholesterol:     {format_value(record['cholesterol_hdl'])} mg/dL")
        print(f"   LDL Cholesterol:     {format_value(record['cholesterol_ldl'])} mg/dL")
        print(f"   Triglycerides:       {format_value(record['triglycerides'])} mg/dL")
        
        # Medical History
        print("\n[MEDICAL HISTORY]:")
        print(f"   Medications:         {format_value(record['medications'])}")
        print(f"   Allergies:           {format_value(record['allergies'])}")
        print(f"   Chronic Conditions:  {format_value(record['chronic_conditions'])}")
        print(f"   Recent Symptoms:     {format_value(record['recent_symptoms'])}")
        print(f"   Family History:      {format_value(record['family_history'])}")
        print(f"   Smoking Status:      {format_value(record['smoking_status'])}")
        print(f"   Alcohol:             {format_value(record['alcohol_consumption'])}")
        print(f"   Exercise:            {format_value(record['exercise_frequency'])}")
        
        # Files
        print("\n[FILES]:")
        print(f"   File Names:    {format_value(record['file_names'])}")
        print(f"   Upload Date:   {format_value(record['upload_date'])}")
        
        # Count non-null fields
        non_null_fields = sum(1 for key in record.keys() if record[key] is not None and key not in ['id', 'record_id', 'upload_date', 'extracted_text', 'file_names'])
        total_fields = 23  # Total medical fields
        print(f"\n[OK] Extracted {non_null_fields}/{total_fields} medical fields")
        
        print()
    
    print(f"{'='*80}\n")
    
    conn.close()

def view_record_by_id(record_id: str):
    """View a specific record by ID"""
    if not DB_PATH.exists():
        print(f"[X] Database not found at: {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM medical_records WHERE record_id = ?", (record_id,))
    record = cursor.fetchone()
    
    if not record:
        print(f"[X] No record found with ID: {record_id}")
        conn.close()
        return
    
    print(f"\n{'='*80}")
    print(f"MEDICAL RECORD DETAILS")
    print(f"{'='*80}\n")
    
    for key in record.keys():
        if key == 'extracted_text':
            text = record[key]
            if text:
                print(f"{key:20s}: {text[:200]}... ({len(text)} chars)")
            else:
                print(f"{key:20s}: NULL")
        else:
            print(f"{key:20s}: {format_value(record[key])}")
    
    print()
    conn.close()

def export_to_json():
    """Export all records to JSON file"""
    if not DB_PATH.exists():
        print(f"[X] Database not found at: {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM medical_records")
    records = cursor.fetchall()
    
    # Convert to list of dicts
    records_list = [dict(record) for record in records]
    
    # Save to JSON
    output_file = Path(__file__).parent / "database_export.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(records_list, f, indent=2, default=str)
    
    print(f"[OK] Exported {len(records_list)} record(s) to: {output_file}")
    
    conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "export":
            export_to_json()
        elif command == "view" and len(sys.argv) > 2:
            view_record_by_id(sys.argv[2])
        else:
            print("Usage:")
            print("  python view_database.py          - View all records")
            print("  python view_database.py export   - Export to JSON")
            print("  python view_database.py view <id> - View specific record")
    else:
        view_all_records()

