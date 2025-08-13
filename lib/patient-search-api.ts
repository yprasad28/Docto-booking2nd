import { appointmentsAPI, type Appointment } from './api';

export interface PatientSearchResult {
  id: string;
  name: string;
  mobile: string;
  email: string;
  lastVisit?: string;
  appointmentCount: number;
}

export class PatientSearchAPI {
  // Search patients by various criteria
  static async searchPatients(query: string, doctorId: string): Promise<PatientSearchResult[]> {
    try {
      // Get all appointments for the doctor
      const allAppointments = await appointmentsAPI.getByDoctorId(doctorId);
      
      // Group appointments by patient and create patient objects
      const patientMap = new Map<string, PatientSearchResult>();
      
      allAppointments.forEach(appointment => {
        const patientId = appointment.patientId;
        const patientName = appointment.patientName;
        
        if (!patientMap.has(patientId)) {
          patientMap.set(patientId, {
            id: patientId,
            name: patientName,
            mobile: appointment.patientMobile || 'N/A',
            email: appointment.patientEmail || 'N/A',
            lastVisit: appointment.date,
            appointmentCount: 1
          });
        } else {
          const existing = patientMap.get(patientId)!;
          existing.appointmentCount += 1;
          
          // Update last visit if this appointment is more recent
          if (new Date(appointment.date) > new Date(existing.lastVisit || '1970-01-01')) {
            existing.lastVisit = appointment.date;
          }
        }
      });
      
      const patients = Array.from(patientMap.values());
      
      // Filter by search query
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        return patients.filter(patient => 
          patient.name.toLowerCase().includes(searchTerm) ||
          patient.mobile.includes(searchTerm) ||
          patient.id.toLowerCase().includes(searchTerm) ||
          patient.email.toLowerCase().includes(searchTerm)
        );
      }
      
      // Return all patients sorted by most recent visit
      return patients.sort((a, b) => {
        if (!a.lastVisit && !b.lastVisit) return 0;
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      });
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }

  // Get recent patients for the doctor
  static async getRecentPatients(doctorId: string, limit: number = 5): Promise<PatientSearchResult[]> {
    try {
      const allPatients = await this.searchPatients('', doctorId);
      return allPatients.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent patients:', error);
      return [];
    }
  }

  // Get patient by ID
  static async getPatientById(patientId: string, doctorId: string): Promise<PatientSearchResult | null> {
    try {
      const patients = await this.searchPatients(patientId, doctorId);
      return patients.find(p => p.id === patientId) || null;
    } catch (error) {
      console.error('Error getting patient by ID:', error);
      return null;
    }
  }
}

