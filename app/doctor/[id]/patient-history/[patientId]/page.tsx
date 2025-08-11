"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModernNavbar } from "@/components/ModernNavbar";
import { ModernFooter } from "@/components/ModernFooter";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  appointmentsAPI,
  prescriptionsAPI,
  type Appointment,
  type Prescription,
} from "@/lib/api";
import {
  CalendarDays,
  Pill,
  FileText,
  Clock,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// This interface combines all related data for a single patient appointment.
// The diagnosis is now part of the prescription.
interface PatientHistory {
  appointment: Appointment;
  prescription: Prescription | null;
}

export default function PatientHistoryPage() {
  // Use the router and params hooks to get patient and doctor IDs
  const router = useRouter();
  const params = useParams();
  const { patientId, id: doctorId } = params as {
    patientId: string;
    id: string;
  };

  // Use the auth context for role-based access control
  const { user, role, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [patientName, setPatientName] = useState<string>("Patient");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only fetch data if the patientId is available and the user is an authenticated doctor
    if (!patientId || !isAuthenticated || role !== "doctor") {
      setIsLoading(false);
      return;
    }

    const fetchPatientHistory = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch all appointments for the patient using your API library
        const appointments = await appointmentsAPI.getByPatientId(patientId);

        // Sort and filter appointments. We want the most recent completed appointments first.
        const sortedAppointments = appointments
          .filter(
            (appt) => appt.status === "completed" || appt.status === "cancelled"
          )
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        // Set the patient's name from the first appointment found
        if (sortedAppointments.length > 0) {
          setPatientName(sortedAppointments[0].patientName);
        }

        // 2. For each appointment, fetch the corresponding prescription
        const historyData: PatientHistory[] = await Promise.all(
          sortedAppointments.map(async (appointment) => {
            const prescription = await prescriptionsAPI
              .getByAppointmentId(appointment.id)
              .catch(() => null);

            return {
              appointment,
              prescription,
            };
          })
        );
        setHistory(historyData);
      } catch (error) {
        console.error("Failed to fetch patient history:", error);
        toast({
          title: "Error",
          description: "Failed to load patient history.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientHistory();
  }, [patientId, isAuthenticated, role, toast]);

  // Helper function to format the appointment date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Function to determine the badge style based on appointment status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      {/* Added consistent dark mode background */}
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-50">
        <ModernNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4 sm:mb-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="sm:text-right">
              <h1 className="text-3xl font-bold">Medical History</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                for {patientName}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ) : history.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No Medical History
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  This patient has no recorded medical history.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {history.map(({ appointment, prescription }) => (
                <Card
                  key={appointment.id}
                  className="bg-white dark:bg-gray-800 shadow-lg"
                >
                  <CardHeader className="border-b dark:border-gray-700 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {formatDate(appointment.date)}
                      </CardTitle>
                      <Badge className={`${getStatusBadgeClass(appointment.status)} capitalize`}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center pt-1">
                      <Clock className="w-4 h-4 mr-2" />
                      {appointment.time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {/* Diagnoses Section */}
                    <div className="space-y-2">
                      <h3 className="flex items-center text-lg font-semibold">
                        <FileText className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        Diagnoses
                      </h3>
                      {/* We now check if prescription exists and has a diagnosisDescription */}
                      {prescription && prescription.diagnosis ? (
                        <p className="text-gray-700 dark:text-gray-300">
                          {prescription.diagnosis}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">
                          No diagnosis was recorded for this appointment.
                        </p>
                      )}
                    </div>

                    {/* Prescriptions Section */}
                    <div className="space-y-2">
                      <h3 className="flex items-center text-lg font-semibold">
                        <Pill className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                        Prescriptions
                      </h3>
                      {prescription && prescription.medications.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                          {prescription.medications.map((med, index) => (
                            <li key={index}>
                              <strong>{med.name}</strong>: {med.dosage},{" "}
                              {med.frequency},{" "}{med.duration}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">
                          No prescription was issued for this appointment.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <ModernFooter />
      </div>
    </ProtectedRoute>
  );
}
