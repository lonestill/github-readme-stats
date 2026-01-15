// @ts-check

import { renderStatsCard } from "../src/cards/stats.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderTrophyCard } from "../src/cards/trophy.js";
import { renderStreakCard } from "../src/cards/streak.js";
import { guardAccess } from "../src/common/access.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
} from "../src/common/cache.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import { parseArray, parseBoolean } from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchStats } from "../src/fetchers/stats.js";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";
import { fetchTrophy } from "../src/fetchers/trophy.js";
import { fetchStreak } from "../src/fetchers/streak.js";

// @ts-ignore
export default async (req, res) => {
  const {
    username,
    cards,
    theme = "tokyonight",
    hide_border = "true",
  } = req.query;

  res.setHeader("Content-Type", "application/json");

  // Suppress url.parse() deprecation warnings from dependencies
  if (typeof process !== "undefined" && process.env) {
    process.removeAllListeners("warning");
    process.on("warning", (warning) => {
      if (warning.name === "DeprecationWarning" && warning.message.includes("url.parse()")) {
        return;
      }
      console.warn(warning);
    });
  }

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const requestedCards = cards ? cards.split(",") : ["stats", "top-langs", "trophy"];
  const baseUrl = req.headers.host ? `https://${req.headers.host}` : "https://github-readme-stats-lonestill.vercel.app";
  
  const results = {};

  try {
    // Fetch all data in parallel
    const [statsData, topLangsData, trophyData, streakData] = await Promise.all([
      requestedCards.includes("stats") || requestedCards.includes("trophy") 
        ? fetchStats(username, false, [], false, false, false, undefined).catch(() => null)
        : Promise.resolve(null),
      requestedCards.includes("top-langs")
        ? fetchTopLanguages(username, [], 1, 0).catch(() => null)
        : Promise.resolve(null),
      requestedCards.includes("trophy")
        ? fetchTrophy(username, false, []).catch(() => null)
        : Promise.resolve(null),
      requestedCards.includes("streak")
        ? fetchStreak(username).catch(() => null)
        : Promise.resolve(null),
    ]);

    // Generate URLs for each card
    if (requestedCards.includes("stats") && statsData) {
      results.stats = {
        url: `${baseUrl}/api?username=${username}&theme=${theme}&hide_border=${hide_border}`,
        markdown: `[![GitHub Stats](${baseUrl}/api?username=${username}&theme=${theme}&hide_border=${hide_border})](https://github.com/${username})`,
      };
    }

    if (requestedCards.includes("top-langs") && topLangsData) {
      results["top-langs"] = {
        url: `${baseUrl}/api/top-langs?username=${username}&theme=${theme}&hide_border=${hide_border}&layout=compact`,
        markdown: `[![Top Langs](${baseUrl}/api/top-langs?username=${username}&theme=${theme}&hide_border=${hide_border}&layout=compact)](https://github.com/${username})`,
      };
    }

    if (requestedCards.includes("trophy") && trophyData) {
      results.trophy = {
        url: `${baseUrl}/api/trophy?username=${username}&theme=${theme}&hide_border=${hide_border}&column=7`,
        markdown: `[![Trophies](${baseUrl}/api/trophy?username=${username}&theme=${theme}&hide_border=${hide_border}&column=7)](https://github.com/${username})`,
      };
    }

    if (requestedCards.includes("streak") && streakData) {
      results.streak = {
        url: `${baseUrl}/api/streak?username=${username}&theme=${theme}&hide_border=${hide_border}`,
        markdown: `[![GitHub Streak](${baseUrl}/api/streak?username=${username}&theme=${theme}&hide_border=${hide_border})](https://github.com/${username})`,
      };
    }

    // Generate full README template
    if (Object.keys(results).length > 0) {
      const markdownCards = Object.values(results).map(r => r.markdown).join("\n\n");
      results.fullReadme = `# ${username}

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/USER_ID?v=4" width="150" style="border-radius: 50%;" alt="Avatar"/>
  
  <h1>${username}</h1>
  
  <p><i>Your bio here</i></p>
</div>

---

## 📊 GitHub Stats

<div align="center">
  
${markdownCards}
  
</div>

---

<div align="center">
  <img src="https://komarev.com/ghpvc/?username=${username}&label=Profile%20Views&color=0ea5e9&style=flat-square" alt="Profile Views" />
</div>`;
    }

    const cacheSeconds = resolveCacheSeconds({
      requested: parseInt(req.query.cache_seconds, 10),
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.json(results);
  } catch (err) {
    setErrorCacheHeaders(res);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "An unknown error occurred",
    });
  }
};
