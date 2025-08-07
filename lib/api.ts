const API_BASE = "http://localhost:3001";
// const API_BASE = "https://wtxpr5-3001.csb.app";

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
}
export type Prescription = {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  appointmentId: string;
  createdAt: string;
};
// Mock data store for prescriptions
const mockPrescriptions: Prescription[] = [];
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
  async addPrescription(appointmentId: string, prescription: Prescription): Promise<Appointment> {
    try {
      // 1. Fetch the existing appointment
      const response = await fetch(`${API_BASE}/appointments/${appointmentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch appointment ${appointmentId}`);
      }
      const existingAppointment: Appointment = await response.json();

      // 2. Update the appointment with the new prescription and status
      const updatedAppointmentData = {
        ...existingAppointment,
        prescription: prescription,
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

// A simple mock API for prescriptions
export const prescriptionsAPI = {
  create: async (prescriptionData: Omit<Prescription, "id" | "createdAt">) => {
    // Simulate a network request
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newPrescription: Prescription = {
      ...prescriptionData,
      id: crypto.randomUUID(), // Generates a unique ID
      createdAt: new Date().toISOString(),
    };
    mockPrescriptions.push(newPrescription);
    console.log("New prescription added:", newPrescription);
    console.log("All prescriptions:", mockPrescriptions);
    return newPrescription;
  },
};
