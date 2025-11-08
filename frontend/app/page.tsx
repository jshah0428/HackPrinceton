"use client";

import { PatientForm } from "@/components/patient-form";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <PatientForm />
    </main>
  );
}
