# Medical Report Generation System

This system allows patients to download professional medical reports and prescriptions with hospital/clinic branding, similar to the medical documents shown in the reference image.

## Features

### 1. Professional PDF Generation
- **Hospital/Clinic Branding**: Includes clinic name, logo, address, phone, and operating hours
- **Doctor Information**: Name, qualifications, registration number, and contact details
- **Patient Details**: ID, name, address, gender, and vital signs
- **Medical Information**: Diagnosis, medications, dosage, frequency, and duration
- **Professional Layout**: Clean, organized format suitable for medical documentation

### 2. Report Types
- **Prescription Reports**: Medication details with dosage and instructions
- **Medical Reports**: Comprehensive health assessments
- **Lab Reports**: Laboratory test results and analysis

### 3. Customizable Content
- **Clinic Details**: Editable clinic information and branding
- **Doctor Information**: Customizable doctor credentials and contact
- **Patient Vitals**: Temperature, blood pressure, weight, pulse
- **Medications**: Dynamic medication list with dosage and frequency
- **Medical Advice**: Customizable lifestyle and health recommendations

## How to Use

### For Patients

1. **Navigate to My Reports**: Go to `/my-reports` page
2. **View Existing Reports**: Browse and download previous prescriptions
3. **Generate New Reports**: Use the Medical Report Generator sidebar
4. **Customize Content**: Fill in diagnosis, medications, and advice
5. **Download PDF**: Generate and download professional medical reports

### For Developers

#### 1. Database Structure
The system now includes enhanced clinic information in the `doctors` table:

```json
{
  "clinicName": "Care Clinic",
  "clinicAddress": "Near Axis Bank, Kothrud, Pune - 411038",
  "clinicPhone": "+1-555-0000",
  "clinicEmail": "info@careclinic.com",
  "clinicTiming": "09:00 AM - 02:00 PM",
  "clinicClosed": "Thursday",
  "clinicLogo": "/logos/care-clinic.svg",
  "clinicRegistration": "Reg. No: CC001234"
}
```

#### 2. PDF Generation API
Use the `downloadMedicalReport` function from `@/lib/pdf-utils`:

```typescript
import { downloadMedicalReport, type MedicalReportData } from "@/lib/pdf-utils";

const reportData: MedicalReportData = {
  patientId: "123",
  patientName: "John Doe",
  patientAddress: "Pune, Maharashtra",
  patientGender: "M",
  vitals: {
    temperature: "36°C",
    bloodPressure: "120/80 mmHg",
    weight: "70 kg",
    pulse: "72 bpm"
  },
  doctor: {
    name: "Dr. Onkar Bhave",
    qualifications: "M.B.B.S., M.D., M.S.",
    registrationNumber: "Reg. No: 270988",
    phone: "Mob. No: 8983390126"
  },
  clinic: {
    clinicName: "Care Clinic",
    clinicAddress: "Near Axis Bank, Kothrud, Pune - 411038",
    clinicPhone: "Ph: 094233 80390",
    clinicEmail: "info@careclinic.com",
    clinicTiming: "09:00 AM - 02:00 PM",
    clinicClosed: "Thursday",
    clinicLogo: "/logos/care-clinic.svg",
    clinicRegistration: "Reg. No: CC001234"
  },
  diagnosis: "Hypertension",
  medications: [
    {
      name: "TAB. AMLOVAS 5MG",
      dosage: "1 Morning",
      frequency: "Daily",
      duration: "30 Days",
      instructions: "Take with water",
      totalQuantity: "30 Days (Tot:30 Tab)"
    }
  ],
  advice: ["Reduce salt intake", "Exercise regularly"],
  followUpDate: "2024-02-15",
  createdAt: new Date().toISOString(),
  reportType: "prescription"
};

const success = await downloadMedicalReport(reportData, "prescription.pdf");
```

#### 3. Component Integration
The `MedicalReportGenerator` component provides a user-friendly interface:

```typescript
import { MedicalReportGenerator } from "@/components/MedicalReportGenerator";

<MedicalReportGenerator 
  patientId={user.id} 
  patientName={user.name} 
/>
```

## File Structure

```
├── lib/
│   └── pdf-utils.ts          # PDF generation utilities
├── components/
│   ├── PatientPrescriptionReports.tsx  # Existing prescription viewer
│   └── MedicalReportGenerator.tsx      # New report generator
├── app/
│   └── my-reports/
│       └── page.tsx          # Updated reports page
└── public/
    └── logos/                # Clinic logos
        └── care-clinic.svg   # Sample clinic logo
```

## Dependencies

- **jsPDF**: PDF generation library
- **React**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling

## Installation

1. Install dependencies:
```bash
npm install jspdf
npm install --save-dev @types/jspdf
```

2. Ensure the database includes clinic information
3. Add clinic logos to `public/logos/` directory
4. Import and use the components as needed

## Customization

### Clinic Branding
- Update clinic details in the database
- Replace logo files in `public/logos/`
- Modify clinic information in the report generator

### Report Layout
- Customize PDF layout in `lib/pdf-utils.ts`
- Add new sections or modify existing ones
- Adjust styling and formatting

### Data Sources
- Connect to actual patient databases
- Integrate with EMR systems
- Add real-time vital signs monitoring

## Security Considerations

- Validate all input data before PDF generation
- Sanitize patient information
- Implement proper access controls
- Ensure HIPAA compliance for medical data

## Future Enhancements

- **Digital Signatures**: Add doctor digital signatures
- **QR Codes**: Include QR codes for easy access
- **Multi-language Support**: Support for multiple languages
- **Template System**: Customizable report templates
- **Cloud Storage**: Store generated reports securely
- **Email Integration**: Send reports via email
- **Mobile Optimization**: Responsive design for mobile devices

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
