import {
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  differenceInDays,
  subDays,
  isAfter,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subMonths
} from 'date-fns';

export const calculateStreak = (dailyStatus, isTodayComplete) => {
  if (!dailyStatus || !dailyStatus.length) return { currentStreak: 0, longestStreak: 0 };
  
  // Sort by date in descending order (newest first)
  const sortedStatuses = [...dailyStatus].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Start with today's status
  let currentStreak = isTodayComplete ? 1 : 0;
  
  // If today is not complete, check if yesterday was
  if (!isTodayComplete) {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const yesterdayStatus = sortedStatuses.find(s => s.date === yesterday);
    if (!yesterdayStatus?.done) {
      return { currentStreak: 0, longestStreak: calculateLongestStreak(sortedStatuses) };
    }
    currentStreak = 1; // Start streak from yesterday
  }
  
  // Check previous days
  const today = new Date();
  let currentDate = subDays(today, currentStreak); // Start from the day before the last counted day
  
  for (let i = 0; i < sortedStatuses.length; i++) {
    const statusDate = new Date(sortedStatuses[i].date);
    const expectedDate = format(currentDate, 'yyyy-MM-dd');
    
    // If this status is for the expected date and it's done
    if (sortedStatuses[i].date === expectedDate && sortedStatuses[i].done) {
      currentStreak++;
      currentDate = subDays(currentDate, 1);
    } 
    // If this status is for the expected date but not done, break
    else if (sortedStatuses[i].date === expectedDate && !sortedStatuses[i].done) {
      break;
    }
    // If we've moved past the expected date (gap in data), break
    else if (isAfter(statusDate, currentDate)) {
      continue; // Skip this status and check the next one
    } else {
      break; // Break on any other condition (like a gap in the streak)
    }
  }
  
  const longestStreak = calculateLongestStreak(sortedStatuses);
  return { currentStreak, longestStreak };
};

export const calculateLongestStreak = (sortedStatuses) => {
  if (!sortedStatuses || !sortedStatuses.length) return 0;
  
  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate = null;
  
  // Process statuses in chronological order for longest streak
  const chronologicalStatuses = [...sortedStatuses].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  for (const status of chronologicalStatuses) {
    if (status.done) {
      if (!lastDate || differenceInDays(new Date(status.date), new Date(lastDate)) === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      lastDate = status.date;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
      lastDate = status.date;
    }
  }
  
  return longestStreak;
};

export const calculateCompletionRate = (dailyStatus, isTodayComplete) => {
  if (!dailyStatus || !dailyStatus.length) return 0;
  
  // Get statuses from the last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentStatuses = dailyStatus.filter(status => 
    new Date(status.date) >= thirtyDaysAgo
  );
  
  // If no recent data, use all available data
  const statusesToUse = recentStatuses.length > 0 ? recentStatuses : dailyStatus;
  
  // Add today's status if it exists
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayInStatuses = statusesToUse.some(s => s.date === today);
  
  let totalDays = statusesToUse.length;
  let completedDays = statusesToUse.filter(s => s.done).length;
  
  // Include today if not in statuses
  if (!todayInStatuses) {
    totalDays += 1;
    if (isTodayComplete) completedDays += 1;
  }
  
  return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
};

export const calculateBestDays = (dailyStatuses) => {
  if (!dailyStatuses || !dailyStatuses.length) return [];
  
  const dayCount = {};
  
  dailyStatuses.forEach(status => {
    if (status.done) {
      const dayOfWeek = format(new Date(status.date), 'EEEE');
      dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    }
  });
  
  return Object.entries(dayCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([day, count]) => ({ day, count }));
};

export const calculateMonthlyTrend = (dailyStatuses) => {
  if (!dailyStatuses || !dailyStatuses.length) return 0;
  
  const currentMonth = startOfMonth(new Date());
  const lastMonth = startOfMonth(subMonths(new Date(), 1));
  
  const currentMonthStatuses = dailyStatuses.filter(s => {
    const statusDate = new Date(s.date);
    return statusDate >= currentMonth && s.done;
  });
  
  const lastMonthStatuses = dailyStatuses.filter(s => {
    const statusDate = new Date(s.date);
    return statusDate >= lastMonth && statusDate < currentMonth && s.done;
  });
  
  const currentMonthDays = eachDayOfInterval({
    start: currentMonth,
    end: new Date()
  }).length;
  
  const lastMonthDays = eachDayOfInterval({
    start: lastMonth,
    end: endOfMonth(lastMonth)
  }).length;
  
  const currentRate = currentMonthDays > 0 ? (currentMonthStatuses.length / currentMonthDays) * 100 : 0;
  const lastRate = lastMonthDays > 0 ? (lastMonthStatuses.length / lastMonthDays) * 100 : 0;
  
  return currentRate - lastRate;
};

export const calculateWeeklyCompletions = (weekStart, weekEnd, statuses, includePending = false) => {
  // Ensure statuses is an array
  if (!Array.isArray(statuses)) {
    console.warn('calculateWeeklyCompletions received non-array statuses:', statuses);
    return 0;
  }
  
  // Parse dates consistently at midnight
  const start = startOfWeek(new Date(weekStart), { weekStartsOn: 0 });
  start.setHours(0, 0, 0, 0);
  const end = endOfWeek(new Date(weekEnd), { weekStartsOn: 0 });
  end.setHours(23, 59, 59, 999);

  const completions = statuses.filter(status => {
    const statusDate = new Date(status.date + 'T00:00:00');
    const isInWeek = isWithinInterval(statusDate, { start, end });
    return status.done && isInWeek;
  }).length;

  return completions;
}; 