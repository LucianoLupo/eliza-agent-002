import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const newsEnvSchema = z.object({
  NEWS_API_KEY: z.string().min(1, "News API key is required"),
  NEWS_BASE_URL: z.string().optional(),
  NEWS_CACHE_TTL: z.string().optional(),
});

export type NewsConfig = z.infer<typeof newsEnvSchema>;

export async function validateNewsConfig(
  runtime: IAgentRuntime
): Promise<NewsConfig> {
  try {
    const config = {
      NEWS_API_KEY: runtime.getSetting("NEWS_API_KEY"),
      NEWS_BASE_URL: runtime.getSetting("NEWS_BASE_URL"),
      NEWS_CACHE_TTL: runtime.getSetting("NEWS_CACHE_TTL"),
    };

    return newsEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `News configuration validation failed:\n${errorMessages}`
      );
    }
    throw error;
  }
}
