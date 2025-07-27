"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/Navbar" // Assuming this Navbar is styled for dashboards
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { appointmentsAPI, type Appointment } from "@/lib/api"
import { Calendar, Users, Clock, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DoctorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAppointments()
    }
  }, [user])

  const loadAppointments = async () => {
    if (!user) return

    try {
      const appointmentsData = await appointmentsAPI.getByDoctorId(user.id)
      setAppointments(appointmentsData)

      // Calculate stats
      const stats = {
        total: appointmentsData.length,
        pending: appointmentsData.filter((a) => a.status === "pending").length,
        confirmed: appointmentsData.filter((a) => a.status === "confirmed").length,
        completed: appointmentsData.filter((a) => a.status === "completed").length,
      }
      setStats(stats)
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

  const todayAppointments = appointments.filter(
    (appointment) => appointment.date === new Date().toISOString().split("T")[0],
  )

  const getStatusBadgeClass = (status: "confirmed" | "pending" | "completed" | "canceled") => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-600 dark:text-white"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white"
    }
  }

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      {/* CHANGED: Added dual-theme background */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            {/* CHANGED: Added dual-theme text colors */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome back, Dr. {user?.name?.split(" ")[1] || user?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Here's your practice overview</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card components from shadcn/ui will adapt their background automatically */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-gray-500 dark:text-teal-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-gray-500 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting confirmation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <Users className="h-4 w-4 text-gray-500 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.confirmed}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ready to see</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
              <CardDescription>{todayAppointments.length} appointments scheduled for today</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading appointments...</div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    // CHANGED: Added dual-theme background for appointment items
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {/* IMPROVEMENT: Made patient avatar colors theme-aware */}
                        <div className="w-10 h-10 bg-blue-100 dark:bg-teal-600 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 dark:text-white text-sm font-bold">
                            {appointment.patientName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{appointment.patientName}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">{appointment.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {/* FIXED: Using a helper function for dynamic, theme-aware badge colors */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(
                            appointment.status,
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}