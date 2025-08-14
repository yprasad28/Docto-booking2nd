// Follow-up Reminder Service
// Handles scheduling, notifications, and reminder management

export interface FollowUpReminder {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  followUpDate: string;
  diagnosis: string;
  status: 'upcoming' | 'overdue' | 'completed';
  reminderSent: boolean;
  reminderDate?: string;
  reminderSettings: ReminderSettings;
}

export interface ReminderSettings {
  enabled: boolean;
  reminderDays: number[]; // Days before follow-up to send reminders
  showPopup: boolean;
  showToast: boolean;
  emailReminders: boolean;
  smsReminders: boolean;
  browserNotifications: boolean;
}

export interface ReminderNotification {
  id: string;
  reminderId: string;
  type: 'popup' | 'toast' | 'email' | 'sms' | 'browser';
  message: string;
  scheduledFor: string;
  sent: boolean;
  sentAt?: string;
}

class ReminderService {
  private reminders: FollowUpReminder[] = [];
  private notifications: ReminderNotification[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    // Ensure this only runs in the browser
    if (typeof window === 'undefined') {
      return;
    }

    // Request notification permission
    if (typeof Notification !== 'undefined') {
      Notification.requestPermission();
    }

    // Start checking for reminders
    this.startReminderCheck();
  }

  public startReminderCheck() {
    // Check every 15 minutes
    this.checkInterval = setInterval(() => {
      this.checkForDueReminders();
    }, 15 * 60 * 1000);

    // Also check immediately
    this.checkForDueReminders();
  }

  public stopReminderCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public async addFollowUpReminder(reminder: Omit<FollowUpReminder, 'id' | 'reminderSent'>): Promise<string> {
    const id = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newReminder: FollowUpReminder = {
      ...reminder,
      id,
      reminderSent: false
    };

    this.reminders.push(newReminder);
    
    // Schedule notifications
    this.scheduleNotifications(newReminder);
    
    return id;
  }

  public async getPatientReminders(patientId: string): Promise<FollowUpReminder[]> {
    return this.reminders.filter(r => r.patientId === patientId);
  }

  public async updateReminderStatus(reminderId: string, status: FollowUpReminder['status']): Promise<void> {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.status = status;
      if (status === 'completed') {
        reminder.reminderSent = true;
      }
    }
  }

  public async markReminderAsSent(reminderId: string): Promise<void> {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.reminderSent = true;
      reminder.reminderDate = new Date().toISOString();
    }
  }

  public async snoozeReminder(reminderId: string, hours: number): Promise<void> {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      const newDate = new Date(Date.now() + hours * 60 * 60 * 1000);
      reminder.followUpDate = newDate.toISOString();
      reminder.reminderSent = false;
      
      // Reschedule notifications
      this.scheduleNotifications(reminder);
    }
  }

  private scheduleNotifications(reminder: FollowUpReminder) {
    if (!reminder.reminderSettings.enabled) return;

    const followUpDate = new Date(reminder.followUpDate);
    const now = new Date();

    reminder.reminderSettings.reminderDays.forEach(daysBefore => {
      const reminderDate = new Date(followUpDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
      
      if (reminderDate > now) {
        // Schedule notification
        const notification: ReminderNotification = {
          id: `notif_${reminder.id}_${daysBefore}`,
          reminderId: reminder.id,
          type: 'popup',
          message: `Follow-up reminder: You have an appointment with ${reminder.doctorName} in ${daysBefore} days.`,
          scheduledFor: reminderDate.toISOString(),
          sent: false
        };

        this.notifications.push(notification);
        
        // Set timeout for this notification
        const delay = reminderDate.getTime() - now.getTime();
        setTimeout(() => {
          this.triggerNotification(notification);
        }, delay);
      }
    });
  }

  private async checkForDueReminders() {
    const now = new Date();
    const dueReminders = this.reminders.filter(reminder => {
      if (reminder.reminderSent || reminder.status === 'completed') return false;
      
      const followUpDate = new Date(reminder.followUpDate);
      const daysUntilFollowUp = Math.ceil((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return reminder.reminderSettings.reminderDays.includes(daysUntilFollowUp);
    });

    dueReminders.forEach(reminder => {
      this.triggerReminder(reminder);
    });
  }

  private async triggerNotification(notification: ReminderNotification) {
    if (notification.sent) return;

    // Mark as sent
    notification.sent = true;
    notification.sentAt = new Date().toISOString();

    // Trigger the reminder
    const reminder = this.reminders.find(r => r.id === notification.reminderId);
    if (reminder) {
      this.triggerReminder(reminder);
    }
  }

  private async triggerReminder(reminder: FollowUpReminder) {
    // Mark reminder as sent
    await this.markReminderAsSent(reminder.id);

    // Show browser notification if enabled and permitted
    if (
      typeof window !== 'undefined' &&
      reminder.reminderSettings.browserNotifications &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      new Notification('Follow-up Reminder', {
        body: `You have a follow-up appointment with ${reminder.doctorName} on ${new Date(reminder.followUpDate).toLocaleDateString()}`,
        icon: '/favicon.ico',
        tag: reminder.id
      });
    }

    // Emit custom event for UI components to listen to
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      const event = new CustomEvent('followUpReminder', {
        detail: reminder
      });
      window.dispatchEvent(event);
    }
  }

  public async updateReminderSettings(reminderId: string, settings: Partial<ReminderSettings>): Promise<void> {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder) {
      reminder.reminderSettings = { ...reminder.reminderSettings, ...settings };
      
      // Reschedule notifications if settings changed
      if (settings.reminderDays || settings.enabled) {
        this.scheduleNotifications(reminder);
      }
    }
  }

  public async deleteReminder(reminderId: string): Promise<void> {
    this.reminders = this.reminders.filter(r => r.id !== reminderId);
    this.notifications = this.notifications.filter(n => n.reminderId !== reminderId);
  }

  public getReminderStats(patientId: string) {
    const patientReminders = this.reminders.filter(r => r.patientId === patientId);
    
    return {
      total: patientReminders.length,
      upcoming: patientReminders.filter(r => r.status === 'upcoming').length,
      overdue: patientReminders.filter(r => r.status === 'overdue').length,
      completed: patientReminders.filter(r => r.status === 'completed').length
    };
  }
}

// Create singleton instance
export const reminderService = new ReminderService();
