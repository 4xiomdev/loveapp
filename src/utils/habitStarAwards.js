import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp
} from "firebase/firestore";
import { startOfDay, endOfDay } from 'date-fns';

/**
 * Checks and awards a star if the user has met their weekly goal for a habit.
 * Awards instantly when the goal is met, checking only if a star was already awarded today.
 * 
 * @param {string} habitId - The ID of the habit/accountability task
 * @param {string} userId - The user's ID who completed the task
 * @param {string} partnerId - The partner's ID (for transaction participants)
 * @param {number} weeklyGoal - The weekly goal for this habit
 * @param {string} habitTitle - The title of the habit
 * @param {Array} dailyStatus - Array of daily status objects
 * @returns {Promise<boolean>} - Returns true if a star was awarded
 */
export const awardWeeklyStarIfEligible = async (
  habitId,
  userId,
  partnerId,
  weeklyGoal,
  habitTitle,
  dailyStatus
) => {
  try {
    // Calculate total completions
    const completions = dailyStatus.filter(status => status.done).length;

    // Only proceed if we've met or exceeded the goal
    if (completions >= weeklyGoal) {
      const today = new Date();
      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);

      // Check if we already awarded a star today
      const existingTransactionQuery = query(
        collection(db, "transactions"),
        where("habitId", "==", habitId),
        where("to", "==", userId),
        where("type", "==", "HABIT_COMPLETION"),
        where("createdAt", ">=", Timestamp.fromDate(dayStart)),
        where("createdAt", "<=", Timestamp.fromDate(dayEnd))
      );
      
      const existingTransaction = await getDocs(existingTransactionQuery);
      
      // Only award if no star was awarded today
      if (existingTransaction.empty) {
        const batch = writeBatch(db);
        
        // Create the transaction document
        const transactionRef = doc(collection(db, "transactions"));
        batch.set(transactionRef, {
          type: 'HABIT_COMPLETION',
          from: 'SYSTEM',
          to: userId,
          owner: userId,
          participants: [userId, partnerId],
          amount: 1,
          reason: `Completed goal (${weeklyGoal} completions) for habit: ${habitTitle}`,
          category: 'habit_completion',
          createdAt: serverTimestamp(),
          status: 'approved',
          habitId,
          completedCount: completions
        });

        // Update the user's star balance
        const userRef = doc(db, "users", userId);
        batch.update(userRef, {
          stars: increment(1),
          lastStarAwardedAt: serverTimestamp()
        });

        await batch.commit();
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error awarding habit completion star:", error);
    return false;
  }
}; 