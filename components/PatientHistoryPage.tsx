import React, { useState, useEffect } from 'react';
import {
  getUniqueDoctorsForPatient,
  getMedicalHistoryForDoctorAndPatient,
  Appointment,
  Doctor,
} from '../lib/api'; 
import {Navbar} from '../components/Navbar';
import {ModernFooter} from '../components/ModernFooter';

const PatientHistoryPage = ({ patientId }: { patientId: string }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to fetch the list of unique doctors on initial load
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      const uniqueDoctors = await getUniqueDoctorsForPatient(patientId);
      setDoctors(uniqueDoctors);
      setIsLoading(false);
    };
    fetchDoctors();
  }, [patientId]);

  // Effect to fetch history when a doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      const fetchHistory = async () => {
        setIsLoading(true);
        const patientHistory = await getMedicalHistoryForDoctorAndPatient({
          patientId,
          doctorId: selectedDoctor.id,
        });
        setHistory(patientHistory);
        setIsLoading(false);
      };
      fetchHistory();
    } else {
      // Clear history when no doctor is selected
      setHistory([]);
    }
  }, [selectedDoctor, patientId]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-grow p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Medical History</h1>

        {isLoading ? (
          <div className="text-center text-lg text-gray-600">Loading...</div>
        ) : (
          <div>
            {/* Doctor List */}
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Select a Doctor:</h2>
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`
                    px-6 py-3 rounded-full text-lg font-medium transition-all duration-300
                    ${selectedDoctor?.id === doctor.id
                      ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }
                  `}
                >
                  {doctor.name}
                </button>
              ))}
            </div>

            {/* History Display */}
            {selectedDoctor && (
              <div className="border-t-2 border-gray-200 pt-6 mt-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  History with Dr. {selectedDoctor.name}
                </h2>
                {history.length > 0 ? (
                  <div className="space-y-6">
                    {history.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Appointment on {appointment.date} at {appointment.time}
                          </h3>
                          <span
                            className={`
                              px-3 py-1 rounded-full text-xs font-semibold
                              ${
                                appointment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            `}
                          >
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        {appointment.prescription && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            
                            <p className="text-gray-600 mt-1">
                              <span className="font-semibold">Diagnosis:</span> {appointment.prescription.diagnosis}
                            </p>
                            <h4 className="font-bold text-gray-700">Prescription:</h4>
                            <ul className="list-disc list-inside mt-2 text-gray-600">
                              {appointment.prescription.medications.map((med) => (
                                <li key={med.id}>
                                  <span className="font-semibold">{med.name}:</span> {med.dosage}, {med.frequency}, {med.duration}
                                </li>
                              ))}
                            </ul>
                            <p className="text-gray-600 mt-2">
                              <span className="font-semibold">Lifestyle:</span> {appointment.prescription.lifestyleRecommendations.join(", ")}
                            </p>
                          </div>
                        )}
                        {!appointment.prescription && (
                          <p className="text-gray-500 italic mt-2">No prescription was added for this appointment.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-lg text-gray-500">
                    No history found with Dr. {selectedDoctor.name}.
                  </div>
                )}
              </div>
            )}
            {!selectedDoctor && doctors.length > 0 && (
              <div className="text-center text-lg text-gray-500 mt-8">
                Please select a doctor to view your medical history.
              </div>
            )}
            {!selectedDoctor && doctors.length === 0 && (
              <div className="text-center text-lg text-gray-500 mt-8">
                You have no appointments with any doctors.
              </div>
            )}
          </div>
        )}
      </div>
      </main>
      <ModernFooter />
    </div>
  );
};

export default PatientHistoryPage;


