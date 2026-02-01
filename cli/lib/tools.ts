import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { createDataClient } from "./data-client";

export const QOTD_SERVER_NAME = "qotd-tools";

// --- Tool definitions ---

const createQuestion = tool(
  "create_question",
  "Create a new QOTD question with text, seriousness level, and category assignments",
  {
    text: z.string().describe("The question text"),
    seriousnessLevel: z.number().min(1).max(5).describe("Seriousness level from 1 (lighthearted) to 5 (deep)"),
    categoryNames: z.array(z.string()).describe("Array of category names to assign"),
  },
  async (args) => {
    try {
      const client = createDataClient();
      const categories = await client.listCategories();
      const validNames = new Set(categories.map((c) => c.name));
      const invalidNames = args.categoryNames.filter((n) => !validNames.has(n));

      if (invalidNames.length > 0) {
        const allNames = categories.map((c) => c.name).join(", ");
        return {
          content: [{
            type: "text" as const,
            text: `Error: Invalid category names: ${invalidNames.join(", ")}. Valid categories are: ${allNames}`,
          }],
        };
      }

      const question = await client.createQuestion({
        text: args.text,
        seriousnessLevel: args.seriousnessLevel,
        categoryNames: args.categoryNames,
      });

      const result = {
        id: question.id,
        text: question.text,
        seriousnessLevel: question.seriousnessLevel,
        categories: question.categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        })),
      };

      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }
);

const listQuestions = tool(
  "list_questions",
  "List existing questions with optional filters for category, seriousness level, and text search",
  {
    category: z.string().optional().describe("Filter by category name"),
    seriousnessLevel: z.number().min(1).max(5).optional().describe("Filter by seriousness level"),
    search: z.string().optional().describe("Search text in question content"),
    limit: z.number().optional().describe("Maximum number of results (default 50)"),
  },
  async (args) => {
    try {
      const client = createDataClient();
      const questions = await client.listQuestions({
        category: args.category,
        seriousnessLevel: args.seriousnessLevel,
        search: args.search,
        limit: args.limit ?? 50,
      });

      const result = questions.map((q) => ({
        id: q.id,
        text: q.text,
        seriousnessLevel: q.seriousnessLevel,
        categories: q.categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        })),
      }));

      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }
);

const listCategories = tool(
  "list_categories",
  "List all available categories",
  {},
  async () => {
    try {
      const client = createDataClient();
      const categories = await client.listCategories();

      const result = categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
      }));

      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }
);

const checkDuplicate = tool(
  "check_duplicate",
  "Check if a similar question already exists in the database",
  {
    text: z.string().describe("The question text to check for duplicates"),
  },
  async (args) => {
    try {
      const client = createDataClient();
      const result = await client.checkDuplicate(args.text);

      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }
);

const proposeQuestions = tool(
  "propose_questions",
  "Submit ALL proposed questions in a single batch. Call this exactly once.",
  {
    questions: z.array(z.object({
      text: z.string(),
      seriousnessLevel: z.number().min(1).max(5),
      categoryNames: z.array(z.string()).min(1),
    })),
  },
  async (args) => {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ proposed: args.questions }) }],
    };
  }
);

// --- MCP Server ---

const allTools = [createQuestion, listQuestions, listCategories, checkDuplicate, proposeQuestions];

export const qotdServer = createSdkMcpServer({
  name: QOTD_SERVER_NAME,
  version: "1.0.0",
  tools: allTools,
});

// --- Allowed tools list ---

const toolNames = ["create_question", "list_questions", "list_categories", "check_duplicate"] as const;

export const ALLOWED_TOOLS = toolNames.map((name) => `mcp__${QOTD_SERVER_NAME}__${name}`);

export const GENERATE_ALLOWED_TOOLS = [
  `mcp__${QOTD_SERVER_NAME}__list_categories`,
  `mcp__${QOTD_SERVER_NAME}__propose_questions`,
];
