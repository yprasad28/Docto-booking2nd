// const API_BASE = "http://localhost:3001";
const API_BASE = "https://opulent-doodle-g4xvqrq9vv9vcv7w-3001.app.github.dev";

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  qualifications: string;
  experience: string;
  clinicAddress: string;
  availability?: TimeSlot[];
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  time: string;
  isBooked: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "rescheduled";
  doctorName: string;
  patientName: string;
  specialty: string;
  prescription?: Prescription;
  reviewId?: string;
}
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  medications: Medication[];
  lifestyleRecommendations: string[];
  followUpDate: string;
  createdAt: string;
  status: "active" | "completed" | "discontinued";
}

export type Review = {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  rating: number; // 1-5
  reviewText: string;
  timestamp: string;
};

// Check if JSON Server is running
const checkServerStatus = async () => {
  try {
    const response = await fetch(`${API_BASE}/doctors`, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Auth API
export const authAPI = {
  async login(email: string, password: string, role: "doctor" | "patient") {
    try {
      const endpoint = role === "doctor" ? "doctors" : "patients";
      const response = await fetch(`${API_BASE}/${endpoint}`);

      if (!response.ok) {
        throw new Error(
          "Server not responding. Please make sure JSON Server is running on port 3001."
        );
      }

      const users = await response.json();
      const user = users.find(
        (u: any) => u.email === email && u.password === password
      );

      if (!user) {
        throw new Error("Invalid email or password");
      }

      return { ...user, role };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  async signup(userData: any, role: "doctor" | "patient") {
    try {
      const endpoint = role === "doctor" ? "doctors" : "patients";
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...userData, id: Date.now().toString() }),
      });

      if (!response.ok) {
        throw new Error(
          "Server not responding. Please make sure JSON Server is running on port 3001."
        );
      }

      const user = await response.json();
      return { ...user, role };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },
};

// Doctors API
export const doctorsAPI = {
  async getAll(): Promise<Doctor[]> {
    try {
      const response = await fetch(`${API_BASE}/doctors`);
      if (!response.ok) {
        throw new Error("Failed to fetch doctors");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  async getById(id: string): Promise<Doctor> {
    try {
      const response = await fetch(`${API_BASE}/doctors/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch doctor");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  async update(id: string, data: Partial<Doctor>): Promise<Doctor> {
    try {
      const response = await fetch(`${API_BASE}/doctors/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update doctor");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },
};

// Appointments API
export const appointmentsAPI = {
  async create(appointment: Omit<Appointment, "id">): Promise<Appointment> {
    try {
      const response = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...appointment, id: Date.now().toString() }),
      });
      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  async getByDoctorId(doctorId: string): Promise<Appointment[]> {
    try {
      const response = await fetch(
        `${API_BASE}/appointments?doctorId=${doctorId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    try {
      const response = await fetch(
        `${API_BASE}/appointments?patientId=${patientId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  async updateStatus(
    id: string,
    status: Appointment["status"]
  ): Promise<Appointment> {
    try {
      const response = await fetch(`${API_BASE}/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },
  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    try {
      const response = await fetch(
        `${API_BASE}/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.message || `Failed to cancel: ${response.statusText}`
          );
        } catch {
          throw new Error(
            `Failed to cancel: ${response.statusText} - ${
              errorText || "No specific error message from server"
            }`
          );
        }
      }

      // This return statement is now correctly inside the try block
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  async updateSchedule(
    appointmentId: string,
    newDate: string,
    newTime: string
  ): Promise<Appointment> {
    try {
      const response = await fetch(
        `${API_BASE}/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: newDate,
            time: newTime,
            status: "rescheduled",
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update appointment schedule");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },
  async addPrescription(appointmentId: string, prescription:Omit<Prescription, "id" | "createdAt" | "diagnosis">, diagnosis: string): Promise<Appointment> {
    try {
      // 1. Fetch the existing appointment
      const response = await fetch(`${API_BASE}/appointments/${appointmentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch appointment ${appointmentId}`);
      }
      const existingAppointment: Appointment = await response.json();

      // 3. Create the prescription record
      const prescriptionPayload = {
        ...prescription,
        appointmentId: appointmentId,
        patientId: existingAppointment.patientId,
        doctorId: existingAppointment.doctorId,
        patientName: existingAppointment.patientName,
        doctorName: existingAppointment.doctorName,
        specialty: existingAppointment.specialty,
        diagnosis: diagnosis,
      };
      const prescriptionResponse = await prescriptionsAPI.create(prescriptionPayload);

       const updatedAppointmentData = {
        ...existingAppointment,
        prescription: prescription,
        diagnosis: prescriptionResponse,
        status: "completed"
      };

      // 3. Send a PATCH request to update the appointment on the server
      const patchResponse = await fetch(`${API_BASE}/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedAppointmentData),
      });

      if (!patchResponse.ok) {
        throw new Error(`Failed to update appointment ${appointmentId} with prescription`);
      }

      return patchResponse.json(); // Return the updated appointment from the server
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      console.error(`Error in addPrescription for appointment ${appointmentId}:`, error);
      throw error;
    }
  },
};

// Prescriptions API
export const prescriptionsAPI = {
  // Create new prescription
  async create(prescriptionData: Omit<Prescription, "id" | "createdAt">): Promise<Prescription> {
    try {
      const response = await fetch(`${API_BASE}/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...prescriptionData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create prescription");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  // Get all prescriptions for a patient
  async getByPatientId(patientId: string): Promise<Prescription[]> {
    try {
      const response = await fetch(`${API_BASE}/prescriptions?patientId=${patientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prescriptions");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  // Get all prescriptions by a doctor
  async getByDoctorId(doctorId: string): Promise<Prescription[]> {
    try {
      const response = await fetch(`${API_BASE}/prescriptions?doctorId=${doctorId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prescriptions");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  // Get prescription by ID
  async getById(id: string): Promise<Prescription> {
    try {
      const response = await fetch(`${API_BASE}/prescriptions/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prescription");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  // Update prescription
  async update(id: string, data: Partial<Prescription>): Promise<Prescription> {
    try {
      const response = await fetch(`${API_BASE}/prescriptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update prescription");
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  // Delete prescription
  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/prescriptions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete prescription");
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },

  // Get prescription by appointment ID
  async getByAppointmentId(appointmentId: string): Promise<Prescription | null> {
    try {
      const response = await fetch(`${API_BASE}/prescriptions?appointmentId=${appointmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prescription");
      }
      const prescriptions = await response.json();
      return prescriptions.length > 0 ? prescriptions[0] : null;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please run 'npm run json-server' in a separate terminal."
        );
      }
      throw error;
    }
  },
};

export async function getMedicalHistoryForDoctorAndPatient({ doctorId, patientId }: { doctorId: string; patientId: string }): Promise<Appointment[]> {
  try {
    const allAppointments = await appointmentsAPI.getByPatientId(patientId);
    const doctorAppointments = allAppointments.filter(
      (appt) => appt.doctorId === doctorId
    );

    const appointmentsWithPrescriptions = await Promise.all(
      doctorAppointments.map(async (appt) => {
        const prescription = await prescriptionsAPI.getByAppointmentId(appt.id);
        return { ...appt, prescription };
      })
    );
    return appointmentsWithPrescriptions;
  } catch (error) {
    console.error("Error fetching medical history:", error);
    return [];
  }
}

export async function getUniqueDoctorsForPatient(patientId: string): Promise<Doctor[]> {
  try {
    const allAppointments = await appointmentsAPI.getByPatientId(patientId);
    const doctorIds = [...new Set(allAppointments.map(appt => appt.doctorId))];
    const doctorsResponse = await fetch(`${API_BASE}/doctors?${doctorIds.map(id => `id=${id}`).join('&')}`);
    if (!doctorsResponse.ok) throw new Error("Failed to fetch doctors");
    return doctorsResponse.json();
  } catch (error) {
    console.error("Error fetching unique doctors:", error);
    return [];
  }
}
export const reviewsAPI = {
  // Simulates submitting a new review
  submitReview: async (reviewData: {
    appointmentId: string;
    rating: number;
    reviewText: string;
    patientId: string;
  }): Promise<Review> => {
    // First, fetch the appointment to get the doctorId
    const appointmentResponse = await fetch(`${API_BASE}/appointments/${reviewData.appointmentId}`);
    if (!appointmentResponse.ok) {
        throw new Error("Appointment not found.");
    }
    const appointment: Appointment = await appointmentResponse.json();

    const newReview = {
        doctorId: appointment.doctorId,
        ...reviewData,
        timestamp: new Date().toISOString(),
    };

    // Post the new review to the /reviews endpoint
    const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview),
    });

    if (!response.ok) {
      throw new Error("Failed to submit review.");
    }
    const submittedReview: Review = await response.json();
    
    // Patch the appointment to link the new review
    await fetch(`${API_BASE}/appointments/${submittedReview.appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: submittedReview.id }),
    });

    return submittedReview;
  },

  // Simulates fetching a single review by its ID
  getReviewById: async (reviewId: string): Promise<Review> => {
    const response = await fetch(`${API_BASE}/reviews/${reviewId}`);
    if (!response.ok) {
      throw new Error("Review not found.");
    }
    return response.json();
  },

  // Simulates fetching all reviews for a specific doctor
  getByDoctorId: async (doctorId: string): Promise<Review[]> => {
    // JSON Server supports filtering with query parameters
    const response = await fetch(`${API_BASE}/reviews?doctorId=${doctorId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch reviews.");
    }
    return response.json();
  },

  // Helper function to calculate average rating (can be done on the frontend)
  getAverageRating: (reviews: Review[]): number => {
    if (reviews.length === 0) {
      return 0;
    }
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return parseFloat((totalRating / reviews.length).toFixed(2));
  },
  
  // Helper function to get rating distribution
  getRatingDistribution: (reviews: Review[]): Record<string, number> => {
    const distribution: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    reviews.forEach(review => {
        const ratingKey = review.rating.toString();
        if (ratingKey in distribution) {
            distribution[ratingKey]++;
        }
    });
    return distribution;
}
};