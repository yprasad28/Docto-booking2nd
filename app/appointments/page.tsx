"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/Navbar"
import { ModernFooter } from "@/components/ModernFooter" // ADDED: For UI consistency
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { appointmentsAPI, type Appointment } from "@/lib/api"
import { Calendar, Clock, User, Stethoscope } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AppointmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAppointments()
    }
  }, [user])

  const loadAppointments = async () => {
    if (!user) return

    try {
      const appointmentsData = await appointmentsAPI.getByPatientId(user.id)
      // IMPROVEMENT: Sort appointments by date, newest first
      setAppointments(appointmentsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // FIXED: Replaced with a theme-aware function for better readability in both modes.
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      {/* CHANGED: Added dual-theme background */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            {/* CHANGED: Added dual-theme text colors */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">My Appointments</h1>
            <p className="text-gray-600 dark:text-gray-300">View and manage your upcoming and past appointments</p>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-500 dark:text-white">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                {/* CHANGED: Added dual-theme text colors */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Appointments</h3>
                <p className="text-gray-500 dark:text-gray-400">You haven't booked any appointments yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        {appointment.doctorName}
                      </CardTitle>
                      {/* FIXED: Using a theme-aware function for badge styling */}
                      <Badge className={`${getStatusBadgeClass(appointment.status)} capitalize`}>
                        {appointment.status}
                      </Badge>
                    </div>
                    {/* CHANGED: Added dual-theme text color for specialty */}
                    <CardDescription className="flex items-center text-teal-600 dark:text-teal-400 pt-1">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      {appointment.specialty}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* CHANGED: Added dual-theme text colors for details */}
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(appointment.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="w-4 h-4 mr-2" />
                        {appointment.time}
                      </div>
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
  )
}