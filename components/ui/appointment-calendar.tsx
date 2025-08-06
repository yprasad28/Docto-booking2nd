// components/ui/appointment-calendar.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useToast } from "@/hooks/use-toast";
import { appointmentsAPI, type Appointment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, Plus, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAppointmentUpdate: (updatedAppointment: Appointment) => void;
  onNewAppointment?: () => void;
}

export function AppointmentCalendar({
  appointments,
  onAppointmentUpdate,
  onNewAppointment,
}: AppointmentCalendarProps) {
  const calendarRef = useRef(null);
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(() => {
    // Set to August 2025 to match the image
    return new Date(2025, 7, 1); // Month is 0-indexed, so 7 = August
  });
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: any;
    x: number;
    y: number;
  }>({
    visible: false,
    content: null,
    x: 0,
    y: 0,
  });

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(320);

  // Filter states
  const [filters, setFilters] = useState({
    eventTypes: {
      confirmed: true,
      pending: true,
      cancelled: true,
      completed: true,
    },
    status: {
      confirmed: true,
      pending: true,
      cancelled: true,
      completed: true,
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);


  // Mini calendar state - initialize with current date
  const [miniCalendarDate, setMiniCalendarDate] = useState(() => {
    // Set to August 2025 to match the image
    return new Date(2025, 7, 1); // Month is 0-indexed, so 7 = August
  });

  const filteredAppointments = appointments.filter(
    (appointment) => filters.status[appointment.status]
  );

  const events = filteredAppointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.time} - ${appointment.patientName}`,
    start: `${appointment.date}T${appointment.time}`,
    end: `${appointment.date}T${appointment.time}`,
    extendedProps: appointment,
    backgroundColor:
      appointment.status === "confirmed"
        ? "#d1fae5"
        : appointment.status === "pending"
        ? "#fef9c3"
        : appointment.status === "cancelled"
        ? "#fee2e2"
        : "#e0e7ef",
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

  const handleEventMouseEnter = (mouseEnterInfo: any) => {
    const { event, el } = mouseEnterInfo;
    const rect = el.getBoundingClientRect();
    
    setTooltip({
      visible: true,
      content: event.extendedProps,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleEventMouseLeave = () => {
    setTooltip({
      visible: false,
      content: null,
      x: 0,
      y: 0,
    });
  };

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
      console.error("API call failed:", error);
      info.revert();
      toast({
        title: "Reschedule Failed",
        description: "An error occurred while rescheduling the appointment.",
        variant: "destructive",
      });
    }
  };


  // Filter handlers
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: {
        ...prev.status,
        [status]: checked,
      },
    }));
  };

  const handleSelectAllStatus = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: {
        confirmed: checked,
        pending: checked,
        cancelled: checked,
        completed: checked,
      },
    }));
  };

  // Mini calendar handlers
  const goToPreviousMonth = () => {
    setMiniCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setMiniCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setMiniCalendarDate(today);
    setCurrentDate(today);
    setCurrentView("dayGridMonth");
  };

  // Handle mini calendar date click
  const handleMiniCalendarDateClick = (date: Date) => {
    setCurrentDate(date);
    setCurrentView("timeGridDay"); // Switch to day view
    
    // Use calendar API to navigate to the date
    if (calendarRef.current) {
      const calendarApi = (calendarRef.current as any).getApi();
      if (calendarApi) {
        calendarApi.changeView("timeGridDay", date);
      }
    }
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(500, startWidth + deltaX));
    setSidebarWidth(newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Add resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, startX, startWidth]);

  // Add a helper function for local date formatting
  function formatLocalDate(date: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  // Generate mini calendar days
  const generateMiniCalendarDays = () => {
    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      
      // Format date to match appointment date format (YYYY-MM-DD)
      const dateString = formatLocalDate(date);
      
             // Check if there are any appointments for this specific date
      const hasAppointments = filteredAppointments.some(
        (appointment) => appointment.date === dateString
      );
       
      days.push({
        date,
        isCurrentMonth,
        isToday,
        hasAppointments,
      });
    }
    
    return days;
  };

  const miniCalendarDays = generateMiniCalendarDays();

  // Debug: Log appointment dates to help identify the issue
  useEffect(() => {
    console.log('=== APPOINTMENT DEBUG ===');
    console.log('All appointments:', appointments.map(app => ({
      date: app.date,
      patientName: app.patientName,
      status: app.status
    })));
    
    // Check specifically for August appointments
    const augustAppointments = appointments.filter(app => app.date.startsWith('2025-08'));
    console.log('August appointments:', augustAppointments.map(app => ({
      date: app.date,
      day: app.date.split('-')[2],
      patientName: app.patientName,
      status: app.status
    })));
    
    // Check specifically for July appointments (for July 27th)
    const julyAppointments = appointments.filter(app => app.date.startsWith('2025-07'));
    console.log('July appointments:', julyAppointments.map(app => ({
      date: app.date,
      day: app.date.split('-')[2],
      patientName: app.patientName,
      status: app.status
    })));
    
    // Show filtered events that main calendar uses
    console.log('Filtered events for main calendar:', events.map(event => ({
      date: event.start.split('T')[0],
      patientName: event.extendedProps.patientName,
      status: event.extendedProps.status
    })));
    
    // Show current filter status
    console.log('Current filter status:', filters.status);
  }, [appointments, events, filters.status]);

  return (
    <div className="flex gap-0 h-full">
      {/* Left Sidebar */}
      <div 
        className="space-y-6 bg-gray-50 dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-700"
        style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '500px' }}
      >
        {/* Request New Appointment Button */}
        {/* <Card>
          <CardContent className="p-4">
            <Button 
              onClick={onNewAppointment}
              className="w-full bg-blue-600 hover:bg-blue-700"

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
              <Plus className="w-4 h-4 mr-2" />
              Request New Appointment
            </Button>
          </CardContent>
        </Card> */}

        {/* Mini Calendar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {miniCalendarDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardTitle>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {miniCalendarDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleMiniCalendarDateClick(day.date)}
                  className={`
                    h-8 w-8 rounded-full text-xs font-medium transition-colors
                    ${!day.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                    ${day.isToday ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                    ${day.hasAppointments ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''}
                  `}
                >
                  {day.date.getDate()}
                </button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="w-full mt-3"
            >
              Today
            </Button>
          </CardContent>
        </Card>

        {/* Filtering Options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filtering Options
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Status Filters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Status</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectAllStatus(true)}
                  className="text-xs h-6 px-2"
                >
                  All
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(filters.status).map(([status, checked]) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={checked}
                      onCheckedChange={(checked) => 
                        handleStatusFilterChange(status, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`status-${status}`}
                      className="text-sm font-medium cursor-pointer capitalize"
                    >
                      {status}
                    </label>
                    <Badge 
                      variant="secondary" 
                      className="ml-auto text-xs"
                    >
                      {appointments.filter(app => app.status === status).length}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>



          </CardContent>
        </Card>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors relative"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-4 flex items-center justify-center">
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 relative h-full">
                                             <FullCalendar
               ref={calendarRef}
               plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
               initialView="dayGridMonth"
               initialDate={currentDate}
               weekends={true}
               events={events}
               eventClick={handleEventClick}
               eventMouseEnter={handleEventMouseEnter}
               eventMouseLeave={handleEventMouseLeave}
               headerToolbar={{
                 left: "prev,next today",
                 center: "title",
                 right: "dayGridMonth,timeGridWeek,timeGridDay",
               }}
               editable={true}
               eventDrop={handleEventDrop}
               height="100%"
            eventContent={(arg) => {
              const { patientName, specialty, status, time } =
                arg.event.extendedProps;
              const statusClass = getEventClasses(status);

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

          {/* Hover Tooltip */}
          {tooltip.visible && tooltip.content && (
            <div
              className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs pointer-events-none"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translateX(-50%) translateY(-100%)',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Appointment Details
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    tooltip.content.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    tooltip.content.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    tooltip.content.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                    tooltip.content.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {tooltip.content.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Patient:</span>
                    <span className="text-gray-900 dark:text-white">{tooltip.content.patientName}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Specialty:</span>
                    <span className="text-gray-900 dark:text-white">{tooltip.content.specialty}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Time:</span>
                    <span className="text-gray-900 dark:text-white">{tooltip.content.time}</span>
                  </div>
                </div>
              </div>
              
              {/* Tooltip arrow */}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-900"
                style={{ marginTop: '-1px' }}
              />
            </div>
          )}
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
