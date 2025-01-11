// src/actions/topHeadlines.ts

import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ServiceType,
  ActionExample,
  elizaLogger,
  generateText,
  ModelClass,
} from "@elizaos/core";
import { INewsService } from "../types.ts";
import { formatNewsResponse } from "../utils/formatters.ts";

export const topHeadlines: Action = {
  name: "GET_HEADLINES",
  similes: [
    "HEADLINES",
    "TOP_NEWS",
    "LATEST_NEWS",
    "BREAKING_NEWS",
    "NEWS_HEADLINES",
    "CURRENT_NEWS",
  ],
  description: "Get top headlines for a specific country",
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

      // Extract country from message or use default
      // const countryCode = extractCountryCode(message.content.text) || "us";
      const context = `
      Extract country code from the {{userName}}'s following message:  
      ${message.content.text}
      Only respond with the country code, no other text.
      `;

      const countryCode = await generateText({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
        stop: ["\n"],
      });
      // Get headlines from service
      elizaLogger.info(`Getting headlines for country: ${countryCode}`);
      const articles = await newsService.getTopHeadlines({
        country: countryCode,
        pageSize: 5,
      });

      if (!articles || articles.length === 0) {
        callback({
          text: "No headlines found at the moment.",
          content: { error: "No headlines found" },
        });
        return false;
      }

      // Format and send response
      const responseText = formatNewsResponse(articles);
      callback({
        text: responseText,
        content: { articles },
      });
      return true;
    } catch (error) {
      elizaLogger.error("Error in topHeadlines action:", error);
      callback({
        text: "Sorry, I encountered an error while fetching headlines.",
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
        content: { text: "Show me today's headlines" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Here are today's top headlines...",
          action: "GET_HEADLINES",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "What are the top news stories in the UK?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Let me get the top headlines from the UK...",
          action: "GET_HEADLINES",
        },
      },
    ],
  ] as ActionExample[][],
};
