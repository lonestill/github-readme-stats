// @ts-check

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { kFormatter } from "../common/fmt.js";
import { icons } from "../common/icons.js";

/**
 * Render streak card
 * @param {object} streakData - Streak data
 * @param {object} options - Card options
 * @returns {string} Streak card SVG
 */
const renderStreakCard = (streakData, options = {}) => {
  const {
    currentStreak = 0,
    longestStreak = 0,
    totalContributions = 0,
    currentStreakStartDate = null,
    longestStreakStartDate = null,
    longestStreakEndDate = null,
  } = streakData;

  const {
    hide_title = false,
    hide_border = false,
    card_width,
    title_color,
    text_color,
    bg_color,
    theme = "default",
    custom_title,
    border_radius,
    border_color,
  } = options;

  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  const card = new Card({
    defaultTitle: custom_title || "GitHub Streak",
    width: card_width || 400,
    height: hide_title ? 180 : 230,
    border_radius,
    colors: {
      titleColor,
      textColor,
      bgColor,
      borderColor,
    },
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(`
    .streak-label { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; }
    .streak-value { font: 700 20px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${titleColor}; }
    .streak-detail { font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; }
    .icon { fill: ${titleColor}; }
  `);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const yStart = hide_title ? 20 : 50;

  return card.render(`
    <svg x="0" y="0">
      <g transform="translate(25, ${yStart})">
        <svg class="icon" viewBox="0 0 16 16" width="20" height="20" y="-5">
          ${icons.commits}
        </svg>
        <text class="streak-label" x="30" y="8">Current Streak:</text>
        <text class="streak-value" x="30" y="30" fill="#FF6B6B">${currentStreak} days</text>
        ${currentStreakStartDate ? `<text class="streak-detail" x="30" y="45">Since ${formatDate(currentStreakStartDate)}</text>` : ""}
      </g>
      
      <g transform="translate(25, ${yStart + 70})">
        <svg class="icon" viewBox="0 0 16 16" width="20" height="20" y="-5">
          ${icons.star}
        </svg>
        <text class="streak-label" x="30" y="8">Longest Streak:</text>
        <text class="streak-value" x="30" y="30" fill="#4ECDC4">${longestStreak} days</text>
        ${longestStreakStartDate && longestStreakEndDate ? 
          `<text class="streak-detail" x="30" y="45">${formatDate(longestStreakStartDate)} - ${formatDate(longestStreakEndDate)}</text>` : ""}
      </g>
      
      <g transform="translate(25, ${yStart + 140})">
        <svg class="icon" viewBox="0 0 16 16" width="20" height="20" y="-5">
          ${icons.contribs}
        </svg>
        <text class="streak-label" x="30" y="8">Total Contributions:</text>
        <text class="streak-value" x="30" y="30">${kFormatter(totalContributions)}</text>
      </g>
    </svg>
  `);
};

export { renderStreakCard };
