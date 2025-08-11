// Professional Medical Report Generation Utilities
// Using browser-based PDF generation with proper error handling

export interface ClinicDetails {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicTiming: string;
  clinicClosed: string;
  clinicLogo?: string;
  clinicRegistration: string;
}

export interface DoctorDetails {
  name: string;
  qualifications: string;
  registrationNumber: string;
  phone: string;
}

export interface PatientVitals {
  temperature?: string;
  bloodPressure?: string;
  weight?: string;
  height?: string;
  pulse?: string;
}

export interface MedicalReportData {
  patientId: string;
  patientName: string;
  patientAddress: string;
  patientGender: string;
  patientAge?: number;
  vitals: PatientVitals;
  doctor: DoctorDetails;
  clinic: ClinicDetails;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    totalQuantity: string;
  }>;
  advice: string[];
  followUpDate: string;
  createdAt: string;
  reportType: 'prescription' | 'medical_report' | 'lab_report';
}

export const generateProfessionalMedicalReport = async (
  reportData: MedicalReportData
): Promise<string> => {
  // Generate HTML content for the medical report
  const htmlContent = generateMedicalReportHTML(reportData);
  return htmlContent;
};

const generateMedicalReportHTML = (reportData: MedicalReportData): string => {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Report - ${reportData.patientName}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            @page { margin: 1cm; }
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
        }
        
        .doctor-info {
            flex: 1;
        }
        
        .clinic-logo {
            text-align: center;
            flex: 1;
        }
        
        .clinic-info {
            flex: 1;
            text-align: right;
        }
        
        .logo-placeholder {
            width: 80px;
            height: 80px;
            background: #0ea5e9;
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
        }
        
        .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 5px;
        }
        
        .separator {
            border-top: 1px solid #e0e0e0;
            margin: 20px 0;
        }
        
        .patient-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .patient-details {
            flex: 1;
        }
        
        .report-details {
            flex: 1;
            text-align: right;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #0ea5e9;
            margin: 25px 0 15px 0;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
        }
        
        .medications-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .medications-table th,
        .medications-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        .medications-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .advice-list {
            list-style: none;
            padding: 0;
        }
        
        .advice-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .advice-list li:before {
            content: "•";
            color: #0ea5e9;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .footer {
            margin-top: 40px;
            text-align: right;
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            width: 200px;
            display: inline-block;
            margin-bottom: 10px;
        }
        
        .print-button {
            background: #0ea5e9;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin-bottom: 20px;
        }
        
        .print-button:hover {
            background: #0284c7;
        }
        
        .instructions {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        
        .instructions h3 {
            color: #0ea5e9;
            margin-bottom: 10px;
        }
        
        @media print {
            .print-button, .instructions { display: none; }
        }
    </style>
</head>
<body>
   
    
   
    
    <!-- Header Section -->
    <div class="header">
        <div class="doctor-info">
            <h2>${reportData.doctor.name}</h2>
            <p>${reportData.doctor.qualifications}</p>
            <p>${reportData.doctor.registrationNumber}</p>
            <p>${reportData.doctor.phone}</p>
        </div>
        
        <div class="clinic-logo">
            <div class="logo-placeholder">🏥</div>
            <div class="clinic-name">${reportData.clinic.clinicName}</div>
            <p style="color: #666; font-size: 12px;">LOREM IPSUM</p>
        </div>
        
        <div class="clinic-info">
            <h2>${reportData.clinic.clinicName}</h2>
            <p>${reportData.clinic.clinicAddress}</p>
            <p>${reportData.clinic.clinicPhone}</p>
            <p>Timing: ${reportData.clinic.clinicTiming}</p>
            <p>Closed: ${reportData.clinic.clinicClosed}</p>
        </div>
    </div>
    
    <div class="separator"></div>
    
    <!-- Patient Information Section -->
    <div class="patient-section">
        <div class="patient-details">
            <h3>Patient Information:</h3>
            <p><strong>ID:</strong> ${reportData.patientId} - ${reportData.patientName} (${reportData.patientGender})</p>
            <p><strong>Address:</strong> ${reportData.patientAddress}</p>
            ${reportData.vitals.temperature ? `<p><strong>Temperature:</strong> ${reportData.vitals.temperature}</p>` : ''}
            ${reportData.vitals.bloodPressure ? `<p><strong>Blood Pressure:</strong> ${reportData.vitals.bloodPressure}</p>` : ''}
            ${reportData.vitals.weight ? `<p><strong>Weight:</strong> ${reportData.vitals.weight}</p>` : ''}
            ${reportData.vitals.pulse ? `<p><strong>Pulse:</strong> ${reportData.vitals.pulse}</p>` : ''}
        </div>
        
        <div class="report-details">
            <h3>Report Details:</h3>
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>Time:</strong> ${currentTime}</p>
            <p><strong>Report Type:</strong> ${reportData.reportType.replace('_', ' ').toUpperCase()}</p>
        </div>
    </div>
    
    <div class="separator"></div>
    
    <!-- Diagnosis Section -->
    <div class="section-title">Diagnosis:</div>
    <p>${reportData.diagnosis}</p>
    
    <!-- Medications Section -->
    <div class="section-title">Prescription:</div>
    <table class="medications-table">
        <thead>
            <tr>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
            </tr>
        </thead>
        <tbody>
            ${reportData.medications.map(med => `
                <tr>
                    <td>${med.name}</td>
                    <td>${med.dosage}</td>
                    <td>${med.frequency}</td>
                    <td>${med.duration}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <!-- Advice Section -->
    <div class="section-title">Advice Given:</div>
    <ul class="advice-list">
        ${reportData.advice.map(advice => `<li>${advice}</li>`).join('')}
    </ul>
    
    <!-- Follow-up Section -->
    <div class="section-title">Follow Up:</div>
    <p><strong>${reportData.followUpDate}</strong></p>
    
    <!-- Footer with Doctor Signature -->
    <div class="footer">
        <div class="signature-line"></div>
        <p><strong>${reportData.doctor.name} ${reportData.doctor.qualifications}</strong></p>
    </div>
     <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
</body>
</html>
  `;
};

// Legacy function for backward compatibility
export const generateFormattedPrescription = (prescription: any): string => {
  return `Medical Prescription Report\n\nPatient: ${prescription.patientName}\nDoctor: ${prescription.doctorName}\nSpecialty: ${prescription.specialty}\nDiagnosis: ${prescription.diagnosis}\n\nMedications:\n${prescription.medications.map((med: any, index: number) => `${index + 1}. ${med.name} - ${med.dosage} - ${med.frequency} - ${med.duration}`).join('\n')}\n\nFollow-up: ${prescription.followUpDate}`;
};

// Download function for the new professional reports
export const downloadMedicalReport = async (
  reportData: MedicalReportData,
  filename?: string
): Promise<boolean> => {
  try {
    const htmlContent = await generateProfessionalMedicalReport(reportData);
    
    // Create a new window with the HTML content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      // Wait for content to load then show instructions
      newWindow.onload = () => {
        // Content is loaded, user can now print/save as PDF
        console.log('Prescription report loaded successfully. User can now print/save as PDF.');
      };
      
      return true;
    } else {
      // Fallback: create a blob and download as HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
      a.download = filename || `prescription-${reportData.patientName}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
    }
  } catch (error) {
    console.error('Error generating medical report:', error);
    return false;
  }
};
