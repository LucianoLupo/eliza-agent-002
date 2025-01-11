// src/utils/index.ts

import { NewsArticle } from "../types";

/**
 * Format news articles into a readable text response
 */
export function formatNewsResponse(articles: NewsArticle[]): string {
  return articles
    .map(
      (article, index) => `${index + 1}. ${article.title}
${article.description || ""}
Source: ${article.source.name} | ${new Date(
        article.publishedAt
      ).toLocaleDateString()}
${article.url}\n`
    )
    .join("\n");
}

/**
 * Extract country code from message text
 */
export function extractCountryCode(text: string): string | null {
  const countryMap = {
    "united states": "us",
    usa: "us",
    uk: "gb",
    "united kingdom": "gb",
    "great britain": "gb",
    australia: "au",
    canada: "ca",
    india: "in",
    germany: "de",
    france: "fr",
    italy: "it",
    japan: "jp",
    china: "cn",
    brazil: "br",
    mexico: "mx",
    spain: "es",
    russia: "ru",
    // Add more country mappings as needed
  } as const;

  const lowercaseText = text.toLowerCase();

  // Check for direct matches first
  for (const [country, code] of Object.entries(countryMap)) {
    if (lowercaseText.includes(country)) {
      return code;
    }
  }

  // Regular expression to match country codes if directly mentioned
  const codeMatch = lowercaseText.match(/\b([a-z]{2})\b/);
  if (
    codeMatch &&
    Object.values(countryMap).includes(
      codeMatch[1] as (typeof countryMap)[keyof typeof countryMap]
    )
  ) {
    return codeMatch[1];
  }

  return null;
}

/**
 * Format date to locale string
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Truncate text to a certain length
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
