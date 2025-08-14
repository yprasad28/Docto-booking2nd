import React, { useState, useEffect, useMemo } from 'react';
import {
  getUniqueDoctorsForPatient,
  getMedicalHistoryForDoctorAndPatient,
  Appointment,
  Doctor,
} from '../lib/api'; 
import {ModernNavbar} from '../components/ModernNavbar';
import {ModernFooter} from '../components/ModernFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { type DateRange } from 'react-day-picker';
import { format, endOfMonth, startOfMonth, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  Search,
  RotateCcw,
  Download,
} from 'lucide-react';

const PatientHistoryPage = ({ patientId }: { patientId: string }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [filterDateRange, setFilterDateRange] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Effect to fetch the list of unique doctors on initial load
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      const uniqueDoctors = await getUniqueDoctorsForPatient(patientId);
      setDoctors(uniqueDoctors);
      setIsLoading(false);
    };
    fetchDoctors();
  }, [patientId]);

  // Effect to fetch history when a doctor is selected
  useEffect(() => {
    if (selectedDoctor) {
      const fetchHistory = async () => {
        setIsLoading(true);
        const patientHistory = await getMedicalHistoryForDoctorAndPatient({
          patientId,
          doctorId: selectedDoctor.id,
        });
        setHistory(patientHistory);
        setIsLoading(false);
      };
      fetchHistory();
    } else {
      // Clear history when no doctor is selected
      setHistory([]);
    }
  }, [selectedDoctor, patientId]);

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Filter by search term
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      filtered = filtered.filter((appointment) => {
        const fields: string[] = [];
        // basic fields
        if (appointment.date) fields.push(String(appointment.date));
        if (appointment.time) fields.push(String(appointment.time));
        if (appointment.status) fields.push(String(appointment.status));
        // prescription fields when available
        if ((appointment as any).prescription) {
          const p = (appointment as any).prescription as {
            diagnosis?: string;
            medications?: Array<{ name?: string; dosage?: string; frequency?: string; duration?: string }>;
            lifestyleRecommendations?: string[];
          };
          if (p.diagnosis) fields.push(p.diagnosis);
          if (Array.isArray(p.medications)) {
            p.medications.forEach((m) => {
              if (m.name) fields.push(m.name);
              if (m.dosage) fields.push(m.dosage);
              if (m.frequency) fields.push(m.frequency);
              if (m.duration) fields.push(m.duration);
            });
          }
          if (Array.isArray(p.lifestyleRecommendations)) {
            p.lifestyleRecommendations.forEach((l) => fields.push(l));
          }
        }
        return fields.join(" \n ").toLowerCase().includes(q);
      });
    }

    // Filter by date range
    if (filterDateRange !== "all") {
      if (filterDateRange === "custom" && dateRange?.from && dateRange?.to) {
        filtered = filtered.filter((appointment) => {
          const appointmentDate = new Date(appointment.date);
          const fromUTC = new Date(Date.UTC(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()));
          const toUTC = new Date(Date.UTC(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999));
          return appointmentDate >= fromUTC && appointmentDate <= toUTC;
        });
      } else {
        const months = parseInt(filterDateRange);
        if (!isNaN(months)) {
          const today = new Date();
          let startDate;
          let endDate = endOfMonth(new Date(today.getFullYear(), today.getMonth() - 1));

          if (months === 12) {
            startDate = startOfYear(new Date(today.getFullYear() - 1, 0, 1));
            endDate = endOfYear(new Date(today.getFullYear() - 1, 11, 31));
          } else if (months === 1) {
            startDate = startOfMonth(new Date(today.getFullYear(), today.getMonth() - 1));
            endDate = endOfMonth(new Date(today.getFullYear(), today.getMonth() - 1));
          } else {
            startDate = startOfMonth(new Date(today.getFullYear(), today.getMonth() - months));
          }
          
          filtered = filtered.filter((appointment) => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate >= startDate && appointmentDate <= endDate;
          });
        }
      }
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((appointment) => appointment.status === filterStatus);
    }

    return filtered;
  }, [history, historySearch, filterDateRange, dateRange, filterStatus]);

  const handleResetFilters = () => {
    setFilterDateRange("all");
    setFilterStatus("all");
    setDateRange(undefined);
    setHistorySearch("");
  };

  const openHistoryAsPrintable = () => {
    try {
      const title = `Medical History - ${selectedDoctor?.name || "Doctor"}`;
      const html = generateHistoryHTML({
        title,
        doctorName: selectedDoctor?.name || "",
        patientId,
        items: filteredHistory,
      });
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
      } else {
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `history-${selectedDoctor?.name || "doctor"}-${new Date().toISOString().split("T")[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Error opening printable history", e);
    }
  };

  const generateHistoryHTML = ({
    title,
    doctorName,
    patientId,
    items,
  }: {
    title: string;
    doctorName: string;
    patientId: string;
    items: Appointment[];
  }): string => {
    const rows = items
      .map((appointment) => {
        const p: any = (appointment as any).prescription || {};
        const meds: Array<any> = Array.isArray(p.medications) ? p.medications : [];
        const medsList =
          meds.length > 0
            ? `<ul>${meds
                .map(
                  (m) =>
                    `<li><strong>${escapeHtml(m.name || "")}</strong> - ${escapeHtml(m.dosage || "")} ${escapeHtml(
                      m.frequency || ""
                    )} ${escapeHtml(m.duration || "")}</li>`
                )
                .join("")}</ul>`
            : "<em>No medications</em>";
        const lifestyle = Array.isArray(p.lifestyleRecommendations)
          ? p.lifestyleRecommendations.join(", ")
          : "-";
        return `
          <tr>
            <td>${escapeHtml(String(appointment.date || "-"))}</td>
            <td>${escapeHtml(String(appointment.time || "-"))}</td>
            <td><span class="status ${escapeHtml(String(appointment.status || "")).toLowerCase()}">${escapeHtml(
          String(appointment.status || "-")
        )}</span></td>
            <td>${escapeHtml(p.diagnosis || "-")}</td>
            <td>${medsList}</td>
            <td>${escapeHtml(lifestyle)}</td>
          </tr>
        `;
      })
      .join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 24px; }
    .header { display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; }
    .meta { color: #6b7280; font-size: 12px; }
    .controls { margin: 12px 0 20px 0; }
    .btn { background: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; border: none; cursor: pointer; }
    .btn:hover { background: #1d4ed8; }
    .tip { color: #374151; font-size: 12px; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; }
    .status { padding: 2px 6px; border-radius: 9999px; font-size: 12px; }
    .status.completed { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef9c3; color: #854d0e; }
    .status.cancelled { background: #fee2e2; color: #991b1b; }
    @media print { .controls { display:none; } body { padding: 0 12px; } }
  </style>
  <script>
    function printNow(){ window.print(); }
  </script>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="title">${escapeHtml(title)}</div>
        <div class="meta">Patient ID: ${escapeHtml(patientId)} • Doctor: ${escapeHtml(doctorName)}</div>
        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
      </div>
    </div>
    <div class="controls">
      <button class="btn" onclick="printNow()">Print / Save as PDF</button>
      <div class="tip">Use the browser print dialog to save as PDF.</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 12%">Date</th>
          <th style="width: 10%">Time</th>
          <th style="width: 10%">Status</th>
          <th style="width: 20%">Diagnosis</th>
          <th style="width: 28%">Medications</th>
          <th style="width: 20%">Lifestyle</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
</html>`;
  };

  const escapeHtml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ModernNavbar />
      <main className="flex-grow p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Medical History</h1>

        {isLoading ? (
          <div className="text-center text-lg text-gray-600">Loading...</div>
        ) : (
          <div>
            {/* Doctor List */}
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a Doctor:</h2>
            <div className="w-full max-w-xl mx-auto mb-4">
              <Input
                type="text"
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Search doctors by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              {filteredDoctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`
                    px-6 py-3 rounded-full text-lg font-medium transition-all duration-300
                    ${selectedDoctor?.id === doctor.id
                      ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }
                  `}
                >
                  {doctor.name}
                </button>
              ))}
            </div>

            {/* History Display */}
            {selectedDoctor && (
              <div className="border-t-2 border-gray-200 pt-6 mt-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  History with {selectedDoctor.name}
                </h2>
                
                {/* Advanced Filters */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-gray-500" />
                    Filter History
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                         {/* Search Input */}
                     <div>
                       <Input
                         type="text"
                         value={historySearch}
                         onChange={(e) => setHistorySearch(e.target.value)}
                         placeholder="Search history..."
                         className="w-full text-gray-900 bg-white placeholder:text-gray-500"
                       />
                     </div>
                    
                                         {/* Date Range Filter */}
                     <div>
                       <Select
                         value={filterDateRange}
                         onValueChange={(value) => { 
                           setFilterDateRange(value); 
                           if (value !== "custom") { 
                             setDateRange(undefined); 
                           } 
                         }}
                       >
                         <SelectTrigger className="w-full text-gray-900 bg-white">
                           <SelectValue placeholder="Date range" />
                         </SelectTrigger>
                         <SelectContent className="bg-white text-gray-900">
                           <SelectGroup>
                             <SelectLabel>Date Range</SelectLabel>
                             <SelectItem value="all">All Time</SelectItem>
                             <SelectItem value="1">Last Month</SelectItem>
                             <SelectItem value="3">Last 3 Months</SelectItem>
                             <SelectItem value="6">Last 6 Months</SelectItem>
                             <SelectItem value="12">Last Year</SelectItem>
                             <SelectItem value="custom">Custom Range</SelectItem>
                           </SelectGroup>
                         </SelectContent>
                       </Select>
                     </div>
                    
                    {/* Custom Date Range */}
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateRange?.from && "text-muted-foreground",
                              filterDateRange !== "custom" && "opacity-50 pointer-events-none"
                            )}
                            disabled={filterDateRange !== "custom"}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "LLL dd, y")} -{" "}
                                  {format(dateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Custom date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={(newRange) => {
                              setDateRange(newRange || { from: undefined, to: undefined });
                              setFilterDateRange("custom");
                            }}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                                         {/* Status Filter */}
                     <div>
                       <Select
                         value={filterStatus}
                         onValueChange={(value) => setFilterStatus(value)}
                       >
                         <SelectTrigger className="w-full text-gray-900 bg-white">
                           <SelectValue placeholder="Status" />
                         </SelectTrigger>
                         <SelectContent className="bg-white text-gray-900">
                           <SelectGroup>
                             <SelectLabel>Status</SelectLabel>
                             <SelectItem value="all">All</SelectItem>
                             <SelectItem value="confirmed">Confirmed</SelectItem>
                             <SelectItem value="pending">Pending</SelectItem>
                             <SelectItem value="completed">Completed</SelectItem>
                             <SelectItem value="cancelled">Cancelled</SelectItem>
                           </SelectGroup>
                         </SelectContent>
                       </Select>
                     </div>
                  </div>
                  
                  {/* Reset and Download Buttons */}
                  <div className="flex gap-3 mt-4">
                    <Button onClick={handleResetFilters} variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Filters
                    </Button>
                    <Button 
                      onClick={openHistoryAsPrintable}
                      disabled={filteredHistory.length === 0}
                      className={filteredHistory.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>

                {filteredHistory.length > 0 ? (
                  <div className="space-y-6">
                    {filteredHistory.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Appointment on {appointment.date} at {appointment.time}
                          </h3>
                          <span
                            className={`
                              px-3 py-1 rounded-full text-xs font-semibold
                              ${
                                appointment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : appointment.status === "confirmed"
                                  ? "bg-blue-100 text-blue-800"
                                  : appointment.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            `}
                          >
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        {appointment.prescription && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            
                            <p className="text-gray-600 mt-1">
                              <span className="font-semibold">Diagnosis:</span> {appointment.prescription.diagnosis}
                            </p>
                            <h4 className="font-bold text-gray-700">Prescription:</h4>
                            <ul className="list-disc list-inside mt-2 text-gray-600">
                              {appointment.prescription.medications.map((med) => (
                                <li key={med.id}>
                                  <span className="font-semibold">{med.name}:</span> {med.dosage}, {med.frequency}, {med.duration}
                                </li>
                              ))}
                            </ul>
                            <p className="text-gray-600 mt-2">
                              <span className="font-semibold">Lifestyle:</span> {appointment.prescription.lifestyleRecommendations.join(", ")}
                            </p>
                          </div>
                        )}
                        {!appointment.prescription && (
                          <p className="text-gray-500 italic mt-2">No prescription was added for this appointment.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-lg text-gray-500">
                    No history found with Dr. {selectedDoctor.name} {historySearch || filterDateRange !== "all" || filterStatus !== "all" ? "for the selected filters." : "."}
                  </div>
                )}
              </div>
            )}
            {!selectedDoctor && doctors.length > 0 && (
              <div className="text-center text-lg text-gray-500 mt-8">
                Please select a doctor to view your medical history.
              </div>
            )}
            {!selectedDoctor && doctors.length === 0 && (
              <div className="text-center text-lg text-gray-500 mt-8">
                You have no appointments with any doctors.
              </div>
            )}
          </div>
        )}
      </div>
      </main>
      <ModernFooter />
    </div>
  );
};

export default PatientHistoryPage;


