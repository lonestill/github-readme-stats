// @ts-check

import { MissingParamError } from "../common/error.js";
import { request } from "../common/http.js";
import { retryer } from "../common/retryer.js";

/**
 * Fetch activity graph data
 * @param {string} username - GitHub username
 * @param {number} year - Year to fetch (optional)
 * @returns {Promise<object>} Activity graph data
 */
const fetchActivityGraph = async (username, year = null) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  const startDate = year ? `${year}-01-01T00:00:00Z` : null;
  const endDate = year ? `${year}-12-31T23:59:59Z` : null;

  const query = `
    query userInfo($login: String!, $from: DateTime, $to: DateTime) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
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
  `;

  try {
    const res = await retryer(
      (variables, token) => {
        return request(
          {
            query,
            variables: {
              login: variables.login,
              from: startDate,
              to: endDate,
            },
          },
          {
            Authorization: `token ${token}`,
          },
        );
      },
      { login: username },
    );

    if (res.data.errors) {
      throw new Error(res.data.errors[0].message || "Failed to fetch activity data");
    }

    const calendar = res.data.data.user.contributionsCollection.contributionCalendar;
    
    return {
      weeks: calendar.weeks || [],
      totalContributions: calendar.totalContributions || 0,
    };
  } catch (err) {
    // Return default values on error
    return {
      weeks: [],
      totalContributions: 0,
    };
  }
};

export { fetchActivityGraph };
