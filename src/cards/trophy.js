// @ts-check

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { flexLayout } from "../common/render.js";

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
 * Trophy SVG icons for different levels
 */
const trophyIcons = {
  gold: `<path d="M8 0L9.5 5.5L15 4L11 8L12.5 13.5L8 11L3.5 13.5L5 8L1 4L6.5 5.5L8 0Z" fill="#FFD700" stroke="#FFA500" stroke-width="0.5"/>`,
  silver: `<path d="M8 0L9.5 5.5L15 4L11 8L12.5 13.5L8 11L3.5 13.5L5 8L1 4L6.5 5.5L8 0Z" fill="#C0C0C0" stroke="#808080" stroke-width="0.5"/>`,
  bronze: `<path d="M8 0L9.5 5.5L15 4L11 8L12.5 13.5L8 11L3.5 13.5L5 8L1 4L6.5 5.5L8 0Z" fill="#CD7F32" stroke="#8B4513" stroke-width="0.5"/>`,
};

/**
 * Trophy labels
 */
const trophyLabels = {
  stars: "⭐ Stars",
  commits: "💾 Commits",
  prs: "🔀 Pull Requests",
  issues: "🐛 Issues",
  followers: "👥 Followers",
  repos: "📦 Repositories",
};

/**
 * Create a trophy item SVG
 * @param {string} label - Trophy label
 * @param {string} level - Trophy level (gold/silver/bronze)
 * @param {number} value - Trophy value
 * @param {number} index - Item index
 * @returns {string} Trophy item SVG
 */
const createTrophyItem = (label, level, value, index) => {
  const trophyIcon = trophyIcons[level] || "";
  const levelColor = {
    gold: "#FFD700",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
  }[level] || "#808080";

  const staggerDelay = index * 100;

  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
      <svg x="0" y="-8" width="20" height="20" viewBox="0 0 16 16">
        ${trophyIcon}
      </svg>
      <text class="trophy-label" x="30" y="5">${label}:</text>
      <text class="trophy-value" x="180" y="5" fill="${levelColor}">${value}</text>
      <text class="trophy-level" x="220" y="5" fill="${levelColor}">(${level})</text>
    </g>
  `;
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
    bg_color,
    theme = "default",
    custom_title,
    border_radius,
    border_color,
    column = 7,
    margin_w = 15,
    margin_h = 15,
    rank = "SSS,SS,S,AAA,AA,A,B,C",
  } = options;

  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  // Calculate trophies
  const trophies = [];

  if (!hide.includes("stars")) {
    const level = getTrophyLevel(totalStars, TROPHY_THRESHOLDS.stars);
    if (level) {
      trophies.push({
        label: trophyLabels.stars,
        level,
        value: totalStars,
        key: "stars",
      });
    }
  }

  if (!hide.includes("commits")) {
    const level = getTrophyLevel(totalCommits, TROPHY_THRESHOLDS.commits);
    if (level) {
      trophies.push({
        label: trophyLabels.commits,
        level,
        value: totalCommits,
        key: "commits",
      });
    }
  }

  if (!hide.includes("prs")) {
    const level = getTrophyLevel(totalPRs, TROPHY_THRESHOLDS.prs);
    if (level) {
      trophies.push({
        label: trophyLabels.prs,
        level,
        value: totalPRs,
        key: "prs",
      });
    }
  }

  if (!hide.includes("issues")) {
    const level = getTrophyLevel(totalIssues, TROPHY_THRESHOLDS.issues);
    if (level) {
      trophies.push({
        label: trophyLabels.issues,
        level,
        value: totalIssues,
        key: "issues",
      });
    }
  }

  if (!hide.includes("followers")) {
    const level = getTrophyLevel(followers, TROPHY_THRESHOLDS.followers);
    if (level) {
      trophies.push({
        label: trophyLabels.followers,
        level,
        value: followers,
        key: "followers",
      });
    }
  }

  if (!hide.includes("repos")) {
    const level = getTrophyLevel(totalRepos, TROPHY_THRESHOLDS.repos);
    if (level) {
      trophies.push({
        label: trophyLabels.repos,
        level,
        value: totalRepos,
        key: "repos",
      });
    }
  }

  // If no trophies, show a message
  if (trophies.length === 0) {
    const card = new Card({
      defaultTitle: custom_title || "GitHub Trophies",
      width: 400,
      height: hide_title ? 150 : 200,
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
      .trophy-message { font: 400 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; }
    `);

    const yPos = hide_title ? 75 : 100;
    return card.render(`
      <text x="200" y="${yPos}" text-anchor="middle" class="trophy-message">
        Keep coding to earn trophies! 🏆
      </text>
    `);
  }

  // Calculate card dimensions
  const itemsPerRow = column ? parseInt(column, 10) : 7;
  const marginW = margin_w ? parseInt(margin_w, 10) : 15;
  const marginH = margin_h ? parseInt(margin_h, 10) : 15;
  const rowCount = Math.ceil(trophies.length / itemsPerRow);
  const itemWidth = 100;
  const itemHeight = 50;
  const cardWidth = card_width || itemsPerRow * (itemWidth + marginW) + marginW;
  const cardHeight = rowCount * (itemHeight + marginH) + marginH + (hide_title ? 0 : 50);

  const card = new Card({
    defaultTitle: custom_title || "GitHub Trophies",
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
    .trophy-label { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; }
    .trophy-value { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; }
    .trophy-level { font: 400 10px 'Segoe UI', Ubuntu, Sans-Serif; }
    .stagger {
      opacity: 0;
      animation: fadeIn 0.3s ease-in-out forwards;
    }
    @keyframes fadeIn {
      to { opacity: 1; }
    }
  `);

  // Create trophy items
  const trophyItems = trophies.map((trophy, index) => {
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const x = marginW + col * (itemWidth + marginW);
    const y = (hide_title ? marginH : 50) + row * (itemHeight + marginH);

    return `
      <g transform="translate(${x}, ${y})">
        ${createTrophyItem(trophy.label, trophy.level, trophy.value, index)}
      </g>
    `;
  });

  return card.render(`
    <svg x="0" y="0">
      ${trophyItems.join("")}
    </svg>
  `);
};

export { renderTrophyCard };
