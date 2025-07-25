"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ModernNavbar } from "@/components/ModernNavbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { doctorsAPI, appointmentsAPI, type Doctor } from "@/lib/api"
import { Calendar, Clock, Video, Phone, Building, CreditCard, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [consultationType, setConsultationType] = useState(searchParams.get("type") || "clinic")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadDoctor(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    // Set default date to today
    const today = new Date()
    setSelectedDate(today.toISOString().split("T")[0])
  }, [])

  const loadDoctor = async (id: string) => {
    try {
      const doctorData = await doctorsAPI.getById(id)
      setDoctor(doctorData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load doctor information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getConsultationFee = () => {
    if (!doctor) return 0
    return consultationType === "clinic" ? doctor.consultationFee : doctor.videoConsultationFee
  }

  const getAvailableDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" })

      // Check if doctor is available on this day
      const availabilityKey = consultationType === "clinic" ? "clinic" : "online"
      const isAvailable = doctor?.availability?.[availabilityKey]?.includes(dayName)

      if (isAvailable) {
        dates.push({
          date: date.toISOString().split("T")[0],
          display: date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          dayName,
        })
      }
    }

    return dates
  }

  const handleBookAppointment = async () => {
    if (!doctor || !user || !selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setShowPayment(true)
  }

  const handlePayment = async () => {
    if (!doctor || !user) return

    setIsBooking(true)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const appointment = {
        doctorId: doctor.id,
        patientId: user.id,
        doctorName: doctor.name,
        patientName: user.name,
        specialty: doctor.specialty,
        date: selectedDate,
        time: selectedTime,
        status: "confirmed" as const,
        consultationType,
        symptoms,
        fee: getConsultationFee(),
      }

      await appointmentsAPI.create(appointment)

      setBookingComplete(true)
      toast({
        title: "Success",
        description: "Appointment booked successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book appointment",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["patient"]}>
        <div className="min-h-screen bg-gray-50">
          <ModernNavbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading booking information...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!doctor) {
    return (
      <ProtectedRoute allowedRoles={["patient"]}>
        <div className="min-h-screen bg-gray-50">
          <ModernNavbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Doctor not found</h3>
                <Button onClick={() => router.push("/find-doctors")}>Back to Search</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (bookingComplete) {
    return (
      <ProtectedRoute allowedRoles={["patient"]}>
        <div className="min-h-screen bg-gray-50">
          <ModernNavbar />
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
                <p className="text-gray-600 mb-6">
                  Your appointment with Dr. {doctor.name} has been successfully booked.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium capitalize">{consultationType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee:</span>
                      <span className="font-medium">${getConsultationFee()}</span>
                    </div>
                  </div>
                </div>
                <div className="space-x-4">
                  <Button onClick={() => router.push("/appointments")}>View Appointments</Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
            <p className="text-gray-600">Schedule your consultation with Dr. {doctor.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              {!showPayment ? (
                <>
                  {/* Doctor Info */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <img
                          src={doctor.image || "/placeholder.svg"}
                          alt={doctor.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
                          <p className="text-blue-600">{doctor.specialty}</p>
                          <div className="flex items-center mt-1">
                            {consultationType === "clinic" && <Building className="w-4 h-4 mr-1" />}
                            {consultationType === "video" && <Video className="w-4 h-4 mr-1" />}
                            {consultationType === "call" && <Phone className="w-4 h-4 mr-1" />}
                            <span className="text-sm text-gray-600 capitalize">{consultationType} Consultation</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Date Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Select Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {getAvailableDates().map((dateOption) => (
                          <button
                            key={dateOption.date}
                            onClick={() => setSelectedDate(dateOption.date)}
                            className={`p-3 text-center border rounded-lg transition-colors ${
                              selectedDate === dateOption.date
                                ? "border-blue-600 bg-blue-50 text-blue-600"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-sm font-medium">{dateOption.display}</div>
                            <div className="text-xs text-gray-500">{dateOption.dayName}</div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Time Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Select Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {doctor.timeSlots?.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-2 text-center border rounded-lg transition-colors ${
                              selectedTime === time
                                ? "border-blue-600 bg-blue-50 text-blue-600"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Symptoms */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Describe Your Symptoms</CardTitle>
                      <CardDescription>
                        Please provide details about your condition to help the doctor prepare
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Describe your symptoms, concerns, or reason for consultation..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        rows={4}
                      />
                    </CardContent>
                  </Card>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBookAppointment}
                    disabled={!selectedDate || !selectedTime}
                  >
                    Proceed to Payment
                  </Button>
                </>
              ) : (
                /* Payment Form */
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payment Information
                    </CardTitle>
                    <CardDescription>Complete your payment to confirm the appointment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input id="cardName" placeholder="John Doe" />
                      </div>
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button className="w-full" size="lg" onClick={handlePayment} disabled={isBooking}>
                        {isBooking ? "Processing..." : `Pay $${getConsultationFee()} & Book Appointment`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Booking Summary */}
            <div>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Doctor:</span>
                      <span className="font-medium">{doctor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialty:</span>
                      <span className="font-medium">{doctor.specialty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <div className="flex items-center">
                        {consultationType === "clinic" && <Building className="w-4 h-4 mr-1" />}
                        {consultationType === "video" && <Video className="w-4 h-4 mr-1" />}
                        {consultationType === "call" && <Phone className="w-4 h-4 mr-1" />}
                        <span className="font-medium capitalize">{consultationType}</span>
                      </div>
                    </div>
                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(selectedDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-green-600">${getConsultationFee()}</span>
                    </div>
                  </div>

                  {consultationType !== "clinic" && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> You will receive a{" "}
                        {consultationType === "video" ? "video call" : "phone call"} link/number before your
                        appointment.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
