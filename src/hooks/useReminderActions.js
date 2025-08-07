import { serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const useReminderActions = (user, userData, setError) => {
  const handleCreateReminder = async (e, formData) => {
    e.preventDefault();
    if (!user?.uid || !formData.title.trim()) return;

    try {
      const fn = httpsCallable(getFunctions(), 'createReminder');
      await fn({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date.toISOString(),
      });

      return true; // Success
    } catch (error) {
      console.error("Error creating reminder:", error);
      setError("Failed to create reminder");
      return false; // Failure
    }
  };

  const handleUpdateReminder = async (e, editingReminder, formData) => {
    e.preventDefault();
    if (!user?.uid || !editingReminder || !formData.title.trim()) return;

    try {
      const fn = httpsCallable(getFunctions(), 'updateReminder');
      await fn({
        id: editingReminder.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date.toISOString(),
      });

      return true; // Success
    } catch (error) {
      console.error("Error updating reminder:", error);
      setError("Failed to update reminder");
      return false; // Failure
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!user?.uid) return;

    try {
      const fn = httpsCallable(getFunctions(), 'deleteReminder');
      await fn({ id: reminderId });
    } catch (error) {
      console.error("Error deleting reminder:", error);
      setError("Failed to delete reminder");
    }
  };

  const handleToggleComplete = async (reminder) => {
    if (!user?.uid || !reminder) return;

    try {
      const fn = httpsCallable(getFunctions(), 'toggleReminder');
      await fn({ reminderId: reminder.id, completed: !reminder.completed });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      setError("Failed to toggle reminder");
    }
  };

  return {
    handleCreateReminder,
    handleUpdateReminder,
    handleDeleteReminder,
    handleToggleComplete
  };
}; 