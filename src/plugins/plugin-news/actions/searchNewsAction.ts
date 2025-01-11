// src/actions/searchNews.ts

import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ServiceType,
  ActionExample,
  elizaLogger,
  Content,
  composeContext,
  generateText,
  ModelClass,
} from "@elizaos/core";
import { INewsService } from "../types.ts";
import { formatNewsResponse } from "../utils/formatters.ts";

export const searchNews: Action = {
  name: "SEARCH_NEWS",
  similes: [
    "FIND_NEWS",
    "GET_NEWS",
    "NEWS_SEARCH",
    "SEARCH_FOR_NEWS",
    "FIND_NEWS_ABOUT",
    "LOOKUP_NEWS",
    "NEWS_LOOKUP",
  ],
  description: "Search for news articles on a specific topic",
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    const apiKey = runtime.getSetting("NEWS_API_KEY");
    if (!apiKey) {
      elizaLogger.error("NEWS_API_KEY not configured");
      return false;
    }
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback: HandlerCallback
  ): Promise<boolean> => {
    try {
      const newsService = runtime.getService<INewsService>(
        ServiceType.TEXT_GENERATION
      );

      const context = `
      Extract search terms from the {{userName}}'s following message:  
      ${message.content.text}
      Only respond with the search terms, no other text.
      `;

      const searchTermResponse = await generateText({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
        stop: ["\n"],
      });
      //correct way to inject message into a template will be something like this:
      // const template = `
      // Extract search terms from the {{userName}}'s following message:
      // ${message.content.text}
      // `;

      // const context = await composeContext({
      //   state,
      //   template,
      // });
      // and userName will be injected into the template from state

      // Extract query from message
      //
      const query = searchTermResponse;
      if (!query) {
        callback({
          text: "Please provide a search query for news articles.",
          content: { error: "No search query provided" },
        });
        return false;
      }

      // Prepare search parameters
      const searchParams = {
        query,
        language: "en",
        pageSize: 5,
      };

      // Get articles from service
      elizaLogger.info(`Searching news for query: ${query}`);
      const articles = await newsService.searchNews(searchParams);

      if (!articles || articles.length === 0) {
        callback({
          text: "No news articles found for your query.",
          content: { error: "No articles found" },
        });
        return false;
      }

      // Format and send response
      const responseText = formatNewsResponse(articles);

      const newMemory: Memory = {
        userId: message.userId,
        agentId: message.agentId,
        roomId: message.roomId,
        content: {
          text: responseText,
          source: message.content.source,
        } as Content,
      };

      await runtime.messageManager.createMemory(newMemory);

      // Create response with formatted text and raw articles
      callback(newMemory.content);

      return true;
    } catch (error) {
      elizaLogger.error("Error in searchNews action:", error);
      callback({
        text: "Sorry, I encountered an error while searching for news.",
        content: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Find news about artificial intelligence" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Let me search for news about artificial intelligence...",
          action: "SEARCH_NEWS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "What's the latest news in technology?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll find the latest technology news for you...",
          action: "SEARCH_NEWS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Search news about climate change" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Searching for news about climate change...",
          action: "SEARCH_NEWS",
        },
      },
    ],
  ] as ActionExample[][],
};
