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
import { Upload, Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function Dashboard() {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [trustedEmail, setTrustedEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const session = getSession();
    if (session) {
      setPatientName(session.patientName);
      setTrustedEmail(session.trustedContactEmail);
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  const handleDropAreaClick = () => {
    fileInputRef.current?.click();
  };

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

      {/* Main Content - Split horizontally */}
      <div className="flex-1 flex flex-row gap-8 p-8">
        {/* Left Side - Document Upload */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">
                Upload Medical Documents
              </CardTitle>
              <CardDescription className="text-base">
                Upload your blood test results, medical records, and
                prescriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={() => {}}
              />
              <div
                onClick={handleDropAreaClick}
                className="border-2 border-dashed border-slate-300 rounded-lg p-12 w-full text-center hover:border-slate-400 transition-colors cursor-pointer"
              >
                <Upload className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  Drop your files here or click to browse
                </p>
                <p className="text-sm text-slate-500">
                  Supports PDF, PNG, JPG up to 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Voice Chat */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Voice Health Assistant</CardTitle>
              <CardDescription className="text-base">
                Describe your symptoms and get AI-powered health guidance
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1">
              <button
                className="group relative h-32 w-32 rounded-full bg-linear-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                onClick={() => {}}
              >
                <Mic className="h-16 w-16 text-white mx-auto" />
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 animate-pulse" />
              </button>
              <p className="text-lg font-medium text-slate-700 mt-6">
                Tap to start conversation
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Press and hold to speak
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
