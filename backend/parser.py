import re
from typing import Dict, Any, Optional, List

def extract_field(text: str, pattern: str, flags=re.IGNORECASE) -> Optional[str]:
    """Extract a single field using regex pattern"""
    match = re.search(pattern, text, flags)
    if match:
        result = match.group(1).strip()
        print(f"    [MATCH] Found field: {result[:50]}...")
        return result
    return None

def extract_value(text: str, pattern: str, unit: str, flags=re.MULTILINE) -> Dict[str, Any]:
    """Extract a value with its unit"""
    match = re.search(pattern, text, flags | re.IGNORECASE)
    if match:
        value_str = match.group(1).strip()
        print(f"    [MATCH] Found value: {value_str} {unit}")
        # Try to convert to float
        try:
            # Remove common non-numeric characters
            cleaned = re.sub(r'[<>≤≥~±\s]', '', value_str)
            value = float(cleaned)
            return {"value": value, "unit": unit}
        except ValueError:
            print(f"    [WARN] Could not convert '{value_str}' to float")
            return {"value": value_str, "unit": unit}
    return {"value": None, "unit": unit}

def normalize_text(text: str) -> str:
    """
    Pre-clean PDF extracted text to remove repeated headers/footers
    and collapse excessive whitespace.
    """
    cleaned_lines: List[str] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        # Remove footer/header artifacts like "Page 1 of ..." or hard-coded footer names
        if re.match(r'^Page\s+\d+\s+of\b', line, re.IGNORECASE):
            continue
        if re.search(r'hardik', line, re.IGNORECASE):
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)

def extract_age(text: str) -> Optional[str]:
    """Special extractor for age supporting multiple formats like 'Sex/Age : Male / 41 Y'"""
    age_patterns = [
        r'(?:Age|AGE)\s*[:\-]?\s*(\d+)\s*(?:Y|Years?|yrs?)?',
        r'(?:Male|Female|M|F)\s*/\s*(\d+)\s*(?:Y|Years?|yrs?).{0,40}?Sex\s*/?\s*Age',
        r'Sex\s*/?\s*Age\s*[:\-]?\s*(?:Male|Female|M|F)\s*/\s*(\d+)\s*(?:Y|Years?|yrs?)?',
        r'Age\s*\(?(?:Years|Yrs)\)?\s*[:\-]?\s*(\d+)'
    ]
    for pattern in age_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            print(f"    [MATCH] Found age: {value}")
            return value
    return None

def extract_patient_name(text: str) -> Optional[str]:
    """Extract patient name preferring 'Patient Information' block."""
    name_patterns = [
        r'Patient\s+Information\s*[:\-]?\s*([A-Za-z\s\.]+?)\s+Name\b',
        r'Name\s*[:\-]\s*([A-Za-z\s\.]+?)(?:\s+(?:Sex|Age|Client|Lab|Registration|Ref|DOB)|\n)',
        r'Patient\s*Name\s*[:\-]\s*([A-Za-z\s\.]+)'
    ]
    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            print(f"    [MATCH] Found patient name: {name}")
            return name
    return None

