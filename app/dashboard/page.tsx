"use client";

import { Dashboard } from "@/components/dashboard";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/session";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  // If not authenticated, the effect will redirect
  // Show dashboard immediately (client-side check)
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return <Dashboard />;
}
