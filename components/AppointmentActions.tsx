"use client";

import { useState, useEffect } from "react"; // Import useState and useEffect
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { appointmentsAPI, prescriptionsAPI, type Prescription } from "@/lib/api";

// Import AlertDialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Import Dialog components for prescription view
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AppointmentActionsProps {
  appointmentId: string;
  status: string;
  doctorId: string;
  onAppointmentAction: () => void;
}

export function AppointmentActions({
  appointmentId,
  status,
  doctorId,
  onAppointmentAction,
}: AppointmentActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false); // State to control dialog
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

  const handleReschedule = () => {
    toast({
      title: "Reschedule Action",
      description: `Navigating to booking page for doctor ID: ${doctorId} to reschedule appointment ID: ${appointmentId}`,
    });
    router.push(`/booking/${doctorId}?rescheduleId=${appointmentId}`);
  };

  const performCancellation = async () => {
    try {
        await appointmentsAPI.updateStatus(appointmentId, "cancelled");;
      toast({
        title: "Appointment Cancelled Successfully!",
        description: "Your appointment has been successfully cancelled.",
        variant: "default",
      });
      onAppointmentAction(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
      console.error("Error cancelling appointment:", error);
    } finally {
      setIsConfirmingCancel(false); // Close the dialog
    }
  };

  // Load prescription for completed appointments
  useEffect(() => {
    if (status === "completed") {
      loadPrescription();
    }
  }, [appointmentId, status]);

  const loadPrescription = async () => {
    try {
      setIsLoadingPrescription(true);
      const prescriptionData = await prescriptionsAPI.getByAppointmentId(appointmentId);
      setPrescription(prescriptionData);
    } catch (error) {
      console.error("Error loading prescription:", error);
      // Don't show error toast for completed appointments without prescriptions
    } finally {
      setIsLoadingPrescription(false);
    }
  };

  const showRescheduleButton =
    status === "pending" || status === "confirmed" || status === "cancelled";
  const showCancelButton = status === "pending" || status === "confirmed";
  const showViewPrescriptionButton = status === "completed" && prescription;

  if (!showRescheduleButton && !showCancelButton && !showViewPrescriptionButton) {
    return null;
  }

  return (
    <div className="flex justify-between mt-4">
      {showRescheduleButton && (
        <Button
          variant="outline"
          className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          onClick={handleReschedule}
        >
          Reschedule
        </Button>
      )}

      {showCancelButton && (
        <AlertDialog
          open={isConfirmingCancel}
          onOpenChange={setIsConfirmingCancel}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="bg-red-700 hover:bg-red-800 px-6 py-3"
              // No direct onClick here anymore, AlertDialogTrigger handles opening
            >
              Cancel
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently cancel your
                appointment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction onClick={performCancellation}>
                Yes, Cancel Appointment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showViewPrescriptionButton && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              disabled={isLoadingPrescription}
            >
              {isLoadingPrescription ? "Loading..." : "View Prescription"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
              <DialogDescription>
                Complete prescription information for your completed appointment
              </DialogDescription>
            </DialogHeader>
            {prescription && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Patient</p>
                    <p className="font-medium">{prescription.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Doctor</p>
                    <p className="font-medium">{prescription.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Specialty</p>
                    <p className="font-medium">{prescription.specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-medium capitalize">{prescription.status}</p>
                  </div>
                </div>

                {/* Diagnosis */}
                <div>
                  <h4 className="font-semibold mb-2">Diagnosis</h4>
                  <p className="text-gray-700 dark:text-gray-300">{prescription.diagnosis}</p>
                </div>

                {/* Medications */}
                <div>
                  <h4 className="font-semibold mb-3">Medications</h4>
                  <div className="space-y-3">
                    {prescription.medications.map((medication, index) => (
                      <div key={medication.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <h5 className="font-medium">{medication.name}</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Dosage</p>
                            <p className="font-medium">{medication.dosage}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Frequency</p>
                            <p className="font-medium">{medication.frequency}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Duration</p>
                            <p className="font-medium">{medication.duration}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-600 dark:text-gray-400">Instructions</p>
                            <p className="font-medium">{medication.instructions}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lifestyle Recommendations */}
                {prescription.lifestyleRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Lifestyle Recommendations</h4>
                    <ul className="space-y-2">
                      {prescription.lifestyleRecommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up */}
                <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">📅</span>
                  </div>
                  <div>
                    <p className="font-medium">Follow-up Date</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{prescription.followUpDate}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
