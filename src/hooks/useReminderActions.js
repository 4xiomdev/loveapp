import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export const useReminderActions = (user, userData, setError) => {
  const handleCreateReminder = async (e, formData) => {
    e.preventDefault();
    if (!user?.uid || !formData.title.trim()) return;

    try {
      const remindersRef = collection(db, 'reminders');
      await addDoc(remindersRef, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date.toISOString(),
        owner: user.uid,
        participants: [user.uid, userData?.partnerId].filter(Boolean),
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
      const reminderRef = doc(db, 'reminders', editingReminder.id);
      await updateDoc(reminderRef, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date.toISOString(),
        updatedAt: serverTimestamp()
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
      const reminderRef = doc(db, 'reminders', reminderId);
      await deleteDoc(reminderRef);
    } catch (error) {
      console.error("Error deleting reminder:", error);
      setError("Failed to delete reminder");
    }
  };

  const handleToggleComplete = async (reminder) => {
    if (!user?.uid || !reminder) return;

    try {
      const reminderRef = doc(db, 'reminders', reminder.id);
      await updateDoc(reminderRef, {
        completed: !reminder.completed,
        updatedAt: serverTimestamp()
      });
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