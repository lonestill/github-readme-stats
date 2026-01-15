// @ts-check

import { MissingParamError } from "../common/error.js";
import { request } from "../common/http.js";
import { retryer } from "../common/retryer.js";

/**
 * Fetch contribution calendar data
 * @param {string} username - GitHub username
 * @param {string} token - GitHub token
 * @returns {Promise<import('axios').AxiosResponse>} Contribution calendar response
 */
const fetchContributions = (username, token) => {
  return request(
    {
      query: `
        query userInfo($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `,
      variables: { login: username },
    },
    {
      Authorization: `token ${token}`,
    },
  );
};

/**
 * Calculate streak from contribution calendar
 * @param {object} calendar - Contribution calendar data
 * @returns {object} Streak data
 */
const calculateStreak = (calendar) => {
  const weeks = calendar.weeks || [];
  const allDays = [];
  
  weeks.forEach(week => {
    week.contributionDays.forEach(day => {
      allDays.push({
        date: day.date,
        count: day.contributionCount,
      });
    });
  });

  // Sort by date (oldest first for easier processing)
  allDays.sort((a, b) => new Date(a.date) - new Date(b.date));

  let currentStreak = 0;
  let currentStreakStart = null;
  let longestStreak = 0;
  let longestStreakStart = null;
  let longestStreakEnd = null;
  let tempStreak = 0;
  let tempStreakStart = null;

  // Calculate streaks
  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];
    const hasContributions = day.count > 0;

    if (hasContributions) {
      if (tempStreak === 0) {
        tempStreakStart = day.date;
      }
      tempStreak++;
      
      // Update longest streak if current is longer
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakStart = tempStreakStart;
        longestStreakEnd = day.date;
      }
    } else {
      tempStreak = 0;
      tempStreakStart = null;
    }
  }

  // Calculate current streak (from today backwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find today or most recent day
  let todayIndex = -1;
  for (let i = allDays.length - 1; i >= 0; i--) {
    const dayDate = new Date(allDays[i].date);
    dayDate.setHours(0, 0, 0, 0);
    if (dayDate <= today) {
      todayIndex = i;
      break;
    }
  }

  if (todayIndex >= 0) {
    // Count backwards from today
    for (let i = todayIndex; i >= 0; i--) {
      const day = allDays[i];
      if (day.count > 0) {
        currentStreak++;
        if (!currentStreakStart) {
          currentStreakStart = day.date;
        }
      } else {
        break; // Streak broken
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalContributions: calendar.totalContributions || 0,
    currentStreakStartDate: currentStreakStart,
    longestStreakStartDate: longestStreakStart,
    longestStreakEndDate: longestStreakEnd,
  };
};

/**
 * Fetch streak data for a user
 * @param {string} username - GitHub username
 * @returns {Promise<object>} Streak data
 */
const fetchStreak = async (username) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  try {
    const res = await retryer(fetchContributions, { login: username });
    
    if (res.data.errors) {
      throw new Error(res.data.errors[0].message || "Failed to fetch streak data");
    }

    const calendar = res.data.data.user.contributionsCollection.contributionCalendar;
    return calculateStreak(calendar);
  } catch (err) {
    // Return default values on error
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
      currentStreakStartDate: null,
      longestStreakStartDate: null,
      longestStreakEndDate: null,
    };
  }
};

export { fetchStreak };
