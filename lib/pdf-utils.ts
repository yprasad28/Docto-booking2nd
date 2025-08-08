// PDF generation utilities for prescriptions
export interface PDFPrescriptionData {
  patientName: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  lifestyleRecommendations: string[];
  followUpDate: string;
  createdAt: string;
  status: string;
}

export const generatePrescriptionPDF = async (prescription: PDFPrescriptionData): Promise<Blob> => {
  // This is a simplified PDF generation using jsPDF
  // In a real application, you might want to use a more robust PDF library
  
  const pdfContent = `
PRESCRIPTION REPORT
===================

Patient Information:
-------------------
Name: ${prescription.patientName}
Doctor: ${prescription.doctorName}
Specialty: ${prescription.specialty}
Date: ${new Date(prescription.createdAt).toLocaleDateString()}
Status: ${prescription.status}

Diagnosis:
----------
${prescription.diagnosis}

Medications:
------------
${prescription.medications.map((med, index) => `
${index + 1}. ${med.name}
    Dosage: ${med.dosage}
    Frequency: ${med.frequency}
    Duration: ${med.duration}
    Instructions: ${med.instructions}
`).join('\n')}

Lifestyle Recommendations:
------------------------
${prescription.lifestyleRecommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

Follow-up Date: ${prescription.followUpDate}

Generated on: ${new Date().toLocaleDateString()}
  `.trim();

  // Create a text blob for now (you can implement actual PDF generation)
  const blob = new Blob([pdfContent], { type: 'text/plain' });
  return blob;
};

export const downloadPrescriptionAsPDF = async (prescription: PDFPrescriptionData, filename?: string) => {
  try {
    const blob = await generatePrescriptionPDF(prescription);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `prescription-${prescription.patientName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

// Alternative: Generate a more formatted prescription text
export const generateFormattedPrescription = (prescription: PDFPrescriptionData): string => {
  const header = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                              MEDICAL PRESCRIPTION                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

`;
  
  const patientInfo = `
PATIENT INFORMATION:
───────────────────
Name: ${prescription.patientName}
Doctor: ${prescription.doctorName}
Specialty: ${prescription.specialty}
Date: ${new Date(prescription.createdAt).toLocaleDateString()}
Status: ${prescription.status.toUpperCase()}

`;
  
  const diagnosis = `
DIAGNOSIS:
──────────
${prescription.diagnosis}

`;
  
  const medications = `
MEDICATIONS:
────────────
${prescription.medications.map((med, index) => `
${index + 1}. ${med.name}
    • Dosage: ${med.dosage}
    • Frequency: ${med.frequency}
    • Duration: ${med.duration}
    • Instructions: ${med.instructions}
`).join('\n')}

`;
  
  const recommendations = `
LIFESTYLE RECOMMENDATIONS:
─────────────────────────
${prescription.lifestyleRecommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

`;
  
  const footer = `
Follow-up Date: ${prescription.followUpDate}
Generated: ${new Date().toLocaleDateString()}

╔══════════════════════════════════════════════════════════════════════════════╗
║                              END OF PRESCRIPTION                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
  
  return header + patientInfo + diagnosis + medications + recommendations + footer;
};
