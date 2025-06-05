import { isToday, isTomorrow, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { VIEW_MODES } from '../constants/reminderConstants';

export const filterReminders = (reminders, partnerReminders, viewMode) => {
  if (!reminders) return [];
  
  if (viewMode === VIEW_MODES.MY_REMINDERS) {
    return reminders;
  } else if (viewMode === VIEW_MODES.PARTNER_REMINDERS) {
    return partnerReminders || [];
  }
  return [];
};

export const canModifyReminder = (reminder, userId) => {
  return reminder.owner === userId;
};

export const groupRemindersByDate = (reminders) => {
  const today = [];
  const tomorrow = [];
  const thisWeek = [];
  const thisMonth = [];
  const later = [];

  reminders.forEach(reminder => {
    const date = parseISO(reminder.date);
    if (isToday(date)) {
      today.push(reminder);
    } else if (isTomorrow(date)) {
      tomorrow.push(reminder);
    } else if (isThisWeek(date)) {
      thisWeek.push(reminder);
    } else if (isThisMonth(date)) {
      thisMonth.push(reminder);
    } else {
      later.push(reminder);
    }
  });

  return { today, tomorrow, thisWeek, thisMonth, later };
}; 