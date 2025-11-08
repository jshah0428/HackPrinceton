import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/patients/by-phone?phone_number=<phone> - Get patient by phone number
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get("phone_number");

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phone_number query parameter is required" },
        { status: 400 },
      );
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Find patient by phone number
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.phoneNumber, normalizedPhone))
      .limit(1);

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found with the provided phone number" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: patient.id,
      patient_name: patient.patientName,
      phone_number: patient.phoneNumber,
      trusted_contact_email: patient.trustedContactEmail,
      created_at: patient.createdAt,
      updated_at: patient.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching patient by phone number:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 },
    );
  }
}

