// @ts-check

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { kFormatter } from "../common/fmt.js";
import { icons } from "../common/icons.js";
import { flexLayout, measureText } from "../common/render.js";

/**
 * Trophy thresholds for different categories
 */
const TROPHY_THRESHOLDS = {
  stars: { bronze: 16, silver: 128, gold: 512 },
  commits: { bronze: 100, silver: 1000, gold: 10000 },
  prs: { bronze: 10, silver: 50, gold: 100 },
  issues: { bronze: 10, silver: 50, gold: 100 },
  followers: { bronze: 10, silver: 50, gold: 100 },
  repos: { bronze: 5, silver: 20, gold: 50 },
};

/**
 * Get trophy level based on value and thresholds
 * @param {number} value - The value to check
 * @param {object} thresholds - The thresholds object
 * @returns {string|null} - Trophy level or null
 */
const getTrophyLevel = (value, thresholds) => {
  if (value >= thresholds.gold) return "gold";
  if (value >= thresholds.silver) return "silver";
  if (value >= thresholds.bronze) return "bronze";
  return null;
};

/**
 * Trophy level colors and labels
 */
const trophyLevels = {
  gold: { color: "#FFD700", label: "🥇" },
  silver: { color: "#C0C0C0", label: "🥈" },
  bronze: { color: "#CD7F32", label: "🥉" },
};

/**
 * Trophy category icons and labels
 */
const trophyCategories = {
  stars: { icon: icons.star, label: "Stars" },
  commits: { icon: icons.commits, label: "Commits" },
  prs: { icon: icons.prs, label: "PRs" },
  issues: { icon: icons.issues, label: "Issues" },
  followers: { icon: icons.contribs, label: "Followers" },
  repos: { icon: icons.icon, label: "Repos" },
};

/**
 * Create a compact trophy badge
 * @param {string} category - Trophy category key
 * @param {string} level - Trophy level (gold/silver/bronze)
 * @param {number} value - Trophy value
 * @param {string} textColor - Text color
 * @param {string} iconColor - Icon color
 * @returns {string} Trophy badge SVG
 */
const createTrophyBadge = (category, level, value, textColor, iconColor) => {
  const categoryInfo = trophyCategories[category];
  const levelInfo = trophyLevels[level];
  const formattedValue = kFormatter(value);

  const iconSvg = `
    <svg class="trophy-icon" viewBox="0 0 16 16" width="14" height="14">
      ${categoryInfo.icon}
    </svg>
  `;

  const trophyEmoji = levelInfo.label;
  const levelText = level.charAt(0).toUpperCase() + level.slice(1);

  return flexLayout({
    items: [
      iconSvg,
      `<text class="trophy-category" fill="${textColor}">${categoryInfo.label}</text>`,
      `<text class="trophy-value" fill="${levelInfo.color}">${formattedValue}</text>`,
      `<text class="trophy-level" fill="${levelInfo.color}">${trophyEmoji}</text>`,
    ],
    sizes: [
      14,
      measureText(categoryInfo.label, 11),
      measureText(formattedValue, 11),
      measureText(trophyEmoji, 11),
    ],
    gap: 8,
  }).join("");
};

/**
 * Render trophy card
 * @param {object} stats - User stats
 * @param {object} options - Card options
 * @returns {string} Trophy card SVG
 */
