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
import { useEffect, useState } from "react";

export function Dashboard() {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [trustedEmail, setTrustedEmail] = useState("");

  useEffect(() => {
    const session = getSession();
    if (session) {
      setPatientName(session.patientName);
      setTrustedEmail(session.trustedContactEmail);
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {patientName}!</h1>
            <p className="text-slate-600 mt-1">
              Your trusted contact: {trustedEmail}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Voice Agent</CardTitle>
              <CardDescription>
                Describe your symptoms to our AI agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Voice Session</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Records</CardTitle>
              <CardDescription>
                Upload blood tests and medical documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">
                Upload Records
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                View and schedule doctor appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">
                Manage Appointments
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
              <CardDescription>
                View prescriptions and order medicines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">
                View Prescriptions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

