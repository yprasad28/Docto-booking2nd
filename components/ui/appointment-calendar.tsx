// components/ui/appointment-calendar.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // For clickable events
import { useToast } from "@/hooks/use-toast";
import { appointmentsAPI, type Appointment } from "@/lib/api";
interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAppointmentUpdate: (updatedAppointment: Appointment) => void;
}

export function AppointmentCalendar({
  appointments,
  onAppointmentUpdate,
}: AppointmentCalendarProps) {
  const calendarRef = useRef(null);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const events = appointments.map((appointment) => ({
    id: appointment.id,
    start: `${appointment.date}T${appointment.time}`,
    extendedProps: {
      status: appointment.status,
      patientName: appointment.patientName,
      specialty: appointment.specialty,
      time: appointment.time,
    },
  }));

  function getEventClasses(status: string) {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "rescheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }

  const handleEventClick = (clickInfo: any) => {
    const clickedAppointment: Appointment = {
      id: clickInfo.event.id,
      date: clickInfo.event.startStr.split("T")[0],
      time: clickInfo.event.extendedProps.time,
      patientName: clickInfo.event.extendedProps.patientName,
      specialty: clickInfo.event.extendedProps.specialty,
      status: clickInfo.event.extendedProps.status,
    };

    setSelectedAppointment(clickedAppointment);
    setIsModalOpen(true);
  };
  // Add a new function to handle dropping an event
  const handleEventDrop = async (info: any) => {
    const { event, oldEvent } = info;
    const newStart = event.startStr.split("T");
    const newDate = newStart[0];
    const newTime = newStart[1]
      ? newStart[1].substring(0, 5)
      : event.extendedProps.time;

    try {
      console.log("Attempting to reschedule appointment:", event.id);
      const updatedAppointment = await appointmentsAPI.updateSchedule(
        event.id,
        newDate,
        newTime
      );
      console.log(
        "API call successful. Updated appointment:",
        updatedAppointment
      );

      // After a successful API call, update the parent state
      onAppointmentUpdate({
        ...event.extendedProps,
        id: updatedAppointment.id,
        date: updatedAppointment.date,
        time: updatedAppointment.time,
        status: updatedAppointment.status,
      });

      toast({
        title: "Appointment Rescheduled",
        description: `Appointment for ${event.extendedProps.patientName} was moved to ${newDate} at ${newTime}.`,
      });
    } catch (error) {
      console.error("API call failed:", error); // <-- This will show you the exact error
      info.revert();
      toast({
        title: "Reschedule Failed",
        description: "An error occurred while rescheduling the appointment.",
        variant: "destructive",
      });
    }
  };
  const handleEventMount = (info: any) => {
    const { patientName, specialty, time, status } = info.event.extendedProps;
    const appointmentId = info.event.id;

    const tooltip = document.createElement("div");
    tooltip.className = "custom-tooltip-enhanced";
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <div class="tooltip-title">Appointment Details</div>
      </div>
      <div class="tooltip-body">
        <div class="tooltip-row">
          <span class="tooltip-label">Patient:</span>
          <span class="tooltip-value">${patientName}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Specialty:</span>
          <span class="tooltip-value">${specialty}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Time:</span>
          <span class="tooltip-value">${time}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Status:</span>
          <span class="tooltip-value tooltip-status tooltip-status-${status}">${status}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">ID:</span>
          <span class="tooltip-value tooltip-id">${appointmentId}</span>
        </div>
      </div>
    `;

    // Add a mouseover listener to display the tooltip
    info.el.addEventListener("mouseover", () => {
      document.body.appendChild(tooltip);
      const rect = info.el.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    });

    // Add a mouseout listener to remove the tooltip
    info.el.addEventListener("mouseout", () => {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    });
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        weekends={true}
        events={events}
        eventClick={handleEventClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        editable={true}
        eventDrop={handleEventDrop}
        eventDidMount={handleEventMount}
        eventContent={(arg) => {
          const { patientName, specialty, status, time } =
            arg.event.extendedProps;
          const statusClass = getEventClasses(status); // Use the new function

          return (
            <div
              className={`flex flex-col rounded-md p-1 truncate text-xs cursor-pointer overflow-hidden ${statusClass}`}
            >
              <div className="font-semibold">
                {time} - {patientName}
              </div>
              <div className="text-gray-600 dark:text-gray-300 text-[10px] truncate">
                {specialty}
                <span className="ml-1 capitalize text-[9px] font-medium opacity-80">
                  ({status})
                </span>
              </div>
            </div>
          );
        }}
      />
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Appointment Details</h3>
              <div className="space-y-2">
                <p>
                  <b>Patient:</b> {selectedAppointment.patientName}
                </p>
                <p>
                  <b>Specialty:</b> {selectedAppointment.specialty}
                </p>
                <p>
                  <b>Date:</b> {selectedAppointment.date}
                </p>
                <p>
                  <b>Time:</b> {selectedAppointment.time}
                </p>
                <p>
                  <b>Status:</b> {selectedAppointment.status}
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                {/* Reschedule Button Placeholder */}
                <button
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  onClick={() => {
                    setIsRescheduleModalOpen(true);
                    setIsModalOpen(false);
                  }}
                >
                  Reschedule
                </button>

                {/* Cancel Button */}
                {selectedAppointment.status !== "cancelled" &&
                  selectedAppointment.status !== "completed" && (
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      onClick={async () => {
                        if (selectedAppointment) {
                          try {
                            const updatedAppointment =
                              await appointmentsAPI.updateStatus(
                                selectedAppointment.id,
                                "cancelled"
                              );
                            onAppointmentUpdate({
                              ...selectedAppointment,
                              status: updatedAppointment.status,
                            });

                            toast({
                              title: "Appointment Cancelled",
                              description: `Appointment for ${selectedAppointment.patientName} has been cancelled.`,
                            });

                            setIsModalOpen(false);
                          } catch (error) {
                            console.error("Cancellation failed:", error);
                            toast({
                              title: "Cancellation Failed",
                              description:
                                "An error occurred while cancelling the appointment.",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    >
                      Cancel
                    </button>
                  )}

                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isRescheduleModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Reschedule Appointment</h3>
              <div className="space-y-4">
                <p>
                  Rescheduling appointment for{" "}
                  <b>{selectedAppointment.patientName}</b>.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  onClick={async () => {
                    if (selectedAppointment && newDate && newTime) {
                      try {
                        const updatedAppointment =
                          await appointmentsAPI.updateSchedule(
                            selectedAppointment.id,
                            newDate,
                            newTime
                          );
                        onAppointmentUpdate({
                          ...selectedAppointment,
                          date: updatedAppointment.date,
                          time: updatedAppointment.time,
                          status: updatedAppointment.status,
                        });
                        toast({
                          title: "Appointment Rescheduled",
                          description: `Appointment for ${updatedAppointment.patientName} was moved to ${updatedAppointment.date} at ${updatedAppointment.time}.`,
                        });
                        setIsRescheduleModalOpen(false); // Close this modal
                        setIsModalOpen(false); // Close the first modal
                      } catch (error) {
                        toast({
                          title: "Reschedule Failed",
                          description: "An error occurred while rescheduling.",
                          variant: "destructive",
                        });
                      }
                    } else {
                      toast({
                        title: "Error",
                        description: "Please select a new date and time.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Confirm Reschedule
                </button>
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={() => setIsRescheduleModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
