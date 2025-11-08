"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { setSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const patientFormSchema = z.object({
  patient_name: z
    .string()
    .min(1, "Patient name is required")
    .max(255, "Patient name must be less than 255 characters"),
  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Please enter a valid phone number (e.g., +1234567890)"
    ),
  trusted_contact_email: z.string().email("Please enter a valid email address"),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export function PatientForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      patient_name: "",
      phone_number: "",
      trusted_contact_email: "",
    },
  });

  async function onSubmit(values: PatientFormValues) {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create patient");
      }

      const data = await response.json();

      // Store session in localStorage (mock auth for hackathon)
      setSession({
        patientId: data.id,
        patientName: data.patient_name,
        phoneNumber: data.phone_number,
        trustedContactEmail: data.trusted_contact_email,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Patient Registration</CardTitle>
        <CardDescription>
          Register a new patient and provide trusted contact information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="patient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter patient name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    The full name of the patient being registered.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Patient&apos;s phone number (used for voice call identification).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trusted_contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trusted Contact Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="trusted@example.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Email address of the patient&apos;s trusted contact.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitMessage && (
              <div
                className={`rounded-md p-4 ${
                  submitMessage.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {submitMessage.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register Patient"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
