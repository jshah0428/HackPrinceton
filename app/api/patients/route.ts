import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients } from "@/lib/db/schema";

// GET /api/patients - Get all patients
export async function GET() {
  try {
    const allPatients = await db.select().from(patients);
    return NextResponse.json(
      allPatients.map((patient) => ({
        id: patient.id,
        patient_name: patient.patientName,
        trusted_contact_email: patient.trustedContactEmail,
        created_at: patient.createdAt,
        updated_at: patient.updatedAt,
      })),
    );
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 },
    );
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_name, trusted_contact_email } = body;

    // Validate input
    if (!patient_name || !trusted_contact_email) {
      return NextResponse.json(
        { error: "patient_name and trusted_contact_email are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trusted_contact_email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Insert patient
    const [newPatient] = await db
      .insert(patients)
      .values({
        patientName: patient_name,
        trustedContactEmail: trusted_contact_email,
      })
      .returning();

    return NextResponse.json(
      {
        id: newPatient.id,
        patient_name: newPatient.patientName,
        trusted_contact_email: newPatient.trustedContactEmail,
        created_at: newPatient.createdAt,
        updated_at: newPatient.updatedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 },
    );
  }
}
