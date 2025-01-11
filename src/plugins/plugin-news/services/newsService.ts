import {
  IAgentRuntime,
  Service,
  ServiceType,
  elizaLogger,
} from "@elizaos/core";
import {
  NewsArticle,
  SearchParams,
  NewsSearchResult,
  INewsService,
} from "../types.ts";
import { validateNewsConfig } from "../environment.ts";

export class NewsService extends Service implements INewsService {
  private static _instance: NewsService;

  get serviceType(): ServiceType {
    return ServiceType.TEXT_GENERATION;
  }

  private API_BASE_URL = "https://newsapi.org/v2";
  private runtime: IAgentRuntime | null = null;
  private cacheKey = "content/news";
  private cacheTTL = 5 * 60; // 5 minutes cache by default

  constructor() {
    super();
  }

  getInstance(): NewsService {
    if (!NewsService._instance) {
      NewsService._instance = new NewsService();
    }
    return NewsService._instance;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    elizaLogger.info("Initializing NewsService");

    try {
      // Validate configuration
      await validateNewsConfig(runtime);

      this.runtime = runtime;

      // Set cache TTL from config if provided
      const configTTL = runtime.getSetting("NEWS_CACHE_TTL");
      if (configTTL) {
        this.cacheTTL = parseInt(configTTL);
      }

      // Set base URL from config if provided
      const configBaseUrl = runtime.getSetting("NEWS_BASE_URL");
      if (configBaseUrl) {
        this.API_BASE_URL = configBaseUrl;
      }

      elizaLogger.success("NewsService initialized successfully");
    } catch (error) {
      elizaLogger.error("Failed to initialize NewsService:", error);
      throw error;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number>
  ): Promise<T> {
    if (!this.runtime) {
      throw new Error("NewsService not initialized");
    }

    const apiKey = this.runtime.getSetting("NEWS_API_KEY");
    if (!apiKey) {
      throw new Error("NEWS_API_KEY not configured");
    }

    // Create cache key based on endpoint and params
    const cacheKey = `${this.cacheKey}/${endpoint}/${JSON.stringify(params)}`;

    // Try to get from cache first
    const cached = await this.runtime.cacheManager.get<T>(cacheKey);
    if (cached) {
      elizaLogger.info("Returning cached news data");
      return cached;
    }
    console.log("got here <===");

    try {
      // Build URL with query parameters
      const queryParams = new URLSearchParams({
        ...params,
        apiKey,
      } as Record<string, string>);

      const url = `${this.API_BASE_URL}/${endpoint}?${queryParams}`;
      console.log("got here 2 <===,url", url);
      elizaLogger.debug("Making news API request:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `News API error (${response.status}): ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();

      if (data.status !== "ok") {
        throw new Error(data.message || "Failed to fetch news");
      }

      // Cache successful response
      await this.runtime.cacheManager.set(cacheKey, data, {
        expires: this.cacheTTL,
      });

      return data;
    } catch (error) {
      elizaLogger.error("News API request failed:", error);
      throw error;
    }
  }

  async searchNews(params: SearchParams): Promise<NewsArticle[]> {
    elizaLogger.info("Searching news with params:", params);

    try {
      const searchParams: Record<string, string | number> = {
        q: params.query,
        language: params.language || "en",
        pageSize: params.pageSize?.toString() || "5",
        sortBy: "publishedAt",
      };

      const data = await this.makeRequest<NewsSearchResult>(
        "everything",
        searchParams
      );

      return data.articles;
    } catch (error) {
      elizaLogger.error("Failed to search news:", error);
      throw error;
    }
  }

  async getTopHeadlines(params: SearchParams): Promise<NewsArticle[]> {
    elizaLogger.info("Getting top headlines with params:", params);

    try {
      const searchParams: Record<string, string | number> = {
        country: params.country || "us",
        pageSize: params.pageSize?.toString() || "5",
      };

      // Add optional category if provided
      if (params.category) {
        searchParams.category = params.category;
      }

      const data = await this.makeRequest<NewsSearchResult>(
        "top-headlines",
        searchParams
      );

      return data.articles;
    } catch (error) {
      elizaLogger.error("Failed to get top headlines:", error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    if (!this.runtime) {
      throw new Error("NewsService not initialized");
    }

    try {
      await this.runtime.cacheManager.delete(this.cacheKey);
      elizaLogger.info("News cache cleared successfully");
    } catch (error) {
      elizaLogger.error("Failed to clear news cache:", error);
      throw error;
    }
  }
}
