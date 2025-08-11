// File: app/patient/[patientId]/history/page.tsx
'use client'; // This is needed to use client-side hooks like useEffect in your component

import React from 'react';
import PatientHistoryPage from '../../../../components/PatientHistoryPage';

// The 'params' object is automatically provided by Next.js
// It contains the dynamic segments from the URL, like [patientId]
interface PatientHistoryProps {
  params: {
    patientId: string;
  };
}

const HistoryPage = ({ params }: PatientHistoryProps) => {
  const { patientId } = params;

  // The PatientHistoryPage component is now rendered here,
  // receiving the patientId from the URL as a prop.
  return <PatientHistoryPage patientId={patientId} />;
};

export default HistoryPage;

