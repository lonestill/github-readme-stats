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

  // Sort by date (newest first)
  allDays.sort((a, b) => new Date(b.date) - new Date(a.date));

  let currentStreak = 0;
  let currentStreakStart = null;
  let longestStreak = 0;
  let longestStreakStart = null;
  let longestStreakEnd = null;
  let tempStreak = 0;
  let tempStreakStart = null;

  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];
    const hasContributions = day.count > 0;

    if (hasContributions) {
      if (tempStreak === 0) {
        tempStreakStart = day.date;
      }
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakStart = tempStreakStart;
        longestStreakEnd = i > 0 ? allDays[i - 1].date : day.date;
      }
      tempStreak = 0;
      tempStreakStart = null;
    }

    // Current streak (from today backwards)
    if (i === 0 && hasContributions) {
      currentStreak = 1;
      currentStreakStart = day.date;
    } else if (i > 0 && hasContributions && currentStreak > 0) {
      const prevDate = new Date(allDays[i - 1].date);
      const currDate = new Date(day.date);
      const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        if (!currentStreakStart) {
          currentStreakStart = day.date;
        }
      } else {
        currentStreak = 0;
        currentStreakStart = null;
      }
    }
  }

  // Check if temp streak is longer
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
    longestStreakStart = tempStreakStart;
    longestStreakEnd = allDays[0]?.date || null;
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
