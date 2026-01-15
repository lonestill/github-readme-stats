// @ts-check

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
import { parseBoolean } from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchStreak } from "../src/fetchers/streak.js";

// @ts-ignore
export default async (req, res) => {
  const {
    username,
    hide_title,
    hide_border,
    card_width,
    title_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    custom_title,
    border_radius,
    border_color,
  } = req.query;

  res.setHeader("Content-Type", "image/svg+xml");

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

  const access = guardAccess({
    res,
    id: username,
    type: "username",
    colors: {
      title_color,
      text_color,
      bg_color,
      border_color,
      theme,
    },
  });
  if (!access.isPassed) {
    return access.result;
  }

  try {
    const streakData = await fetchStreak(username);

    const cacheSeconds = resolveCacheSeconds({
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderStreakCard(streakData, {
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        title_color,
        text_color,
        bg_color,
        theme,
        custom_title,
        border_radius: parseFloat(border_radius),
        border_color,
      }),
    );
  } catch (err) {
    setErrorCacheHeaders(res);
    if (err instanceof Error) {
      return res.send(
        renderError({
          message: err.message,
          secondaryMessage: retrieveSecondaryMessage(err),
          renderOptions: {
            title_color,
            text_color,
            bg_color,
            border_color,
            theme: theme || "default",
            show_repo_link: !(err instanceof MissingParamError),
          },
        }),
      );
    }
    return res.send(
      renderError({
        message: "An unknown error occurred",
        renderOptions: {
          title_color,
          text_color,
          bg_color,
          border_color,
          theme: theme || "default",
        },
      }),
    );
  }
};
