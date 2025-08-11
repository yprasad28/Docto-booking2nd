"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ModernNavbar } from "@/components/ModernNavbar";
import { ModernFooter } from "@/components/ModernFooter";
import { PatientPrescriptionReports } from "@/components/PatientPrescriptionReports";
import { FollowUpReminder } from "@/components/FollowUpReminder";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MyReportsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ModernNavbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Reports & Reminders
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View your prescription reports and manage follow-up reminders
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <PatientPrescriptionReports patientId={user?.id || ''} />
            </div>
            
            <div>
              <FollowUpReminder patientId={user?.id || ''} />
            </div>
          </div>
        </div>

        <ModernFooter />
      </div>
    </ProtectedRoute>
  );
}
