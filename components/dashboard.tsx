"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession, clearSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

interface UploadStatus {
  fileName: string;
  status: "uploading" | "success" | "error";
  error?: string;
}

export function Dashboard() {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [trustedEmail, setTrustedEmail] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setMounted(true);
      const session = getSession();
      if (session) {
        setPatientName(session.patientName);
        setTrustedEmail(session.trustedContactEmail);
        setPatientId(session.patientId);
      }
    }, 0);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  const getDocumentType = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes("blood") || lowerName.includes("lab")) {
      return "blood_test";
    }
    if (
      lowerName.includes("prescription") ||
      lowerName.includes("medication")
    ) {
      return "prescription";
    }
    if (lowerName.includes("record") || lowerName.includes("report")) {
      return "lab_report";
    }
    return "medical_record";
  };

  const uploadFile = async (file: File) => {
    if (!patientId) {
      return { success: false, error: "Patient ID not found" };
    }

    const formData = new FormData();
    formData.append("patient_id", patientId);
    formData.append("document_type", getDocumentType(file.name));
    formData.append("file", file);

    try {
      const response = await fetch("/api/vapi/get-medical-history", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Upload failed" };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  };

  const handleFiles = async (files: File[]) => {
    if (!files || files.length === 0 || !patientId) return;

    setIsUploading(true);
    const newStatuses: UploadStatus[] = [];

    // Initialize statuses for all files
    files.forEach((file) => {
      newStatuses.push({
        fileName: file.name,
        status: "uploading",
      });
    });

    setUploadStatuses((prev) => [...prev, ...newStatuses]);

    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadFile(file);

      setUploadStatuses((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(
          (s) => s.fileName === file.name && s.status === "uploading"
        );
        if (index !== -1) {
          updated[index] = {
            fileName: file.name,
            status: result.success ? "success" : "error",
            error: result.error,
          };
        }
        return updated;
      });
    }

    setIsUploading(false);

    // Clear success messages after 3 seconds
    setTimeout(() => {
      setUploadStatuses((prev) => prev.filter((s) => s.status !== "success"));
    }, 3000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/json": [".json"],
    },
    multiple: true,
    disabled: isUploading || !patientId,
  });

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {patientName}!</h1>
            <p className="text-slate-600 text-sm mt-1">
              Trusted contact: {trustedEmail}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-4xl h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Medical Documents</CardTitle>
            <CardDescription className="text-base">
              Upload your blood test results, medical records, and prescriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 flex-1">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 w-full text-center transition-all cursor-pointer ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-slate-400"
              } ${isUploading || !patientId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <Loader2 className="h-16 w-16 mx-auto text-blue-500 mb-4 animate-spin" />
              ) : (
                <Upload className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              )}
              <p className="text-lg font-medium text-slate-700 mb-2">
                {isUploading
                  ? "Uploading files..."
                  : isDragActive
                    ? "Drop the files here..."
                    : "Drop your files here or click to browse"}
              </p>
              <p className="text-sm text-slate-500">
                Supports PDF, TXT, MD, JSON files
              </p>
            </div>

            {/* Upload Status List */}
            {uploadStatuses.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadStatuses.map((status, index) => (
                  <div
                    key={`${status.fileName}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    {status.status === "uploading" && (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                    )}
                    {status.status === "success" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    )}
                    {status.status === "error" && (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {status.fileName}
                      </p>
                      {status.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {status.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
