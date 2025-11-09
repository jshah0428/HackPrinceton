export interface MedicalRecord {
  id: string;
  uploadDate: string;
  files: Array<{
    name: string;
    size: number;
    type: string;
  }>;
  analysis?: {
    success: boolean;
    analysis: string;
    files_processed?: any[];
    extracted_text_length?: number;
    total_size_mb?: number;
    analysis_length?: number;
  };
}

const STORAGE_KEY = 'medical_records';

export function saveMedicalRecord(record: Omit<MedicalRecord, 'id'>): MedicalRecord {
  const records = getAllMedicalRecords();
  const newRecord: MedicalRecord = {
    ...record,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  };
  
  records.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
}

export function getAllMedicalRecords(): MedicalRecord[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getMedicalRecordById(id: string): MedicalRecord | null {
  const records = getAllMedicalRecords();
  return records.find(r => r.id === id) || null;
}

export function deleteMedicalRecord(id: string): boolean {
  const records = getAllMedicalRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered.length < records.length;
}

export function updateMedicalRecordAnalysis(id: string, analysis: MedicalRecord['analysis']): boolean {
  const records = getAllMedicalRecords();
  const record = records.find(r => r.id === id);
  
  if (!record) return false;
  
  record.analysis = analysis;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return true;
}

