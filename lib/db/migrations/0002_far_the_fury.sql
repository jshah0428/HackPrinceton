ALTER TABLE "patients" ADD COLUMN "phone_number" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_phone_number_unique" UNIQUE("phone_number");