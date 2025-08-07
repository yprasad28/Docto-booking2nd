"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { prescriptionsAPI, type Prescription, type Medication } from "@/lib/api";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Download, 
  FileText, 
  Pill, 
  Calendar,
  User,
  Stethoscope,
  AlertCircle
} from "lucide-react";

interface DoctorPrescriptionFormProps {
  appointment: any;
  onPrescriptionCreated?: (prescription: Prescription) => void;
  onPrescriptionUpdated?: (prescription: Prescription) => void;
}

export function DoctorPrescriptionForm({ 
  appointment, 
  onPrescriptionCreated, 
  onPrescriptionUpdated 
}: DoctorPrescriptionFormProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingPrescription, setExistingPrescription] = useState<Prescription | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isWritingNew, setIsWritingNew] = useState(false);

  const [formData, setFormData] = useState({
    diagnosis: "",
    medications: [
      {
        id: "1",
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      }
    ],
    lifestyleRecommendations: [""],
    followUpDate: ""
  });

  useEffect(() => {
    if (appointment) {
      loadExistingPrescription();
    }
  }, [appointment]);

  const loadExistingPrescription = async () => {
    console.log("🔍 loadExistingPrescription called for appointment:", appointment?.id);
    try {
      const prescription = await prescriptionsAPI.getByAppointmentId(appointment.id);
      console.log("🔍 Loaded prescription:", prescription);
      if (prescription) {
        console.log("🔍 Setting existing prescription");
        setExistingPrescription(prescription);
        setFormData({
          diagnosis: prescription.diagnosis,
          medications: prescription.medications,
          lifestyleRecommendations: prescription.lifestyleRecommendations,
          followUpDate: prescription.followUpDate
        });
      } else {
        console.log("🔍 No prescription found for this appointment");
      }
      setIsWritingNew(false);
    } catch (error) {
      console.error("Error loading prescription:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          id: Date.now().toString(),
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: ""
        }
      ]
    }));
  };

  const updateMedication = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const addLifestyleRecommendation = () => {
    setFormData(prev => ({
      ...prev,
      lifestyleRecommendations: [...prev.lifestyleRecommendations, ""]
    }));
  };

  const updateLifestyleRecommendation = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      lifestyleRecommendations: prev.lifestyleRecommendations.map((rec, i) => 
        i === index ? value : rec
      )
    }));
  };

  const removeLifestyleRecommendation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lifestyleRecommendations: prev.lifestyleRecommendations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const prescriptionData = {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        specialty: appointment.specialty,
        diagnosis: formData.diagnosis,
        medications: formData.medications.filter(med => med.name.trim() !== ""),
        lifestyleRecommendations: formData.lifestyleRecommendations.filter(rec => rec.trim() !== ""),
        followUpDate: formData.followUpDate,
        status: "active" as const
      };

      if (existingPrescription && isEditing) {
        const updatedPrescription = await prescriptionsAPI.update(existingPrescription.id, prescriptionData);
        onPrescriptionUpdated?.(updatedPrescription);
        toast({
          title: "Prescription Updated",
          description: "Prescription has been updated successfully.",
        });
      } else {
        const newPrescription = await prescriptionsAPI.create(prescriptionData);
        onPrescriptionCreated?.(newPrescription);
        toast({
          title: "Prescription Created",
          description: "Prescription has been created successfully.",
        });
      }

      setIsDialogOpen(false);
      setIsEditing(false);
      setIsWritingNew(false);
    } catch (error) {
      console.error("Error saving prescription:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save prescription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    console.log("🔍 handleEdit called");
    console.log("🔍 existingPrescription:", existingPrescription);
    console.log("🔍 Setting isEditing to true");
    setIsEditing(true);
    console.log("🔍 Setting isDialogOpen to true");
    setIsDialogOpen(true);
    // Populate form with existing prescription data
    if (existingPrescription) {
      console.log("🔍 Populating form with existing prescription data");
      setFormData({
        diagnosis: existingPrescription.diagnosis,
        medications: existingPrescription.medications,
        lifestyleRecommendations: existingPrescription.lifestyleRecommendations,
        followUpDate: existingPrescription.followUpDate
      });
    }
  };

  const handleDelete = async () => {
    if (!existingPrescription) return;

    try {
      await prescriptionsAPI.delete(existingPrescription.id);
      setExistingPrescription(null);
      setFormData({
        diagnosis: "",
        medications: [{ id: "1", name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
        lifestyleRecommendations: [""],
        followUpDate: ""
      });
      toast({
        title: "Prescription Deleted",
        description: "Prescription has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prescription.",
        variant: "destructive",
      });
    }
  };

  const downloadPrescription = (prescription: Prescription) => {
    const prescriptionText = `
PRESCRIPTION

Patient: ${prescription.patientName}
Doctor: ${prescription.doctorName}
Specialty: ${prescription.specialty}
Date: ${new Date(prescription.createdAt).toLocaleDateString()}

DIAGNOSIS:
${prescription.diagnosis}

MEDICATIONS:
${prescription.medications.map(med => `
• ${med.name}
  Dosage: ${med.dosage}
  Frequency: ${med.frequency}
  Duration: ${med.duration}
  Instructions: ${med.instructions}
`).join('')}

LIFESTYLE RECOMMENDATIONS:
${prescription.lifestyleRecommendations.map(rec => `• ${rec}`).join('\n')}

Follow-up Date: ${prescription.followUpDate}
Status: ${prescription.status}
    `.trim();

    const blob = new Blob([prescriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${prescription.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  console.log("🔍 Render state:", {
    existingPrescription: !!existingPrescription,
    isWritingNew,
    isDialogOpen,
    isEditing,
    dialogOpen: isDialogOpen || isWritingNew || isEditing
  });

    return (
    <div className="space-y-4">
      {existingPrescription && !isWritingNew ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Existing Prescription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Diagnosis: {existingPrescription.diagnosis}</p>
                <p className="text-sm text-gray-600">
                  Created: {new Date(existingPrescription.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadPrescription(existingPrescription)}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsWritingNew(true);
                  setFormData({
                    diagnosis: "",
                    medications: [
                      {
                        id: "1",
                        name: "",
                        dosage: "",
                        frequency: "",
                        duration: "",
                        instructions: ""
                      }
                    ],
                    lifestyleRecommendations: [""],
                    followUpDate: ""
                  });
                  setIsEditing(false);
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Write New Prescription
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Write Prescription
        </Button>
      )}

      {/* Dialog - Always rendered but conditionally opened */}
      <Dialog open={isDialogOpen || isWritingNew || isEditing} onOpenChange={(open) => {
        console.log("🔍 Dialog onOpenChange:", { open, isDialogOpen, isWritingNew, isEditing });
        setIsDialogOpen(open);
        if (!open) {
          console.log("🔍 Resetting states");
          setIsWritingNew(false);
          setIsEditing(false);
        }
      }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                         <DialogHeader>
               <DialogTitle>
                 {isEditing ? "Edit Prescription" : isWritingNew ? "Write New Prescription" : "Write Prescription"}
               </DialogTitle>
               <DialogDescription>
                 {isEditing 
                   ? `Edit the existing prescription for ${appointment?.patientName}`
                   : isWritingNew 
                   ? `Create a new prescription for ${appointment?.patientName} (this will be in addition to the existing one)`
                   : `Create a comprehensive prescription for ${appointment?.patientName}`
                 }
               </DialogDescription>
             </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Diagnosis */}
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange("diagnosis", e.target.value)}
                  placeholder="Enter the diagnosis..."
                  required
                />
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Medications</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Medication
                  </Button>
                </div>
                {formData.medications.map((medication, index) => (
                  <Card key={medication.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Medication {index + 1}</h4>
                        {formData.medications.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMedication(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Medication Name</Label>
                          <Input
                            value={medication.name}
                            onChange={(e) => updateMedication(index, "name", e.target.value)}
                            placeholder="e.g., Ibuprofen 400mg"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dosage</Label>
                          <Input
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                            placeholder="e.g., 1 tablet"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Input
                            value={medication.frequency}
                            onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                            placeholder="e.g., Every 6 hours"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration</Label>
                          <Input
                            value={medication.duration}
                            onChange={(e) => updateMedication(index, "duration", e.target.value)}
                            placeholder="e.g., 7 days"
                            required
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Instructions</Label>
                          <Textarea
                            value={medication.instructions}
                            onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                            placeholder="Special instructions for taking this medication..."
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Lifestyle Recommendations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Lifestyle Recommendations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLifestyleRecommendation}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Recommendation
                  </Button>
                </div>
                {formData.lifestyleRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={recommendation}
                      onChange={(e) => updateLifestyleRecommendation(index, e.target.value)}
                      placeholder="e.g., Rest the affected area"
                    />
                    {formData.lifestyleRecommendations.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeLifestyleRecommendation(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Follow-up Date */}
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : (isEditing ? "Update Prescription" : "Create Prescription")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
