import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This is a simple API route that handles GET requests for a patient's history.
export async function GET(request: Request, { params }: { params: { patientId: string } }) {
  const { patientId } = params;

  try {
    // Construct the path to your db.json file
    const filePath = path.join(process.cwd(), 'db.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const db = JSON.parse(fileContents);

    // Filter appointments for the specific patient
    const patientAppointments = db.appointments.filter(
      (appt: any) => appt.patientId === patientId
    );

    // Attach diagnosis and prescription data to each appointment
    const history = patientAppointments.map((appt: any) => {
      const diagnosis = db.diagnoses.find((d: any) => d.id === appt.diagnosisId);
      const prescription = db.prescriptions.find((p: any) => p.id === appt.prescriptionId);
      
      return {
        ...appt,
        diagnosis: diagnosis ? diagnosis.text : 'N/A',
        prescription: prescription ? `${prescription.medication} (${prescription.dosage})` : 'N/A',
      };
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching medical history:', error);
    return NextResponse.json({ error: 'Failed to fetch medical history' }, { status: 500 });
  }
}


