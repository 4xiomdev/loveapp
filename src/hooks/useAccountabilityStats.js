import { useState, useEffect, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  subDays,
  format
} from 'date-fns';
import { calculateStreak } from '../utils/accountabilityHelpers';

export const useWeeklyStats = (tasks) => {
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const [weeklyCompletions, setWeeklyCompletions] = useState(0);

  useEffect(() => {
    if (!tasks?.length) {
      setWeeklyProgress(0);
      setWeeklyCompletions(0);
      return;
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    // Calculate completions and goals per task
    const taskStats = tasks.map(task => {
      const weeklyCompletions = task.dailyStatuses?.filter(s => {
        const statusDate = new Date(s.date + 'T00:00:00');
        return s.done && isWithinInterval(statusDate, {
          start: weekStart,
          end: weekEnd
        });
      }).length || 0;

      return {
        completions: weeklyCompletions,
        goal: task.weeklyGoal || 7
      };
    });

    // Sum up all completions and goals
    const totalCompletions = taskStats.reduce((acc, stat) => acc + stat.completions, 0);
    const totalGoal = taskStats.reduce((acc, stat) => acc + stat.goal, 0);

    // Calculate overall progress
    const progress = totalGoal > 0 
      ? Math.min(Math.round((totalCompletions / totalGoal) * 100), 100)
      : 0;

    setWeeklyCompletions(totalCompletions);
    setWeeklyProgress(progress);
  }, [tasks]);

  return { weeklyProgress, weeklyCompletions };
};

export const useCompletionHistory = (tasks) => {
  return useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = subDays(new Date(), i);
      const completions = tasks.reduce((acc, task) => {
        const isDone = task.dailyStatuses?.some(s => 
          s.done && s.date === format(date, 'yyyy-MM-dd')
        );
        return acc + (isDone ? 1 : 0);
      }, 0);

      return {
        name: format(date, 'EEE'),
        completions
      };
    }).reverse();

    return last7Days;
  }, [tasks]);
};

export const useHabitProgress = (tasks) => {
  return useMemo(() => {
    return tasks.map(task => {
      const completions = task.dailyStatuses?.filter(s => s.done).length || 0;
      const total = task.dailyStatuses?.length || 1;
      const streak = calculateStreak(task.dailyStatuses, task.isTodayComplete);

      return {
        id: task.id,
        title: task.title,
        completionRate: Math.round((completions / total) * 100),
        streak: streak.currentStreak
      };
    });
  }, [tasks]);
};

export const useOptimisticUpdate = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const update = async (newValue, updateFn) => {
    setIsUpdating(true);
    setError(null);
    // Optimistically update the UI
    setValue(newValue);
    
    try {
      await updateFn();
    } catch (err) {
      // Revert on error
      setValue(initialValue);
      setError(err.message || 'Failed to update');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return [value, update, isUpdating, error];
}; 