// @ts-check

import { MissingParamError } from "../common/error.js";
import { fetchStats } from "./stats.js";
import { request } from "../common/http.js";
import { retryer } from "../common/retryer.js";

/**
 * Fetch user profile data for followers count
 * @param {string} username - GitHub username
 * @param {string} token - GitHub token
 * @returns {Promise<import('axios').AxiosResponse>} User profile response
 */
const fetchUserProfile = (username, token) => {
  return request(
    {
      query: `
        query userInfo($login: String!) {
          user(login: $login) {
            followers {
              totalCount
            }
            repositories {
              totalCount
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
 * Fetch trophy data for a user
 * @param {string} username - GitHub username
 * @param {boolean} include_all_commits - Include all commits
 * @param {string[]} exclude_repo - Repositories to exclude
 * @returns {Promise<object>} Trophy data
 */
const fetchTrophy = async (username, include_all_commits = false, exclude_repo = []) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  // Fetch stats data
  const statsData = await fetchStats(
    username,
    include_all_commits,
    exclude_repo,
    false, // include_merged_pull_requests
    false, // include_discussions
    false, // include_discussions_answers
    undefined, // commits_year
  );

  // Fetch user profile for followers and repo count
  let followers = 0;
  let totalRepos = 0;

  try {
    const profileRes = await retryer(fetchUserProfile, { login: username });
    if (profileRes.data?.data?.user) {
      followers = profileRes.data.data.user.followers?.totalCount || 0;
      totalRepos = profileRes.data.data.user.repositories?.totalCount || 0;
    }
  } catch (err) {
    // If profile fetch fails, continue with stats data only
    console.warn("Failed to fetch user profile:", err);
  }

  return {
    totalStars: statsData.totalStars || 0,
    totalCommits: statsData.totalCommits || 0,
    totalPRs: statsData.totalPRs || 0,
    totalIssues: statsData.totalIssues || 0,
    followers,
    totalRepos,
  };
};

export { fetchTrophy };
