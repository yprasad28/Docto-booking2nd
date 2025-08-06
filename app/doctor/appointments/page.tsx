// app/doctor/appointments/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { appointmentsAPI, type Appointment } from "@/lib/api";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  CalendarDays, // Added for calendar toggle
  ListOrdered, // Added for list toggle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppointmentCalendar } from "@/components/ui/appointment-calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrescriptionForm } from "@/components/ui/prescription-form"; // Make sure this path is correct
import { Prescription, prescriptionsAPI } from "@/lib/api";
import { ModernFooter } from "@/components/ModernFooter"; // Added ModernFooter
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

export default function DoctorAppointmentsPage() {
  const { user, role, isAuthenticated } = useAuth(); // Added role, isAuthenticated for robust checks
  const { toast } = useToast();
  console.log("Auth State:", { user, role, isAuthenticated });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming"); // State for active tab filtering
  const [isCalendarView, setIsCalendarView] = useState(false); // State to toggle between list and calendar view
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [
    selectedAppointmentForPrescription,
    setSelectedAppointmentForPrescription,
  ] = useState<Appointment | null>(null);
  // Memoized function to load appointments
  const loadAppointments = useCallback(async () => {
    const idToFetch = user?.id;

    // Only proceed if authenticated and a doctor
    if (!isAuthenticated || !idToFetch || role !== "doctor") {
      setIsLoading(false);
      return;
    }

    try {
      const appointmentsData = await appointmentsAPI.getByDoctorId(idToFetch);
      setAppointments(
        appointmentsData.sort(
          // Retaining your original ascending sort order (oldest first)
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, role, toast]); // Dependencies for useCallback

  useEffect(() => {
    // Only attempt to load appointments if authenticated, user exists, and is a doctor
    if (isAuthenticated && user && role === "doctor") {
      loadAppointments();
    } else if (!isAuthenticated) {
      // If not authenticated, stop loading and show appropriate message via ProtectedRoute
      setIsLoading(false);
    } else if (role !== "doctor") {
      // If authenticated but not a doctor, stop loading and show appropriate message via ProtectedRoute
      setIsLoading(false);
    }
  }, [user, isAuthenticated, role, loadAppointments]); // Dependencies for useEffect

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: Appointment["status"]
  ) => {
    try {
      await appointmentsAPI.updateStatus(appointmentId, status);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
      );
      toast({
        title: "Success",
        description: `Appointment ${status} successfully!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    }
  };
  // Function to update an appointment's data in the state
  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    setAppointments((prevAppointments) =>
      prevAppointments.map((app) =>
        app.id === updatedAppointment.id ? updatedAppointment : app
      )
    );
  };
  const handleWritePrescriptionClick = (appointment: Appointment) => {
    setSelectedAppointmentForPrescription(appointment);
    setIsPrescriptionModalOpen(true);
  };
  const handlePrescriptionAdded = async(prescription: Prescription) => {
    console.log("Prescription added:", prescription);
    toast({
      title: "Prescription Created",
      description: `A new prescription for ${prescription.medicationName} has been added.`,
    });
    if (selectedAppointmentForPrescription) {
      try {
        const updatedAppointment = await appointmentsAPI.addPrescription(
          selectedAppointmentForPrescription.id,
          prescription
        );
        // Update the appointments state to reflect the new prescription and status
        handleAppointmentUpdate(updatedAppointment); // Use the existing update handler
        toast({
          title: "Prescription Assigned",
          description: `Prescription has been assigned to ${updatedAppointment.patientName}'s appointment.`,
        });
      } catch (error) {
        console.error("Failed to assign prescription to appointment:", error);
        toast({
          title: "Error",
          description: "Failed to assign prescription to appointment. Please try again.",
          variant: "destructive",
        });
      }
    }
    setIsPrescriptionModalOpen(false);
    setSelectedAppointmentForPrescription(null);
  };

  // FIXED: Replaced with a theme-aware function for better readability in both modes.
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
  // Helper function to determine if an appointment is upcoming (for tab filtering)
  const isUpcoming = (appointment: Appointment) => {
    const apptDateTime = new Date(`${appointment.date}T${appointment.time}`);
    return apptDateTime >= new Date();
  };

  const groupAppointmentsByDate = (appointments: Appointment[]) => {
    const grouped: { [key: string]: Appointment[] } = {};
    appointments.forEach((appointment) => {
      const date = appointment.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });
    return grouped;
  };

  // Filter appointments based on the active tab (Upcoming/Past)
  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === "upcoming") {
      return (
        isUpcoming(appt) &&
        appt.status !== "cancelled" &&
        appt.status !== "completed"
      );
    } else {
      return (
        !isUpcoming(appt) ||
        appt.status === "cancelled" ||
        appt.status === "completed"
      );
    }
  });

  const groupedAppointments = groupAppointmentsByDate(filteredAppointments); // Group filtered appointments

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      {/* CHANGED: Added dual-theme background */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            {/* CHANGED: Added dual-theme text colors */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              My Appointments
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your patient appointments
            </p>
          </div>
          {/* Section for Tab and View Toggle Buttons */}
          <div className="flex justify-between items-center mb-6">
            {/* Tab buttons for Upcoming and Past appointments */}
            <div className="flex space-x-2 rounded-md bg-muted p-1">
              <Button
                variant={activeTab === "upcoming" ? "default" : "ghost"}
                onClick={() => {
                  setActiveTab("upcoming");
                  setIsCalendarView(false); // Switch to list view when changing tabs
                }}
                className="px-4 py-2 text-sm"
              >
                Upcoming
              </Button>
              <Button
                variant={activeTab === "past" ? "default" : "ghost"}
                onClick={() => {
                  setActiveTab("past");
                  setIsCalendarView(false); // Switch to list view when changing tabs
                }}
                className="px-4 py-2 text-sm"
              >
                Past
              </Button>
            </div>

            {/* Button to toggle between Calendar and List view */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCalendarView(!isCalendarView)}
              aria-label={
                isCalendarView
                  ? "Switch to List View"
                  : "Switch to Calendar View"
              }
            >
              {isCalendarView ? (
                <ListOrdered className="h-5 w-5" />
              ) : (
                <CalendarDays className="h-5 w-5" />
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ) : appointments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Appointments
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have any appointments scheduled yet.
                </p>
              </CardContent>
            </Card>
          ) : isCalendarView ? (
            <AppointmentCalendar
              appointments={appointments}
              onAppointmentUpdate={handleAppointmentUpdate}
            />
          ) : (
            // Render the list of appointments, grouped by date (your original structure)
            <div className="space-y-8">
              {Object.entries(groupedAppointments).length === 0 ? (
                <p className="col-span-full text-center text-gray-500 dark:text-gray-400 mt-8">
                  {activeTab === "upcoming"
                    ? "No upcoming appointments found for this tab."
                    : "No past appointments found for this tab."}
                </p>
              ) : (
                Object.entries(groupedAppointments).map(
                  ([date, dayAppointments]) => (
                    <div key={date}>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dayAppointments.map((appointment) => (
                          <Card
                            key={appointment.id}
                            className="hover:shadow-xl transition-shadow"
                          >
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center">
                                  <User className="w-5 h-5 mr-2" />
                                  {appointment.patientName}
                                </CardTitle>
                                <Badge
                                  className={`${getStatusBadgeClass(
                                    appointment.status
                                  )} capitalize`}
                                >
                                  {appointment.status}
                                </Badge>
                              </div>
                              <CardDescription className="flex items-center pt-1">
                                <Clock className="w-4 h-4 mr-2" />
                                {appointment.time}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {appointment.status === "pending" && (
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        updateAppointmentStatus(
                                          appointment.id,
                                          "confirmed"
                                        )
                                      }
                                      className="flex-1"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateAppointmentStatus(
                                          appointment.id,
                                          "cancelled"
                                        )
                                      }
                                      className="flex-1"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Cancel
                                    </Button>
                                  </div>
                                )}

                                {appointment.status === "confirmed" && (
                                   <div className="flex flex-col gap-2">
                                   {/* Conditional rendering for Prescription button */}
                                   {appointment.prescription ? ( // MODIFIED LINE START
                                     <Button
                                       size="sm"
                                       className="w-full bg-blue-500 hover:bg-blue-600" // Changed color for 'View'
                                       onClick={() => {
                                         setSelectedAppointmentForPrescription(appointment);
                                         setIsPrescriptionModalOpen(true); // Re-use the same modal for viewing
                                       }}
                                     >
                                       View Prescription
                                     </Button>
                                   ) : (
                                     <Button
                                       size="sm"
                                       className="w-full bg-purple-600 hover:bg-purple-700"
                                       onClick={() => handleWritePrescriptionClick(appointment)}
                                     >
                                       Write Prescription
                                     </Button>
                                   )} {/* MODIFIED LINE END */}
                                   <Button
                                     size="sm"
                                     onClick={() =>
                                       updateAppointmentStatus(
                                         appointment.id,
                                         "completed"
                                       )
                                     }
                                     className="w-full"
                                   >
                                     Mark as Completed
                                   </Button>
                                  </div>
                                )}
                              {appointment.status === "completed" && appointment.prescription && (
      <Button
        size="sm"
        className="w-full bg-blue-500 hover:bg-blue-600"
        onClick={() => {
          setSelectedAppointmentForPrescription(appointment);
          setIsPrescriptionModalOpen(true);
        }}
      >
        View Prescription
      </Button>
    )}
  </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>
        <ModernFooter />
      </div>
      <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>
        {selectedAppointmentForPrescription?.prescription ? "Prescription Details" : "Write Prescription"} {/* MODIFIED TITLE */}
      </DialogTitle>
      <DialogDescription>
        {selectedAppointmentForPrescription?.prescription
          ? `Details for ${selectedAppointmentForPrescription?.patientName}'s prescription.`
          : `Fill in the prescription details for ${selectedAppointmentForPrescription?.patientName}.`} {/* MODIFIED DESCRIPTION */}
      </DialogDescription>
    </DialogHeader>
    {selectedAppointmentForPrescription && (
      selectedAppointmentForPrescription.prescription ? ( // CONDITIONAL RENDERING START
        // Display Prescription Details
        <div className="space-y-4 py-4 text-gray-900 dark:text-gray-50"> {/* Added text color for details */}
          <p><b>Medicine:</b> {selectedAppointmentForPrescription.prescription.medicationName}</p>
          <p><b>Dosage:</b> {selectedAppointmentForPrescription.prescription.dosage}</p>
          <p><b>Frequency:</b> {selectedAppointmentForPrescription.prescription.frequency}</p>
          {selectedAppointmentForPrescription.prescription.instructions && (
            <p><b>Instructions:</b> {selectedAppointmentForPrescription.prescription.instructions}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Prescribed on: {new Date(selectedAppointmentForPrescription.prescription.createdAt).toLocaleDateString()}
          </p>
        </div>
      ) : (
        // Render PrescriptionForm for writing
        <PrescriptionForm
          appointmentId={selectedAppointmentForPrescription.id}
          onPrescriptionAdded={handlePrescriptionAdded}
          onClose={() => setIsPrescriptionModalOpen(false)}
        />
      ) // CONDITIONAL RENDERING END
    )}
  </DialogContent>
</Dialog>
    </ProtectedRoute>
  );
}
