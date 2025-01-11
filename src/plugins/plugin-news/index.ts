// src/index.ts

import { Plugin } from "@elizaos/core";
import { NewsService } from "./services/newsService.ts";
import { searchNews } from "./actions/searchNewsAction.ts";
import { topHeadlines } from "./actions/topHeadlinesAction.ts";

export function createNewsPlugin() {
  return {
    name: "news",
    description: "News plugin providing access to news articles and headlines",
    services: [new NewsService()],
    actions: [searchNews, topHeadlines],
    evaluators: [],
    providers: [],
  } as const satisfies Plugin;
}

// Export plugin creator as default
export default createNewsPlugin;

// Export types and interfaces
export * from "./types.ts";
export * from "./environment.ts";
export * from "./services/newsService.ts";
export * from "./actions/searchNewsAction.ts";
export * from "./actions/topHeadlinesAction.ts";
