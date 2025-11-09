from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database setup
DATABASE_URL = "sqlite:///./medical_records.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String, unique=True, index=True)  # UUID from frontend
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # Patient Demographics (Fields 1-5)
    patient_name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    blood_type = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)
    
    # Vital Signs (Fields 6-10)
    blood_pressure = Column(String, nullable=True)  # e.g., "120/80"
    heart_rate = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)  # in kg
    height = Column(Float, nullable=True)  # in cm
    
    # Metabolic Indicators (Fields 11-17)
    bmi = Column(Float, nullable=True)
    blood_sugar_fasting = Column(Float, nullable=True)  # mg/dL
    hemoglobin_a1c = Column(Float, nullable=True)  # %
    cholesterol_total = Column(Float, nullable=True)  # mg/dL
    cholesterol_hdl = Column(Float, nullable=True)  # mg/dL (good cholesterol)
    cholesterol_ldl = Column(Float, nullable=True)  # mg/dL (bad cholesterol)
    triglycerides = Column(Float, nullable=True)  # mg/dL
    
    # Medical History (Fields 18-20+)
    medications = Column(Text, nullable=True)  # Comma-separated list
    allergies = Column(Text, nullable=True)  # Comma-separated list
    chronic_conditions = Column(Text, nullable=True)  # Comma-separated list
    recent_symptoms = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    smoking_status = Column(String, nullable=True)  # Never/Former/Current
    alcohol_consumption = Column(String, nullable=True)  # None/Light/Moderate/Heavy
    exercise_frequency = Column(String, nullable=True)  # e.g., "3 times per week"
    
    # Raw data
    extracted_text = Column(Text, nullable=True)  # Full extracted text
    file_names = Column(Text, nullable=True)  # Comma-separated file names

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

