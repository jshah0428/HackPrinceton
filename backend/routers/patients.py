from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.database import get_db
from db.models import Patient
from schemas.patients import PatientCreate, PatientResponse

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientResponse, status_code=201)
async def create_patient(patient: PatientCreate, db: AsyncSession = Depends(get_db)):
    """Create a new patient with trusted contact information"""
    try:
        new_patient = Patient(
            patient_name=patient.patient_name,
            trusted_contact_email=patient.trusted_contact_email
        )
        db.add(new_patient)
        await db.commit()
        await db.refresh(new_patient)
        return new_patient
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create patient: {str(e)}")


@router.get("", response_model=list[PatientResponse])
async def get_patients(db: AsyncSession = Depends(get_db)):
    """Get all patients"""
    result = await db.execute(select(Patient))
    patients = result.scalars().all()
    return patients