def parse_medical_report(text: str) -> Dict[str, Any]:
    """
    Parse medical report text and extract all relevant fields.
    Improved with more flexible patterns and better variation handling.
    """
    print("\n[PARSER] Starting to parse medical report...")
    print(f"[PARSER] Text length: {len(text)} characters")
    
    normalized_text = normalize_text(text)

    data = {
        # ===== PATIENT INFORMATION =====
        "patient_name": extract_patient_name(normalized_text),
        "age": extract_age(normalized_text),
        "gender": extract_field(normalized_text, r'\b(Male|Female|M|F)\b', re.IGNORECASE),
        "date_of_birth": extract_field(normalized_text, r'(?:DOB|Date\s+of\s+Birth|Birth\s+Date)\s*[:\-]?\s*(\d{1,2}[-/]\w{3,10}[-/]\d{2,4})', re.IGNORECASE),
        
        # ===== VITAL SIGNS =====
        "blood_pressure": extract_field(normalized_text, r'(?:BP|Blood\s+Pressure)\s*[:\-]?\s*(\d{2,3}/\d{2,3})', re.IGNORECASE),
        "heart_rate": extract_value(normalized_text, r'(?:Heart\s+Rate|Pulse|HR)\s*[:\-]?\s*(\d+\.?\d*)', 'bpm'),
        "temperature": extract_value(normalized_text, r'(?:Temperature|Temp)\s*[:\-]?\s*(\d+\.?\d*)', '°F'),
        "weight": extract_value(normalized_text, r'(?:Weight|Wt)\s*[:\-]?\s*(\d+\.?\d*)', 'kg'),
        "height": extract_value(normalized_text, r'(?:Height|Ht)\s*[:\-]?\s*(\d+\.?\d*)', 'cm'),
        
        # ===== COMPLETE BLOOD COUNT (CBC) =====
        "hemoglobin": extract_value(normalized_text, r'(?:Hemoglobin|Haemoglobin|Hb|HGB)\s*[:\-]?\s*(\d+\.?\d*)', 'g/dL'),
        "rbc_count": extract_value(normalized_text, r'(?:RBC\s+Count|Red\s+Blood\s+Cell|RBC)\s*[:\-]?\s*(\d+\.?\d*)', 'million/cmm'),
        "wbc_count": extract_value(normalized_text, r'(?:WBC\s+Count|White\s+Blood\s+Cell|WBC|Total\s+Leukocyte)\s*[:\-]?\s*(\d+\.?\d*)', '/cmm'),
        "platelet_count": extract_value(normalized_text, r'(?:Platelet\s+Count|Platelets?)\s*[:\-]?\s*(\d+\.?\d*)', '/cmm'),
        
        # ===== BLOOD SUGAR & DIABETES =====
        "fasting_blood_sugar": extract_value(normalized_text, r'(?:Fasting\s+(?:Blood\s+)?(?:Glucose|Sugar)|FBS|FBG)\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        "hba1c": extract_value(normalized_text, r'(?:HbA1c|Hemoglobin\s+A1c|Glycated\s+Hemoglobin)\s*[:\-]?\s*(\d+\.?\d*)', '%'),
        "mean_blood_glucose": extract_value(normalized_text, r'(?:Mean\s+Blood\s+Glucose|Average\s+Glucose|MBG)\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        
        # ===== LIPID PROFILE =====
        "total_cholesterol": extract_value(normalized_text, r'(?:Total\s+)?Cholesterol(?!\s*(?:HDL|LDL|Ratio))\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        "triglycerides": extract_value(normalized_text, r'(?:Triglycerides?|TG)\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        "hdl_cholesterol": extract_value(normalized_text, r'(?:HDL|High\s+Density\s+Lipoprotein)(?:\s+Cholesterol)?\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        "ldl_cholesterol": extract_value(normalized_text, r'(?:LDL|Low\s+Density\s+Lipoprotein|Direct\s+LDL)(?:\s+Cholesterol)?\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        
        # ===== THYROID FUNCTION =====
        "tsh": extract_value(normalized_text, r'(?:TSH|Thyroid\s+Stimulating\s+Hormone)\s*[:\-]?\s*(\d+\.?\d*)', 'microIU/mL'),
        "t3": extract_value(normalized_text, r'(?:T3|Triiodothyronine)(?!\d)\s*[:\-]?\s*(\d+\.?\d*)', 'ng/mL'),
        "t4": extract_value(normalized_text, r'(?:T4|Thyroxine)(?!\d)\s*[:\-]?\s*(\d+\.?\d*)', 'µg/dL'),
        
        # ===== KIDNEY FUNCTION =====
        "creatinine": extract_value(normalized_text, r'(?:Creatinine|Serum\s+Creatinine)\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        "urea": extract_value(normalized_text, r'(?:Blood\s+Urea|Urea\s+Nitrogen|BUN|Urea)\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        "uric_acid": extract_value(normalized_text, r'(?:Uric\s+Acid|Urate)\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        
        # ===== LIVER FUNCTION =====
        "sgpt": extract_value(normalized_text, r'(?:SGPT|ALT|Alanine\s+Aminotransferase)\s*[:\-]?\s*(\d+\.?\d*)', 'U/L'),
        "sgot": extract_value(normalized_text, r'(?:SGOT|AST|Aspartate\s+Aminotransferase)\s*[:\-]?\s*(\d+\.?\d*)', 'U/L'),
        
        # ===== VITAMINS & MINERALS =====
        "vitamin_d": extract_value(normalized_text, r'(?:25\s*\(OH\)\s*)?(?:Vitamin\s+D|Vit\s*D)\s*[:\-]?\s*(\d+\.?\d*)', 'ng/mL'),
        "vitamin_b12": extract_value(normalized_text, r'(?:Vitamin\s+B12|Vit\s*B12|Cobalamin)\s*[:\-]?\s*(\d+\.?\d*)', 'pg/mL'),
        "calcium": extract_value(normalized_text, r'(?:Serum\s+)?Calcium\s*[:\-]?\s*(\d+\.?\d*)', 'mg/dL'),
        "iron": extract_value(normalized_text, r'(?:Serum\s+)?Iron\s*[:\-]?\s*(\d+\.?\d*)', 'µg/dL'),
        
        # ===== BLOOD GROUP =====
        "blood_group": extract_field(normalized_text, r'(?:Blood\s+Group|Blood\s+Type|ABO\s+Type)\s*[:\-]?\s*([ABO]+[\+\-]?|O\+|O-|A\+|A-|B\+|B-|AB\+|AB-)', re.IGNORECASE),
        "rh_type": extract_field(normalized_text, r'(?:Rh|Rh\s*\(D\))\s*(?:Type|Factor)?\s*[:\-]?\s*(Positive|Negative|POS|NEG|\+|\-)', re.IGNORECASE),
        
        # ===== OTHER BIOMARKERS =====
        "homocysteine": extract_value(normalized_text, r'Homocysteine\s*[:\-]?\s*(\d+\.?\d*)', 'µmol/L'),
        "psa": extract_value(normalized_text, r'(?:PSA|Prostate\s+Specific\s+Antigen)\s*[:\-]?\s*(\d+\.?\d*)', 'ng/mL'),
        "ige": extract_value(normalized_text, r'(?:IgE|Immunoglobulin\s+E)\s*[:\-]?\s*(\d+\.?\d*)', 'IU/mL'),
        
        # ===== INFECTION MARKERS =====
        "hiv_status": extract_field(normalized_text, r'HIV.*?(?:Result|Interpretation|Status)\s*[:\-]?\s*(Positive|Negative|Reactive|Non-Reactive)', re.IGNORECASE),
        "hbsag_status": extract_field(normalized_text, r'HBsAg.*?(?:Result|Interpretation|Status)\s*[:\-]?\s*(Positive|Negative|Reactive|Non-Reactive)', re.IGNORECASE),
    }
    
    # Count successful extractions
    extracted_count = sum(1 for v in data.values() if v not in [None, {"value": None, "unit": None}])
    print(f"\n[PARSER] Successfully extracted {extracted_count}/{len(data)} fields")
    
    return data

def flatten_parsed_data(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Flatten parsed data for database storage
    Converts {"field": {"value": x, "unit": y}} to {"field": x, "field_unit": y}
    """
    flattened = {}
    for key, value in parsed_data.items():
        if isinstance(value, dict) and "value" in value:
            flattened[key] = value["value"]
        else:
            flattened[key] = value
    return flattened

