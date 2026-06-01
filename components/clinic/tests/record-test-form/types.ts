import type { Appointment, Patient, ClinicalTest, TestResult } from "@/lib/types/database"

// Define type for appointment option in the form
export interface AppointmentOption {
  id: string;
  display: string;
  appointment_time: string;
  appointment_date: string;
  patient_id: string;
  patient_name: string;
  status: string;
  appointment_type?: string;
  employer_id?: string | null;
}

// Define props for the component
export interface RecordTestFormProps {
  initialAppointments?: (Appointment & { patient?: Patient })[];
  initialTests?: ClinicalTest[];
}

// Props for individual test forms
export interface TestFormProps {
  onChange: (data: Record<string, any>) => void;
  value?: Record<string, any>;
}

// Test category type
export interface TestCategory {
  name: string;
  label: string;
  icon: React.ReactNode;
  tests: TestOption[];
}

export interface TestOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}
