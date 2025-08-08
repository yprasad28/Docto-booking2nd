// components/DoctorAppointmentActions.tsx
// This component displays a single appointment for a doctor and allows them to Confirm or Cancel it.
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

import { CheckCircle, XCircle, Eye, FileText } from "lucide-react";

interface DoctorAppointmentActionsProps {
  appointmentId: string;
  status: string;
  patientName: string;
  onAppointmentAction: () => void;
  onWritePrescription: () => void;
  onRecheckAppointment?: () => void; // New prop for recheck functionality
}

export function DoctorAppointmentActions({
  appointmentId,
  status,
  patientName,
  onAppointmentAction,
  onWritePrescription,
  onRecheckAppointment,
}: DoctorAppointmentActionsProps) {
  const { toast } = useToast();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

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

  const updateAppointmentStatus = async (newStatus: "pending" | "confirmed" | "cancelled" | "completed" | "rescheduled") => {
    try {
      await appointmentsAPI.updateStatus(appointmentId, newStatus);
      toast({
        title: "Success",
        description: `Appointment ${newStatus} successfully!`,
      });
      onAppointmentAction(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive",
      });
      console.error("Error updating appointment:", error);
    }
  };

  const showConfirmCancelButtons = status === "pending";
  const showWritePrescriptionButton = status === "confirmed";
  const showViewPrescriptionButton = status === "completed" && prescription;
  const showMarkCompletedButton = status === "confirmed";
  const showRecheckButton = status === "completed" && prescription && onRecheckAppointment;

  if (!showConfirmCancelButtons && !showWritePrescriptionButton && !showViewPrescriptionButton && !showMarkCompletedButton && !showRecheckButton) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {showConfirmCancelButtons && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={() => updateAppointmentStatus("confirmed")}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateAppointmentStatus("cancelled")}
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}

      {showWritePrescriptionButton && (
        <Button
          size="sm"
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={onWritePrescription}
        >
          <FileText className="w-4 h-4 mr-2" />
          Write Prescription
        </Button>
      )}

      {showMarkCompletedButton && (
        <Button
          size="sm"
          onClick={() => updateAppointmentStatus("completed")}
          className="w-full"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark as Completed
        </Button>
      )}

      {showViewPrescriptionButton && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              disabled={isLoadingPrescription}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isLoadingPrescription ? "Loading..." : "View Prescription"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Previous Prescription Details</DialogTitle>
              <DialogDescription>
                Review the previous prescription for {patientName} before recheck
              </DialogDescription>
            </DialogHeader>
            {prescription && (
              <div className="space-y-6">
                {/* Previous Visit Info */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Previous Visit Summary
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This prescription was written on {new Date(prescription.createdAt).toLocaleDateString()}
                  </p>
                </div>

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

                {/* Previous Diagnosis */}
                <div>
                  <h4 className="font-semibold mb-2">Previous Diagnosis</h4>
                  <p className="text-gray-700 dark:text-gray-300">{prescription.diagnosis}</p>
                </div>

                {/* Previous Medications */}
                <div>
                  <h4 className="font-semibold mb-3">Previous Medications</h4>
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

                {/* Previous Lifestyle Recommendations */}
                {prescription.lifestyleRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Previous Lifestyle Recommendations</h4>
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

                {/* Previous Follow-up */}
                <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">📅</span>
                  </div>
                  <div>
                    <p className="font-medium">Previous Follow-up Date</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{prescription.followUpDate}</p>
                  </div>
                </div>

                {/* Recheck Action */}
                {onRecheckAppointment && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Ready for Recheck?
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      After reviewing the previous prescription, you can now write a new prescription for the recheck.
                    </p>
                    <Button
                      onClick={onRecheckAppointment}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Write New Prescription for Recheck
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {showRecheckButton && (
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          onClick={onRecheckAppointment}
        >
          <FileText className="w-4 h-4 mr-2" />
          Recheck Patient
        </Button>
      )}
    </div>
  );
}
