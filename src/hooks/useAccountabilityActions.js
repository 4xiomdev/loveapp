import { useState } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { calculateWeeklyCompletions } from '../utils/accountabilityHelpers';

export const useAccountabilityActions = (user, tasks, dailyStatus, setError, setShowStarEarned) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteTask = async (taskId, isComplete) => {
    if (!user) {
      setError("You must be logged in to complete tasks");
      return;
    }

    try {
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if a status for today already exists
      const statusQuery = query(
        collection(db, "dailyStatus"),
        where("habitId", "==", taskId),
        where("owner", "==", user.uid),
        where("date", "==", today)
      );
      
      const statusSnapshot = await getDocs(statusQuery);
      
      // Create a batch to update multiple documents atomically
      const batch = writeBatch(db);
      
      if (statusSnapshot.empty) {
        // No status for today exists, create a new one
        const newStatusRef = doc(collection(db, "dailyStatus"));
        batch.set(newStatusRef, {
          habitId: taskId,
          owner: user.uid,
          date: today,
          done: isComplete,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing status
        const statusDoc = statusSnapshot.docs[0];
        batch.update(doc(db, "dailyStatus", statusDoc.id), {
          done: isComplete,
          updatedAt: serverTimestamp()
        });
      }
      
      // Update the task's isTodayComplete field
      const taskRef = doc(db, "accountability", taskId);
      batch.update(taskRef, {
        isTodayComplete: isComplete,
        updatedAt: serverTimestamp()
      });
      
      // Commit the batch
      await batch.commit();
      
      // Check if completing this task meets the weekly goal
      const task = tasks.find(t => t.id === taskId);
      if (task && isComplete) {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
        const taskStatuses = dailyStatus[taskId] || [];
        
        // Calculate weekly completions including the one we just added
        const weeklyCompletions = calculateWeeklyCompletions(
          weekStart, 
          weekEnd, 
          [...taskStatuses, { date: today, done: true }],
          false
        );
        
        const weeklyGoal = task.weeklyGoal || 7;
        
        // If weekly goal is met exactly, show star earned notification
        if (weeklyCompletions === weeklyGoal) {
          setShowStarEarned(true);
          setTimeout(() => setShowStarEarned(false), 5000);
        }
      }
    } catch (error) {
      console.error("Error completing task:", error);
      setError("Failed to update task status");
    }
  };

  const handleCreateTask = async (e, formData) => {
    e.preventDefault();
    if (!user?.uid || !formData.title.trim()) return;

    try {
      setIsSubmitting(true);
      
      // Ensure weeklyGoal is a valid number
      const weeklyGoalValue = parseInt(formData.weeklyGoal) || 7;
      
      const taskRef = collection(db, "accountability");
      await addDoc(taskRef, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        weeklyGoal: weeklyGoalValue,
        owner: user.uid,
        isTodayComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setIsSubmitting(false);
      return true; // Success
    } catch (error) {
      console.error("Error creating task:", error);
      setError("Failed to create task");
      setIsSubmitting(false);
      return false; // Failure
    }
  };

  const handleUpdateTask = async (e, editingTask, formData) => {
    e.preventDefault();
    if (!user?.uid || !editingTask || !formData.title.trim()) return;

    try {
      setIsSubmitting(true);
      const taskRef = doc(db, "accountability", editingTask.id);
      
      // Ensure weeklyGoal is a number and has a valid value
      const weeklyGoalValue = parseInt(formData.weeklyGoal) || 7;
      
      await updateDoc(taskRef, {
        title: formData.title,
        description: formData.description,
        weeklyGoal: weeklyGoalValue,
        updatedAt: serverTimestamp()
      });

      setIsSubmitting(false);
      return true; // Success
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task");
      setIsSubmitting(false);
      return false; // Failure
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!user?.uid) return;

    try {
      const taskRef = doc(db, 'accountability', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task");
    }
  };

  const handleToggleComplete = async (task) => {
    if (!user?.uid || !task) return;

    try {
      const taskRef = doc(db, 'accountability', task.id);
      await updateDoc(taskRef, {
        completed: !task.completed,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling task:", error);
      setError("Failed to toggle task");
    }
  };

  return {
    handleCompleteTask,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleToggleComplete,
    isSubmitting
  };
}; 