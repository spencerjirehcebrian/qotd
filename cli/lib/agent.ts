import { query, AbortError } from "@anthropic-ai/claude-agent-sdk";
import { qotdServer, GENERATE_ALLOWED_TOOLS, QOTD_SERVER_NAME } from "./tools";
import { createDataClient } from "./data-client";
import {
  normalizeText,
  deduplicateBatch,
  type ProposedQuestion,
} from "./dedup";

export interface ProgressEvent {
  type:
    | "question_created"
    | "question_error"
    | "question_accepted"
    | "question_rejected"
    | "batch_received"
    | "retry";
  index: number;
  total: number;
  text: string;
  seriousnessLevel?: number;
  categories?: string[];
  error?: string;
  reason?: string;
}

export type OnProgress = (event: ProgressEvent) => void;

export const QOTD_SYSTEM_PROMPT = `You are a Question of the Day (QOTD) generator for a team bonding app.

## Seriousness Scale
- Level 1 (Very Unserious): Silly, absurd, purely fun questions
- Level 2 (Unserious): Light-hearted, casual, easy to answer
- Level 3 (Neutral): Balanced, interesting, mild thought required
- Level 4 (Serious): Thoughtful, reflective, requires genuine consideration
- Level 5 (Very Serious): Deep, philosophical, potentially personal

## Categories
Use ONLY the exact category names returned by list_categories. Do NOT abbreviate, rename, or invent category names.
Assign 1-3 categories per question when multiple fit. Category scopes:
- Preferences: favorites, desert-island picks, "which would you choose" questions
- What If: hypotheticals, imagination, alternate-reality scenarios
- Hot Takes: controversial opinions, unpopular stances, debates
- Backstory: personal history, formative moments, origin stories
- Real Talk: vulnerability, deep reflection, emotional honesty
- Just for Fun: silly, absurd, purely entertaining questions
- Wildcard: anything that defies the above categories

## Quality Expectations
- Questions must be open-ended (not yes/no)
- Questions should spark conversation and engagement
- Avoid offensive, divisive, or overly personal topics
- Each question should be unique and creative
- Match the requested seriousness level accurately

## Workflow
1. Call list_categories to confirm available categories
2. Generate all requested questions
3. Call propose_questions ONCE with the full array
   - Do NOT call it multiple times -- include ALL questions in one call
   - The system handles dedup and insertion automatically

## If retrying
You will receive a list of rejected questions with reasons.
Generate entirely NEW questions -- do not rephrase rejected ones.`;

export interface AgentResult {
  text: string;
  cost: number;
  turns: number;
  durationMs: number;
}

const MAX_RETRIES = 3;
const MAX_TURNS_PER_CALL = 8;

export async function runQotdAgent(
  prompt: string,
  options?: {
    timeoutMs?: number;
    maxTurns?: number;
    dryRun?: boolean;
    onProgress?: OnProgress;
    requestedCount?: number;
  }
): Promise<AgentResult> {
  const timeoutMs = options?.timeoutMs ?? 120_000;
  const dryRun = options?.dryRun ?? false;
  const onProgress = options?.onProgress;
  const requestedCount = options?.requestedCount ?? 0;

  const client = createDataClient();

  // Pre-fetch existing question texts for dedup
  const existingTexts = await client.getAllQuestionTexts();

  // Pre-fetch valid categories
  const dbCategories = await client.listCategories();
  const validCategoryNames = new Set(dbCategories.map((c) => c.name));

  const allAccepted: ProposedQuestion[] = [];
  const allRejected: { text: string; reason: string }[] = [];
  let totalCost = 0;
  let totalTurns = 0;
  const startTime = Date.now();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const remaining = requestedCount - allAccepted.length;
    if (remaining <= 0) break;

    // Build prompt for this attempt. On retries, request extra to buffer against dedup.
    const buffer = attempt > 0 ? Math.ceil(remaining * 0.5) : 0;
    const toRequest = remaining + buffer;
    let currentPrompt = prompt;
    if (attempt > 0) {
      const rejectedList = allRejected
        .map((r) => `- "${r.text}" (${r.reason})`)
        .join("\n");
      currentPrompt += `\n\nRETRY: Generate ${toRequest} new questions (${remaining} needed, with extras as buffer).`;
      currentPrompt += `\nThe following questions were rejected -- generate entirely NEW questions that are NOT similar to these:\n${rejectedList}`;
      onProgress?.({
        type: "retry",
        index: attempt,
        total: MAX_RETRIES,
        text: `Retry attempt ${attempt} -- ${remaining} question(s) remaining`,
      });
    }

    // Call agent
    const proposed = await callAgentForProposals(currentPrompt, timeoutMs);
    totalCost += proposed.cost;
    totalTurns += proposed.turns;

    if (proposed.questions.length === 0) break;

    onProgress?.({
      type: "batch_received",
      index: proposed.questions.length,
      total: requestedCount,
      text: `Received ${proposed.questions.length} proposal(s) from agent`,
    });

    // Validate category names
    const validatedQuestions: ProposedQuestion[] = [];
    for (const q of proposed.questions) {
      const invalidCats = q.categoryNames.filter((c) => !validCategoryNames.has(c));
      if (invalidCats.length > 0) {
        const reason = `Invalid categories: ${invalidCats.join(", ")}`;
        allRejected.push({ text: q.text, reason });
        onProgress?.({
          type: "question_rejected",
          index: 0,
          total: requestedCount,
          text: q.text,
          reason,
        });
      } else {
        validatedQuestions.push(q);
      }
    }

    // Dedup against DB + previously accepted
    const allExisting = [...existingTexts, ...allAccepted.map((q) => q.text)];
    const { accepted, rejected } = deduplicateBatch(validatedQuestions, allExisting);

    // Emit progress for accepted/rejected, cap at requested count
    const remaining2 = requestedCount - allAccepted.length;
    const toTake = accepted.slice(0, remaining2);
    for (const q of toTake) {
      allAccepted.push(q);
      onProgress?.({
        type: "question_accepted",
        index: allAccepted.length,
        total: requestedCount,
        text: q.text,
        seriousnessLevel: q.seriousnessLevel,
        categories: q.categoryNames,
      });
    }
    for (const q of rejected) {
      allRejected.push({ text: q.text, reason: q.reason });
      onProgress?.({
        type: "question_rejected",
        index: 0,
        total: requestedCount,
        text: q.text,
        reason: q.reason,
        categories: q.categoryNames,
      });
    }

    // If no new accepted this round, stop retrying
    if (toTake.length === 0) break;
  }

  // Insert into DB unless dry run
  if (!dryRun && allAccepted.length > 0) {
    await bulkInsert(allAccepted, requestedCount, onProgress);
  }

  const durationMs = Date.now() - startTime;
  const mode = dryRun ? "dry run" : "generated";
  return {
    text: `${mode}: ${allAccepted.length} question(s) processed`,
    cost: totalCost,
    turns: totalTurns,
    durationMs,
  };
}

