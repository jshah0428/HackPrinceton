import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { medicalHistory, patients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { LlamaParseReader } from "llama-cloud-services";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { Document } from "@llamaindex/core/schema";

// GET /api/vapi/get-medical-history - Retrieve medical history for a patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");

    if (!patientId) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    // Verify patient exists
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get all medical history for the patient
    const history = await db
      .select()
      .from(medicalHistory)
      .where(eq(medicalHistory.patientId, patientId))
      .orderBy(medicalHistory.createdAt);

    return NextResponse.json({
      patient_id: patientId,
      patient_name: patient.patientName,
      medical_history: history.map((entry) => ({
        id: entry.id,
        content: entry.content,
        document_type: entry.documentType,
        metadata: entry.metadata,
        created_at: entry.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching medical history:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical history" },
      { status: 500 }
    );
  }
}

// POST /api/vapi/get-medical-history - Upload medical history document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const patientId = formData.get("patient_id") as string;
    const documentType = formData.get("document_type") as string;
    const textContent = formData.get("content") as string | null;
    const fileContent = formData.get("file_content") as string | null; // Base64 encoded
    const file = formData.get("file") as File | null;
    const metadataStr = formData.get("metadata") as string | null;

    // Validate required fields
    if (!patientId || !documentType) {
      return NextResponse.json(
        {
          error:
            "patient_id and document_type are required. Optionally provide: content (text), file_content (base64), or file (file upload)",
        },
        { status: 400 }
      );
    }

    // Verify patient exists
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    let parsedText = "";
    let metadata: Record<string, unknown> | null = null;
    let tempFilePath: string | null = null;

    // Parse metadata if provided
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Initialize LlamaParse
    const llamaCloudApiKey = process.env.LLAMA_CLOUD_API_KEY;
    if (!llamaCloudApiKey) {
      return NextResponse.json(
        { error: "LLAMA_CLOUD_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const parser = new LlamaParseReader({
      apiKey: llamaCloudApiKey,
      resultType: "markdown", // Get markdown output for better structure
      verbose: true,
    });

    // Handle different input types
    if (textContent) {
      // Direct text content - use as is
      parsedText = textContent;
    } else if (fileContent) {
      // Base64 encoded content
      try {
        const buffer = Buffer.from(fileContent, "base64");
        const fileName = "document.pdf"; // Default to PDF for base64
        tempFilePath = join(tmpdir(), `temp-${Date.now()}-${fileName}`);
        await writeFile(tempFilePath, buffer);

        // Parse with LlamaParse
        const documents = await parser.loadData(tempFilePath);
        parsedText = documents.map((doc: Document) => doc.text).join("\n\n");

        if (!metadata) metadata = {};
        // Page count will be based on documents returned

        // Clean up temp file
        await unlink(tempFilePath).catch(() => {});
        tempFilePath = null;
      } catch (error) {
        if (tempFilePath) {
          await unlink(tempFilePath).catch(() => {});
        }
        return NextResponse.json(
          {
            error: `Failed to parse document: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 400 }
        );
      }
    } else if (file) {
      // File upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = file.name;

      // Determine file type
      const lowerFileName = fileName.toLowerCase();
      if (
        lowerFileName.endsWith(".txt") ||
        lowerFileName.endsWith(".md") ||
        lowerFileName.endsWith(".json")
      ) {
        // Plain text files - read directly
        parsedText = buffer.toString("utf-8");
        if (!metadata) metadata = {};
        metadata.file_name = file.name;
        metadata.file_size = file.size;
      } else if (lowerFileName.endsWith(".pdf")) {
        // PDF files - parse with LlamaParse
        try {
          tempFilePath = join(tmpdir(), `temp-${Date.now()}-${fileName}`);
          await writeFile(tempFilePath, buffer);

          // Parse with LlamaParse
          const documents = await parser.loadData(tempFilePath);
          parsedText = documents.map((doc: Document) => doc.text).join("\n\n");

          if (!metadata) metadata = {};
          metadata.file_name = file.name;
          metadata.file_size = file.size;
          metadata.page_count = documents.length;

          // Clean up temp file
          await unlink(tempFilePath).catch(() => {});
          tempFilePath = null;
        } catch (error) {
          if (tempFilePath) {
            await unlink(tempFilePath).catch(() => {});
          }
          return NextResponse.json(
            {
              error: `Failed to parse PDF file: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              "Unsupported file type. Supported: PDF, TXT, MD, JSON, or provide text content directly",
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "No content provided. Provide one of: content (text), file_content (base64), or file (file upload)",
        },
        { status: 400 }
      );
    }

    if (!parsedText.trim()) {
      return NextResponse.json(
        { error: "No text content could be extracted from the provided input" },
        { status: 400 }
      );
    }

    // Extract key points using Claude Sonnet 4.5
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    let extractedText = "";
    try {
      const { text } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"), // Claude Sonnet 4.5
        prompt: `You are a medical document analysis expert. Your task is to meticulously extract ALL key points and important information from the following medical document. Be extremely detailed and thorough - extract every piece of relevant medical information including:

- Patient demographics and identifiers
- Medical history and conditions
- Current medications and dosages
- Lab results, test values, and reference ranges
- Vital signs and measurements
- Diagnoses and clinical findings
- Treatment plans and recommendations
- Dates and timelines
- Provider information
- Any abnormal findings or concerns
- Follow-up instructions
- Allergies and adverse reactions
- Family medical history if mentioned
- Lifestyle factors if mentioned
- Any other medically relevant information

Be comprehensive and detailed. Extract information in a clear, structured format that preserves all important details.

Medical Document:
${parsedText}

Extract all key points and important information:`,
      });

      extractedText = text;
    } catch (error) {
      console.error("Error extracting key points with AI:", error);
      // Fallback to parsed text if AI extraction fails
      extractedText = parsedText;
      if (!metadata) metadata = {};
      metadata.ai_extraction_error =
        error instanceof Error ? error.message : "Unknown error";
    }

    // Save to database
    const [newHistory] = await db
      .insert(medicalHistory)
      .values({
        patientId,
        content: extractedText,
        documentType,
        metadata,
      })
      .returning();

    return NextResponse.json(
      {
        id: newHistory.id,
        patient_id: newHistory.patientId,
        document_type: newHistory.documentType,
        content_preview: extractedText.substring(0, 200) + "...",
        metadata: newHistory.metadata,
        created_at: newHistory.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading medical history:", error);
    return NextResponse.json(
      { error: "Failed to upload medical history" },
      { status: 500 }
    );
  }
}
