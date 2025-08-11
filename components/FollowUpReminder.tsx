"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { reminderService, type FollowUpReminder, type ReminderSettings } from "@/lib/reminder-service";
import { 
  Bell, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Settings,
  Mail,
  MessageSquare
} from "lucide-react";

interface FollowUpReminderProps {
  patientId: string;
}

export function FollowUpReminder({ patientId }: FollowUpReminderProps) {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [showReminder, setShowReminder] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<FollowUpReminder | null>(null);


  useEffect(() => {
    loadFollowUpReminders();
    
    // Listen for reminder events from the service
    const handleReminderEvent = (event: CustomEvent<FollowUpReminder>) => {
      const reminder = event.detail;
      if (reminder.patientId === patientId) {
        showReminderNotification(reminder);
      }
    };
    
    window.addEventListener('followUpReminder', handleReminderEvent as EventListener);
    
    return () => {
      window.removeEventListener('followUpReminder', handleReminderEvent as EventListener);
    };
  }, [patientId]);

  const loadFollowUpReminders = async () => {
    try {
      // Load reminders from the service
      const patientReminders = await reminderService.getPatientReminders(patientId);
      
      if (patientReminders.length === 0) {
        // Add some sample reminders for demonstration
        await reminderService.addFollowUpReminder({
          patientId,
          patientName: "John Doe",
          doctorName: "Dr. Sarah Johnson",
          followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          diagnosis: "Hypertension",
          status: 'upcoming',
          reminderSettings: {
            enabled: true,
            reminderDays: [1, 3, 7],
            showPopup: true,
            showToast: true,
            emailReminders: false,
            smsReminders: false,
            browserNotifications: true
          }
        });
        
        await reminderService.addFollowUpReminder({
          patientId,
          patientName: "John Doe",
          doctorName: "Dr. Michael Chen",
          followUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          diagnosis: "Dermatitis",
          status: 'overdue',
          reminderSettings: {
            enabled: true,
            reminderDays: [1, 3, 7],
            showPopup: true,
            showToast: true,
            emailReminders: false,
            smsReminders: false,
            browserNotifications: true
          }
        });
        
        // Reload reminders
        const updatedReminders = await reminderService.getPatientReminders(patientId);
        setReminders(updatedReminders);
      } else {
        setReminders(patientReminders);
      }
    } catch (error) {
      console.error("Error loading follow-up reminders:", error);
    }
  };

  const showReminderNotification = (reminder: FollowUpReminder) => {
    // Show popup notification
    setCurrentReminder(reminder);
    setShowReminder(true);

    // Show toast notification
    toast({
      title: "Follow-up Reminder",
      description: `You have a follow-up appointment with ${reminder.doctorName} in ${getDaysUntilFollowUp(reminder.followUpDate)} days.`,
      action: (
        <Button variant="outline" size="sm" onClick={() => setShowReminder(true)}>
          View Details
        </Button>
      ),
    });
  };

  const getDaysUntilFollowUp = (followUpDate: string): number => {
    const now = new Date();
    const followUp = new Date(followUpDate);
    return Math.ceil((followUp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Upcoming</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Overdue</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const markAsCompleted = async (reminderId: string) => {
    try {
      await reminderService.updateReminderStatus(reminderId, 'completed');
      
      // Update local state
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, status: 'completed' as const } : r
      ));
      
      toast({
        title: "Follow-up Completed",
        description: "Follow-up appointment marked as completed.",
      });
    } catch (error) {
      console.error("Error marking reminder as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark follow-up as completed.",
        variant: "destructive",
      });
    }
  };

  const dismissReminder = () => {
    setShowReminder(false);
    setCurrentReminder(null);
  };

  const snoozeReminder = async (reminderId: string, hours: number) => {
    try {
      await reminderService.snoozeReminder(reminderId, hours);
      
      // Update local state
      setReminders(prev => prev.map(r => 
        r.id === reminderId 
          ? { ...r, followUpDate: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(), reminderSent: false }
          : r
      ));
      
      setShowReminder(false);
      setCurrentReminder(null);
      
      toast({
        title: "Reminder Snoozed",
        description: `Reminder will show again in ${hours} hours.`,
      });
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to snooze reminder.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Follow-up Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Follow-up Reminders
            {reminders.filter(r => r.status === 'upcoming' || r.status === 'overdue').length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {reminders.filter(r => r.status === 'upcoming' || r.status === 'overdue').length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No follow-up appointments scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(reminder.status)}
                    <div>
                      <h4 className="font-medium">{reminder.doctorName}</h4>
                      <p className="text-sm text-gray-600">{reminder.diagnosis}</p>
                      <p className="text-sm text-gray-500">
                        Follow-up: {new Date(reminder.followUpDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(reminder.status)}
                    
                    {reminder.status === 'upcoming' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsCompleted(reminder.id)}
                        >
                          Mark Complete
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showReminderNotification(reminder)}
                        >
                          Test Reminder
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Test Reminder Button */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (reminders.length > 0) {
                  const upcomingReminder = reminders.find(r => r.status === 'upcoming');
                  if (upcomingReminder) {
                    showReminderNotification(upcomingReminder);
                  }
                }
              }}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Test Reminder Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Popup Dialog */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Follow-up Reminder
            </DialogTitle>
            <DialogDescription>
              You have an upcoming follow-up appointment
            </DialogDescription>
          </DialogHeader>
          
          {currentReminder && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2">Appointment Details</h4>
                <p><strong>Doctor:</strong> {currentReminder.doctorName}</p>
                <p><strong>Date:</strong> {new Date(currentReminder.followUpDate).toLocaleDateString()}</p>
                <p><strong>Diagnosis:</strong> {currentReminder.diagnosis}</p>
                <p><strong>Days Until:</strong> {getDaysUntilFollowUp(currentReminder.followUpDate)} days</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => markAsCompleted(currentReminder.id)}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => snoozeReminder(currentReminder.id, 24)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Remind Later
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={dismissReminder}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
