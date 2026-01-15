// @ts-check

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";

/**
 * Render activity graph card
 * @param {object} activityData - Activity data
 * @param {object} options - Card options
 * @returns {string} Activity graph card SVG
 */
const renderActivityGraphCard = (activityData, options = {}) => {
  const {
    weeks = [],
    totalContributions = 0,
  } = activityData;

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
    year = null,
  } = options;

  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  // Get last 53 weeks (1 year)
  const displayWeeks = weeks.slice(-53);
  const cellSize = 10;
  const cellGap = 3;
  const weekWidth = cellSize + cellGap;
  const graphWidth = displayWeeks.length * weekWidth;
  const graphHeight = 7 * weekWidth; // 7 days
  const cardWidth = card_width || Math.max(400, graphWidth + 100);
  const cardHeight = graphHeight + (hide_title ? 80 : 130);

  const card = new Card({
    defaultTitle: custom_title || `GitHub Activity${year ? ` ${year}` : ""}`,
    width: cardWidth,
    height: cardHeight,
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
    .activity-label { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; }
    .activity-total { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${titleColor}; }
  `);

  // Calculate max contributions for color intensity
  let maxContributions = 0;
  displayWeeks.forEach(week => {
    week.contributionDays.forEach(day => {
      if (day.contributionCount > maxContributions) {
        maxContributions = day.contributionCount;
      }
    });
  });

  const getIntensity = (count) => {
    if (count === 0) return 0;
    if (maxContributions === 0) return 0;
    return Math.min(1, count / maxContributions);
  };

  const getColor = (intensity) => {
    if (intensity === 0) return "#161b22";
    const colors = [
      "#0e4429", // Level 1
      "#006d32", // Level 2
      "#26a641", // Level 3
      "#39d353", // Level 4
    ];
    const level = Math.min(3, Math.floor(intensity * 4));
    return colors[level];
  };

  const yStart = hide_title ? 30 : 60;
  const xStart = 50;

  // Render graph - ensure we have 7 days per week
  const cells = displayWeeks.map((week, weekIndex) => {
    const days = week.contributionDays || [];
    // Pad to 7 days if needed
    while (days.length < 7) {
      days.push({ date: "", contributionCount: 0 });
    }
    
    return days.slice(0, 7).map((day, dayIndex) => {
      const x = xStart + weekIndex * weekWidth;
      const y = yStart + dayIndex * weekWidth;
      const intensity = getIntensity(day.contributionCount || 0);
      const color = getColor(intensity);
      
      return `<rect 
        x="${x}" 
        y="${y}" 
        width="${cellSize}" 
        height="${cellSize}" 
        fill="${color}" 
        rx="2"
        data-count="${day.contributionCount || 0}"
        data-date="${day.date || ""}"/>`;
    }).join("");
  }).join("");

  // Day labels
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayLabelElements = dayLabels.map((label, index) => {
    if (index % 2 === 0) {
      return `<text class="activity-label" x="10" y="${yStart + index * weekWidth + 8}">${label}</text>`;
    }
    return "";
  }).join("");

  return card.render(`
    <svg x="0" y="0">
      ${dayLabelElements}
      ${cells}
      <text class="activity-total" x="${xStart}" y="${yStart + graphHeight + 25}">
        Total: ${totalContributions.toLocaleString()} contributions
      </text>
    </svg>
  `);
};

export { renderActivityGraphCard };