// --- Internal helpers ---

interface AgentProposalResult {
  questions: ProposedQuestion[];
  cost: number;
  turns: number;
}

async function callAgentForProposals(
  prompt: string,
  timeoutMs: number
): Promise<AgentProposalResult> {
  const abortController = new AbortController();
  let timeout = setTimeout(() => abortController.abort(), timeoutMs);

  function resetTimeout() {
    clearTimeout(timeout);
    timeout = setTimeout(() => abortController.abort(), timeoutMs);
  }

  let proposedQuestions: ProposedQuestion[] = [];

  // Track propose_questions tool calls
  const pendingToolCalls = new Map<string, boolean>();

  try {
    for await (const message of query({
      prompt,
      options: {
        abortController,
        systemPrompt: QOTD_SYSTEM_PROMPT,
        mcpServers: { [QOTD_SERVER_NAME]: qotdServer },
        tools: [],
        allowedTools: GENERATE_ALLOWED_TOOLS,
        maxTurns: MAX_TURNS_PER_CALL,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
      },
    })) {
      resetTimeout();

      // Track propose_questions tool calls in assistant messages
      if (message.type === "assistant") {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (
              block &&
              typeof block === "object" &&
              "type" in block &&
              block.type === "tool_use" &&
              "name" in block &&
              typeof block.name === "string" &&
              block.name.includes("propose_questions") &&
              "id" in block &&
              typeof block.id === "string"
            ) {
              pendingToolCalls.set(block.id, true);
            }
          }
        }
      }

      // Extract proposed questions from tool results
      if (message.type === "user") {
        const raw = message.message;
        const content = Array.isArray(raw) ? raw : (raw as Record<string, unknown>)?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (
              block &&
              typeof block === "object" &&
              "tool_use_id" in block &&
              typeof block.tool_use_id === "string" &&
              pendingToolCalls.has(block.tool_use_id)
            ) {
              pendingToolCalls.delete(block.tool_use_id);
              let resultContent = "";
              if ("content" in block) {
                if (typeof block.content === "string") {
                  resultContent = block.content;
                } else if (Array.isArray(block.content)) {
                  const textBlock = block.content.find(
                    (b: Record<string, unknown>) => b && typeof b === "object" && b.type === "text" && typeof b.text === "string"
                  );
                  if (textBlock) resultContent = textBlock.text;
                }
              }

              try {
                const parsed = JSON.parse(resultContent);
                if (parsed.proposed && Array.isArray(parsed.proposed)) {
                  proposedQuestions = parsed.proposed;
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      }

      if (message.type === "result") {
        if (message.subtype === "success") {
          return {
            questions: proposedQuestions,
            cost: message.total_cost_usd,
            turns: message.num_turns,
          };
        }
        const errors =
          "errors" in message && Array.isArray(message.errors)
            ? message.errors.join(", ")
            : "unknown error";
        throw new Error(`Agent failed (${message.subtype}): ${errors}`);
      }
    }

    throw new Error("Agent completed without result message");
  } catch (err) {
    if (err instanceof AbortError) {
      throw new Error(
        `Agent timed out after ${Math.round(timeoutMs / 1000)} seconds`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function bulkInsert(
  questions: ProposedQuestion[],
  requestedCount: number,
  onProgress?: OnProgress
): Promise<void> {
  const client = createDataClient();
  let insertCount = 0;
  for (const q of questions) {
    try {
      const question = await client.createQuestion({
        text: q.text,
        textNorm: normalizeText(q.text),
        seriousnessLevel: q.seriousnessLevel,
        categoryNames: q.categoryNames,
      });

      insertCount++;
      onProgress?.({
        type: "question_created",
        index: insertCount,
        total: requestedCount,
        text: question.text,
        seriousnessLevel: question.seriousnessLevel,
        categories: question.categories.map((c) => c.name),
      });
    } catch (err) {
      onProgress?.({
        type: "question_error",
        index: insertCount + 1,
        total: requestedCount,
        text: q.text,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
