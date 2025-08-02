// components/ui/appointment-calendar.tsx
"use client";

import React, { useRef, useEffect } from "react";
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
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }

  const handleEventClick = (clickInfo: any) => {
    toast({
      title: "Appointment Details",
      description: (
        <div>
          <p>Patient: {clickInfo.event.extendedProps.patientName}</p>
          <p>Specialty: {clickInfo.event.extendedProps.specialty}</p>
          <p>Time: {clickInfo.event.extendedProps.time}</p>
          <p>
            Status:{" "}
            {clickInfo.event.extendedProps.status.charAt(0).toUpperCase() +
              clickInfo.event.extendedProps.status.slice(1)}
          </p>
        </div>
      ),
    });
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
        id: event.id,
        date: newDate,
        time: newTime,
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
        eventContent={(arg) => {
          const { patientName, specialty, status, time } =
            arg.event.extendedProps;
          const statusClass = getEventClasses(status); // Use the new function

          return (
            <div
              className={`flex flex-col rounded-md p-1 truncate text-xs cursor-pointer overflow-hidden ${statusClass}`}
              title={`${patientName} - ${specialty} (${
                status.charAt(0).toUpperCase() + status.slice(1)
              }) at ${time}`}
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
    </div>
  );
}
