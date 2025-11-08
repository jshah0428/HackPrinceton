import { PatientForm } from "@/components/patient-form";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <PatientForm />
    </main>
  );
}
