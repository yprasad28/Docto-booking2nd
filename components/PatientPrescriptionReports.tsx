"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { prescriptionsAPI, type Prescription } from "@/lib/api";
import { downloadMedicalReport, type MedicalReportData, type ClinicDetails, type DoctorDetails, type PatientVitals } from "@/lib/pdf-utils";
import { 
  Download, 
  FileText, 
  Pill, 
  Calendar,
  User,
  Stethoscope,
  Eye,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface PatientPrescriptionReportsProps {
  patientId: string;
}

export function PatientPrescriptionReports({ patientId }: PatientPrescriptionReportsProps) {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadPrescriptions();
  }, [patientId]);

  const loadPrescriptions = async () => {
    try {
      setIsLoading(true);
      const data = await prescriptionsAPI.getByPatientId(patientId);
      setPrescriptions(data);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || prescription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const downloadPrescription = async (prescription: Prescription) => {
    try {
      // Get doctor details from the database or use default values
      const doctorDetails: DoctorDetails = {
        name: prescription.doctorName,
        qualifications: "M.B.B.S., M.D.", // You can enhance this by fetching from doctor data
        registrationNumber: "Reg. No: " + Math.random().toString(36).substr(2, 6).toUpperCase(),
        phone: "+1-555-0000" // You can enhance this by fetching from doctor data
      };

      // Get clinic details from the database or use default values
      const clinicDetails: ClinicDetails = {
        clinicName: "Care Clinic", // You can enhance this by fetching from doctor's clinic data
        clinicAddress: "Near Axis Bank, Kothrud, Pune - 411038",
        clinicPhone: "+1-555-0000",
        clinicEmail: "info@careclinic.com",
        clinicTiming: "09:00 AM - 02:00 PM",
        clinicClosed: "Thursday",
        clinicLogo: "/logos/care-clinic.svg",
        clinicRegistration: "Reg. No: CC001234"
      };

      // Prepare patient vitals (you can enhance this by fetching actual vitals data)
      const patientVitals: PatientVitals = {
        temperature: "36°C",
        bloodPressure: "120/80 mmHg",
        weight: "70 kg",
        pulse: "72 bpm"
      };

      // Prepare medical report data
      const medicalReportData: MedicalReportData = {
        patientId: prescription.id,
      patientName: prescription.patientName,
        patientAddress: "Pune, Maharashtra", // You can enhance this by fetching actual patient data
        patientGender: "M", // You can enhance this by fetching actual patient data
        patientAge: 35, // You can enhance this by fetching actual patient data
        vitals: patientVitals,
        doctor: doctorDetails,
        clinic: clinicDetails,
      diagnosis: prescription.diagnosis,
        medications: prescription.medications.map(med => ({
          ...med,
          totalQuantity: `${med.duration} (Tot: ${Math.ceil(parseInt(med.duration) * 2)} ${med.name.toLowerCase().includes('tab') ? 'Tab' : 'Cap'})`
        })),
        advice: prescription.lifestyleRecommendations,
      followUpDate: prescription.followUpDate,
      createdAt: prescription.createdAt,
        reportType: 'prescription'
      };

    toast({
      title: "Download Started",
      description: "Prescription report downloaded successfully.",
    });

      // Generate and download the professional medical report
      await downloadMedicalReport(
        medicalReportData,
        `prescription-${prescription.patientName}-${new Date(prescription.createdAt).toISOString().split('T')[0]}.html`
      );
    } catch (error) {
      console.error("Error downloading prescription:", error);
      toast({
        title: "Error",
        description: "Failed to download prescription report.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Completed</Badge>;
      case "discontinued":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Discontinued</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "discontinued":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading prescriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Prescription Reports</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and download all your prescription reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {prescriptions.length} Total Reports
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by doctor, specialty, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Prescriptions Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {prescriptions.length === 0 
                ? "You don't have any prescription reports yet."
                : "No prescriptions match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPrescriptions.map((prescription) => (
            <Card key={prescription.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(prescription.status)}
                      <div>
                        <h3 className="font-semibold text-lg">{prescription.doctorName}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{prescription.specialty}</p>
                      </div>
                      {getStatusBadge(prescription.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Diagnosis</p>
                        <p className="font-medium">{prescription.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Follow-up Date</p>
                        <p className="font-medium">{prescription.followUpDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Medications</p>
                        <p className="font-medium">{prescription.medications.length} medication(s)</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                        <p className="font-medium">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedPrescription(prescription)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Prescription Details</DialogTitle>
                          <DialogDescription>
                            Complete prescription information for {prescription.patientName}
                          </DialogDescription>
                        </DialogHeader>
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
                              <div className="flex items-center gap-2">
                                {getStatusBadge(prescription.status)}
                              </div>
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
                                <Card key={medication.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Pill className="w-4 h-4 text-blue-600" />
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
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Lifestyle Recommendations */}
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

                          {/* Follow-up */}
                          <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">Follow-up Date</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{prescription.followUpDate}</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadPrescription(prescription)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
