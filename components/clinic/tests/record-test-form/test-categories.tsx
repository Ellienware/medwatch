import { 
  Stethoscope, Activity, Microscope, AlertCircle,
  Ear, Eye, Heart, Syringe, Droplets, Thermometer,
  Shield, Radio, User
} from "lucide-react"
import { TestCategory } from "./types"

export const testCategories: TestCategory[] = [
  {
    name: "clinical",
    label: "CLINICAL TESTS",
    icon: <Stethoscope className="h-3 w-3" />,
    tests: [
      { value: "audiometry", label: "Audiometry (Hearing Test)", icon: <Ear className="h-4 w-4" /> },
      { value: "spirometry", label: "Spirometry (Lung Function)", icon: <Activity className="h-4 w-4" /> },
      { value: "vision", label: "Vision Screening", icon: <Eye className="h-4 w-4" /> },
      { value: "bp", label: "Blood Pressure", icon: <Heart className="h-4 w-4" /> },
      { value: "drug", label: "Drug & Alcohol Screening", icon: <AlertCircle className="h-4 w-4" /> },
    ]
  },
  {
    name: "imaging",
    label: "IMAGING TESTS",
    icon: <Activity className="h-3 w-3" />,
    tests: [
      { value: "xray", label: "Chest X-Ray", icon: <Radio className="h-4 w-4" /> },
      { value: "ecg", label: "ECG (Electrocardiogram)", icon: <Heart className="h-4 w-4" /> },
      { value: "ultrasound", label: "Ultrasound", icon: <Activity className="h-4 w-4" /> },
    ]
  },
  {
    name: "laboratory",
    label: "LABORATORY TESTS",
    icon: <Microscope className="h-3 w-3" />,
    tests: [
      { value: "hiv", label: "HIV Testing", icon: <Shield className="h-4 w-4" /> },
      { value: "malaria", label: "Malaria Test", icon: <Droplets className="h-4 w-4" /> },
      { value: "hepatitis_b", label: "Hepatitis B Test", icon: <Syringe className="h-4 w-4" /> },
      { value: "hepatitis_c", label: "Hepatitis C Test", icon: <Syringe className="h-4 w-4" /> },
      { value: "syphilis", label: "Syphilis Test", icon: <Microscope className="h-4 w-4" /> },
      { value: "urinalysis", label: "Urinalysis", icon: <Droplets className="h-4 w-4" /> },
      { value: "blood_glucose", label: "Blood Glucose", icon: <Thermometer className="h-4 w-4" /> },
      { value: "cholesterol", label: "Cholesterol Test", icon: <Activity className="h-4 w-4" /> },
      { value: "cbc", label: "Complete Blood Count (CBC)", icon: <Microscope className="h-4 w-4" /> },
      { value: "liver_function", label: "Liver Function Test", icon: <Activity className="h-4 w-4" /> },
      { value: "kidney_function", label: "Kidney Function Test", icon: <Droplets className="h-4 w-4" /> },
    ]
  },
  {
    name: "other",
    label: "OTHER TESTS",
    icon: <AlertCircle className="h-3 w-3" />,
    tests: [
      { value: "pregnancy", label: "Pregnancy Test", icon: <Heart className="h-4 w-4" /> },
      { value: "tuberculosis", label: "Tuberculosis Test", icon: <Microscope className="h-4 w-4" /> },
      { value: "typhoid", label: "Typhoid Test", icon: <Thermometer className="h-4 w-4" /> },
    ]
  }
]

export const testIcons: Record<string, React.ReactNode> = {
  audiometry: <Ear className="h-4 w-4" />,
  spirometry: <Activity className="h-4 w-4" />,
  vision: <Eye className="h-4 w-4" />,
  xray: <Radio className="h-4 w-4" />,
  bp: <Heart className="h-4 w-4" />,
  drug: <AlertCircle className="h-4 w-4" />,
  hiv: <Shield className="h-4 w-4" />,
  malaria: <Droplets className="h-4 w-4" />,
  hepatitis_b: <Syringe className="h-4 w-4" />,
  hepatitis_c: <Syringe className="h-4 w-4" />,
  syphilis: <Microscope className="h-4 w-4" />,
  urinalysis: <Droplets className="h-4 w-4" />,
  blood_glucose: <Thermometer className="h-4 w-4" />,
  cholesterol: <Activity className="h-4 w-4" />,
  ecg: <Heart className="h-4 w-4" />,
  ultrasound: <Activity className="h-4 w-4" />,
  cbc: <Microscope className="h-4 w-4" />,
  liver_function: <Activity className="h-4 w-4" />,
  kidney_function: <Droplets className="h-4 w-4" />,
  pregnancy: <Heart className="h-4 w-4" />,
  tuberculosis: <Microscope className="h-4 w-4" />,
  typhoid: <Thermometer className="h-4 w-4" />,
}