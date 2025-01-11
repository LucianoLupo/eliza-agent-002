// src/types/index.ts

import type { IAgentRuntime, Service, ServiceType } from "@elizaos/core";
import { z } from "zod";

// Schema and Type for News Article
export const NewsArticleSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  url: z.string().url(),
  publishedAt: z.string(),
  source: z.object({
    name: z.string(),
  }),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

// Schema and Type for Search Parameters
export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  pageSize: z.number().optional(),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

// Schema and Type for News Search Result
export const NewsSearchResultSchema = z.object({
  status: z.string(),
  totalResults: z.number(),
  articles: z.array(NewsArticleSchema),
});

export type NewsSearchResult = z.infer<typeof NewsSearchResultSchema>;

// News Service Interface
export interface INewsService extends Service {
  // Add required Service properties
  serviceType: ServiceType;

  /**
   * Initialize the news service
   * @param runtime The agent runtime
   */
  initialize(runtime: IAgentRuntime): Promise<void>;

  /**
   * Search for news articles
   * @param params Search parameters including query, language, etc.
   * @returns Promise resolving to an array of news articles
   */
  searchNews(params: SearchParams): Promise<NewsArticle[]>;

  /**
   * Get top headlines
   * @param params Search parameters including country, category, etc.
   * @returns Promise resolving to an array of news articles
   */
  getTopHeadlines(params: SearchParams): Promise<NewsArticle[]>;

  /**
   * Clear the news cache
   */
  clearCache(): Promise<void>;

  /**
   * Get service instance
   */
  getInstance(): INewsService;
}
