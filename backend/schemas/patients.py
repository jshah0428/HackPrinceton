from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
import uuid


class PatientCreate(BaseModel):
    """Schema for creating a patient"""
    patient_name: str = Field(..., min_length=1, max_length=255, description="Name of the patient")
    trusted_contact_email: EmailStr = Field(..., description="Email of the trusted contact")


class PatientResponse(BaseModel):
    """Schema for patient response"""
    id: uuid.UUID
    patient_name: str
    trusted_contact_email: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