const renderTrophyCard = (stats, options = {}) => {
  const {
    totalStars = 0,
    totalCommits = 0,
    totalPRs = 0,
    totalIssues = 0,
    followers = 0,
    totalRepos = 0,
  } = stats;

  const {
    hide = [],
    hide_title = false,
    hide_border = false,
    card_width,
    title_color,
    text_color,
    icon_color,
    bg_color,
    theme = "default",
    custom_title,
    border_radius,
    border_color,
    column = 3,
    margin_w = 10,
    margin_h = 10,
  } = options;

  const { titleColor, textColor, iconColor: defaultIconColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    icon_color,
    bg_color,
    border_color,
    theme,
  });

  // Calculate trophies
  const trophies = [];

  if (!hide.includes("stars")) {
    const level = getTrophyLevel(totalStars, TROPHY_THRESHOLDS.stars);
    if (level) {
      trophies.push({ category: "stars", level, value: totalStars });
    }
  }

  if (!hide.includes("commits")) {
    const level = getTrophyLevel(totalCommits, TROPHY_THRESHOLDS.commits);
    if (level) {
      trophies.push({ category: "commits", level, value: totalCommits });
    }
  }

  if (!hide.includes("prs")) {
    const level = getTrophyLevel(totalPRs, TROPHY_THRESHOLDS.prs);
    if (level) {
      trophies.push({ category: "prs", level, value: totalPRs });
    }
  }

  if (!hide.includes("issues")) {
    const level = getTrophyLevel(totalIssues, TROPHY_THRESHOLDS.issues);
    if (level) {
      trophies.push({ category: "issues", level, value: totalIssues });
    }
  }

  if (!hide.includes("followers")) {
    const level = getTrophyLevel(followers, TROPHY_THRESHOLDS.followers);
    if (level) {
      trophies.push({ category: "followers", level, value: followers });
    }
  }

  if (!hide.includes("repos")) {
    const level = getTrophyLevel(totalRepos, TROPHY_THRESHOLDS.repos);
    if (level) {
      trophies.push({ category: "repos", level, value: totalRepos });
    }
  }

  // If no trophies, show a message
  if (trophies.length === 0) {
    const card = new Card({
      defaultTitle: custom_title || "GitHub Trophies",
      width: 400,
      height: hide_title ? 120 : 170,
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
      .trophy-message { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; }
    `);

    const yPos = hide_title ? 60 : 100;
    return card.render(`
      <text x="200" y="${yPos}" text-anchor="middle" class="trophy-message">
        Keep coding to earn trophies! 🏆
      </text>
    `);
  }

  // Calculate card dimensions for grid layout
  const itemsPerRow = column ? parseInt(column, 10) : 3;
  const marginW = margin_w ? parseInt(margin_w, 10) : 10;
  const marginH = margin_h ? parseInt(margin_h, 10) : 10;
  const rowCount = Math.ceil(trophies.length / itemsPerRow);
  
  // Estimate badge width (icon + text + value + emoji + gaps)
  const badgeWidth = 120;
  const badgeHeight = 25;
  
  const cardWidth = card_width || itemsPerRow * badgeWidth + (itemsPerRow + 1) * marginW;
  const cardHeight = rowCount * badgeHeight + (rowCount + 1) * marginH + (hide_title ? 0 : 50);

  const card = new Card({
    defaultTitle: custom_title || "GitHub Trophies",
    width: cardWidth,
    height: cardHeight,
    border_radius,
    colors: {
      titleColor,
      textColor,
      iconColor: defaultIconColor,
      bgColor,
      borderColor,
    },
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(`
    .trophy-icon { fill: ${defaultIconColor}; }
    .trophy-category { font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif; }
    .trophy-value { font: 600 11px 'Segoe UI', Ubuntu, Sans-Serif; }
    .trophy-level { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; }
  `);

  // Create trophy badges in grid layout
  const trophyBadges = trophies.map((trophy, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const x = marginW + col * (badgeWidth + marginW);
    const y = (hide_title ? marginH : 50) + row * (badgeHeight + marginH);

    const badge = createTrophyBadge(
      trophy.category,
      trophy.level,
      trophy.value,
      textColor,
      defaultIconColor,
    );

    return `
      <g transform="translate(${x}, ${y})">
        ${badge}
      </g>
    `;
  });

  return card.render(`
    <svg x="0" y="0">
      ${trophyBadges.join("")}
    </svg>
  `);
};

export { renderTrophyCard };
