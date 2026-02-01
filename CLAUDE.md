# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QOTD Gen is a dual-interface app (Next.js web UI + Node.js CLI) for generating and managing "question of the day" entries. Questions are AI-generated via the Claude Agent SDK with MCP tools and stored in SQLite via Prisma.

## Common Commands

```bash
# Development
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint

# CLI (run via tsx)
npx tsx cli/index.ts                    # Interactive mode (TTY, no args)
npx tsx cli/index.ts generate -n 5      # Generate questions
npx tsx cli/index.ts list               # List questions
npx tsx cli/index.ts stats              # Show statistics

# Database
npx prisma migrate dev                  # Run migrations
npx prisma generate                     # Regenerate client
npx prisma studio                       # Database browser
```

## Testing

```bash
npm test                                         # Run all tests (vitest)
npx vitest run tests/cli/unit                    # Unit tests only
npx vitest run tests/cli/e2e                     # E2E tests only (slower, spawns CLI subprocesses)
npx vitest run tests/cli/e2e/list.test.ts        # Single test file
```

Tests use Vitest (`vitest.config.ts`). E2E tests create temporary SQLite databases via `tests/cli/helpers/setup.ts` and run the CLI as a child process via `tests/cli/helpers/run-cli.ts`. The `generate` E2E tests require a valid `ANTHROPIC_API_KEY` and have a 180s timeout.

## Architecture

Two entry points share a SQLite database through Prisma:

**Web UI** (`src/app/`): Next.js 16 App Router with a spinning wheel interface. Uses Zustand for state management (persisted to localStorage). Animations via GSAP and Framer Motion. API routes at `src/app/api/`.

**CLI** (`cli/`): Commander.js with interactive mode fallback. Each command is registered via `registerXCommand(program)` in `cli/commands/`. The `generate` command uses the Claude Agent SDK (`cli/lib/agent.ts`) with custom MCP server tools (`cli/lib/tools.ts`). All data access goes through a `DataClient` interface (`cli/lib/data-client.ts`) with two implementations: `PrismaDataClient` (local/direct) and `HttpDataClient` (remote via API routes). The factory `createDataClient()` picks the implementation based on `.qotdrc` config or `QOTD_API_URL`/`QOTD_API_KEY` env vars.

**Shared database layer**: Prisma singleton in `cli/lib/db.ts` (used by `PrismaDataClient`). Schema has Question, Category, and QuestionCategory (many-to-many join) models. Web API routes use `src/lib/prisma.ts` (Next.js singleton). Write API routes require `x-api-key` header when `QOTD_API_KEY` is set in the server environment.

## Key Patterns

- **MCP tools** are defined with Zod schemas in `cli/lib/tools.ts` and served via `createSdkMcpServer()` to the agent
- **Agent flow**: system prompt built from CLI options -> Claude Agent SDK `query()` generator -> agent calls MCP tools -> `onProgress` callback tracks results -> summary displayed
- **Path alias**: `@/*` maps to `./src/*`
- **Module system**: ESM with bundler resolution, TypeScript strict mode
- **CLI interactive mode**: detects 0 args + TTY, presents Inquirer.js menu, reconstructs args for `program.parse()`
- **Output helpers**: `cli/lib/output.ts` (colored console) and `cli/lib/format.ts` (cli-table3 tables)
