# Follow-up Reminder System

## Overview
The Follow-up Reminder System is a comprehensive feature that helps patients remember their upcoming medical follow-up appointments. It provides multiple notification channels and smart timing to ensure patients don't miss important healthcare appointments.

## Features

### 🚨 Smart Reminders
- **Automatic Timing**: Sends reminders 1, 3, and 7 days before follow-up dates
- **Status Tracking**: Monitors upcoming, overdue, and completed follow-ups
- **Smart Scheduling**: Automatically schedules notifications based on follow-up dates

### 🔔 Multiple Notification Types
- **Popup Dialogs**: In-app modal notifications with appointment details
- **Toast Messages**: Non-intrusive toast notifications with action buttons
- **Browser Notifications**: Native browser notifications (with permission)
- **Email/SMS**: Ready for future integration with external services

### ⚙️ Flexible Settings
- **Customizable Timing**: Configurable reminder days (1, 3, 7 days before)
- **Notification Preferences**: Enable/disable different notification types
- **Patient Control**: Patients can snooze, dismiss, or mark reminders as completed

### 📱 User Experience
- **Interactive Reminders**: Click to view full appointment details
- **Quick Actions**: Mark complete, snooze, or dismiss with one click
- **Visual Indicators**: Status badges and icons for easy identification
- **Test Mode**: Built-in testing functionality for demonstration

## Technical Implementation

### Architecture
```
FollowUpReminder Component
├── UI Layer (React + Radix UI)
├── State Management (useState, useEffect)
├── Event Handling (Custom Events)
└── Reminder Service (Singleton Pattern)
```

### Core Components

#### 1. FollowUpReminder.tsx
- Main UI component for displaying and managing reminders
- Handles user interactions and state updates
- Integrates with the reminder service

#### 2. reminder-service.ts
- Core business logic for reminder management
- Handles scheduling, notifications, and persistence
- Uses custom events for component communication

### Key Features

#### Automatic Reminder Checking
```typescript
// Checks for due reminders every 15 minutes
setInterval(() => {
  this.checkForDueReminders();
}, 15 * 60 * 1000);
```

#### Smart Notification Scheduling
```typescript
// Schedules notifications based on reminder days
reminderSettings.reminderDays.forEach(daysBefore => {
  const reminderDate = new Date(followUpDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
  // Schedule notification if future date
});
```

#### Event-Driven Communication
```typescript
// Emits custom events for UI components
const event = new CustomEvent('followUpReminder', {
  detail: reminder
});
window.dispatchEvent(event);
```

## Usage

### For Patients
1. **View Reminders**: Navigate to "My Reports & Reminders" page
2. **Receive Notifications**: Automatic popups and toasts for upcoming appointments
3. **Manage Reminders**: Mark complete, snooze, or dismiss as needed
4. **Test System**: Use "Test Reminder Notification" button to see how it works

### For Developers
1. **Integration**: Import `FollowUpReminder` component
2. **Service Usage**: Use `reminderService` for programmatic access
3. **Customization**: Modify reminder settings and timing
4. **Extension**: Add new notification channels (email, SMS, push)

## Configuration

### Reminder Settings
```typescript
interface ReminderSettings {
  enabled: boolean;                    // Master toggle
  reminderDays: number[];             // [1, 3, 7] days before
  showPopup: boolean;                 // In-app popup notifications
  showToast: boolean;                 // Toast notifications
  emailReminders: boolean;            // Email notifications (future)
  smsReminders: boolean;              // SMS notifications (future)
  browserNotifications: boolean;      // Browser native notifications
}
```

### Default Configuration
- **Reminder Days**: 1, 3, and 7 days before follow-up
- **Check Interval**: Every 15 minutes
- **Notifications**: Popup + Toast + Browser (if permitted)

## Data Structure

### FollowUpReminder
```typescript
interface FollowUpReminder {
  id: string;                         // Unique identifier
  patientId: string;                  // Patient reference
  patientName: string;                // Patient display name
  doctorName: string;                 // Doctor name
  followUpDate: string;               // ISO date string
  diagnosis: string;                  // Medical condition
  status: 'upcoming' | 'overdue' | 'completed';
  reminderSent: boolean;              // Notification sent flag
  reminderDate?: string;              // When reminder was sent
  reminderSettings: ReminderSettings; // Configuration
}
```

## Future Enhancements

### Planned Features
- **Email Integration**: Send reminder emails to patients
- **SMS Notifications**: Text message reminders
- **Push Notifications**: Mobile app push notifications
- **Calendar Integration**: Add to Google/Outlook calendars
- **Doctor Dashboard**: Manage patient reminders from doctor side
- **Analytics**: Track reminder effectiveness and patient compliance

### Technical Improvements
- **Database Persistence**: Store reminders in database
- **Real-time Updates**: WebSocket for live notifications
- **Offline Support**: Service worker for offline reminders
- **Internationalization**: Multi-language support
- **Accessibility**: Screen reader and keyboard navigation

## Security & Privacy

### Data Protection
- **Patient Isolation**: Reminders only visible to respective patients
- **Secure Storage**: No sensitive data in localStorage
- **Permission-based**: Browser notifications require user consent

### Compliance
- **HIPAA Ready**: Designed with healthcare privacy in mind
- **Audit Trail**: Track all reminder interactions
- **Data Minimization**: Only store necessary reminder information

## Testing

### Manual Testing
1. Navigate to "My Reports & Reminders"
2. Use "Test Reminder Notification" button
3. Verify popup dialog appears
4. Test different reminder actions (complete, snooze, dismiss)

### Automated Testing
```typescript
// Example test structure
describe('FollowUpReminder', () => {
  it('should show reminder notification', () => {
    // Test notification display
  });
  
  it('should handle reminder actions', () => {
    // Test complete, snooze, dismiss
  });
});
```

## Troubleshooting

### Common Issues
1. **Notifications Not Showing**: Check browser permissions
2. **Reminders Not Loading**: Verify patient ID is correct
3. **Service Not Working**: Check console for errors

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('reminderDebug', 'true');
```

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Navigate to reminder components

### Code Style
- Use TypeScript for type safety
- Follow React hooks best practices
- Implement proper error handling
- Add comprehensive JSDoc comments

## License
This feature is part of the Docto-booking application and follows the same licensing terms.

---

**Note**: This reminder system is designed to improve patient care and appointment adherence. Always ensure compliance with local healthcare regulations and patient privacy laws.
