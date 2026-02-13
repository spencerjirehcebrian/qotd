# Plan: Add "Tech" and "Pinoy" Themed Categories

## Goal

Add two new subject-matter categories -- **Tech** and **Pinoy** -- alongside the existing structural categories (Hot Takes, Preferences, etc.). Questions can be tagged with these just like any other category (multi-category assignment still works). The challenge is preventing these themes from bleeding into unrelated questions and keeping the app usable for non-tech, non-Filipino users.

## Design Decisions

- **No schema changes.** Tech and Pinoy are regular Category rows, same as the existing 7. The many-to-many join table handles overlap naturally (a question can be "Hot Takes" + "Tech").
- **Bleed prevention is handled in two places:** the agent prompt (generation-time) and the UI (display-time defaults).
- **The existing 7 categories remain the structural backbone.** Every question should have at least one structural category. Tech/Pinoy are additive subject-matter tags, never the sole category on a question.

---

## Changes

### 1. Seed file -- add new categories

**File:** `prisma/seed.ts`

Add two new entries to the `categories` array:

```ts
{ name: 'Tech', color: '#6366f1' },    // indigo
{ name: 'Pinoy', color: '#f97316' },   // orange
```

Since seed uses `upsert`, this is safe to re-run on existing databases. For deployed environments, also add a migration or one-off script to insert these rows.

### 2. Color maps -- add new entries

**File:** `src/lib/categoryColors.ts`

Add entries for "Tech" and "Pinoy" in all four maps:

| Map | Tech | Pinoy |
|-----|------|-------|
| `CATEGORY_TOKEN_MAP` | `cat-tech` | `cat-pinoy` |
| `CATEGORY_COLOR_MAP` | `#b3b8e0` (indigo pastel) | `#e0c4b3` (warm pastel) |
| `CATEGORY_HEX_MAP` | `#b3b8e0` | `#e0c4b3` |
| `CATEGORY_VIVID_MAP` | `#4a50b5` | `#c05a20` |

Exact hex values can be tuned later -- these are starting points that fit the existing pastel palette.

### 3. Agent system prompt -- add category scopes and bleed rules

**File:** `cli/lib/agent.ts`

**3a.** Add Tech and Pinoy to the category scopes list:

```
- Tech: engineering culture, programming humor, industry references, developer workplace life
- Pinoy: Filipino culture, food, traditions, expressions, shared Filipino experiences
```

**3b.** Add a new section after Categories:

```
## Themed Categories (Tech, Pinoy)
Tech and Pinoy are subject-matter categories. They describe WHAT a question is about, while the other categories describe the STRUCTURE of the question (hypothetical, opinion, personal story, etc.).

Rules:
- Every question MUST have at least one structural category (Preferences, What If, Hot Takes, Backstory, Real Talk, Just for Fun, or Wildcard). Tech and Pinoy are never the sole category.
- Only tag a question as Tech if it specifically references tech/engineering culture. Do not inject tech references into non-Tech questions.
- Only tag a question as Pinoy if it specifically references Filipino culture. Do not inject Filipino references into non-Pinoy questions.
- When generating without a specific category filter, keep the vast majority of questions culturally neutral. Only include Tech or Pinoy questions when explicitly requested via category filter.
- When generating for a structural category (e.g. "Hot Takes"), do NOT add tech or Filipino flavor unless also generating for Tech/Pinoy.
```

**3c.** Add example questions for each themed category in the seriousness scale (not all levels, just 1-2 examples to anchor):

```
Tech example: "Describe your most irrational git workflow habit and defend why it's actually correct."
Pinoy example: "What Filipino dish do you think deserves more international recognition, and how would you pitch it to someone who's never tried it?"
```

### 4. CLI generate command -- no changes needed

The existing `--category` flag already accepts any category name. `generate -n 10 --category Tech` or `generate -n 10 --category Pinoy` will work once the categories exist in the database and the prompt handles them.

### 5. Web UI -- default filter behavior

**File:** `src/store/useAppStore.ts` (or `src/components/Filters/CategoryFilter.tsx`)

Currently, empty `selectedCategories` means "all categories." This means Tech and Pinoy questions would show up by default for everyone.

**Option A (recommended):** Add an `excludedCategories` concept. By default, Tech and Pinoy are excluded unless a user explicitly selects them. When `selectedCategories` is empty, the fetch query passes `excludeCategories: ['Tech', 'Pinoy']` to the API. When a user explicitly clicks "Tech" or "Pinoy" in the filter, they're included.

**Option B (simpler):** No default exclusion. All categories show up. Users who don't want Tech/Pinoy questions deselect them manually. This is simpler but worse UX for non-tech/non-Filipino users who'd see irrelevant questions by default.

**Recommended: Option A.** Implementation details:

- Add `excludedCategories: string[]` to the Zustand store, defaulting to `['Tech', 'Pinoy']`.
- The API route `/api/questions` already supports category filtering. Add an `excludeCategories` query param that filters out questions where ALL their categories are in the excluded list (so a question tagged "Hot Takes" + "Tech" would still appear if the user is browsing Hot Takes, but a question tagged only "Tech" + "Just for Fun" where both are excluded wouldn't).
  - Actually, simpler: exclude questions that have ANY of the excluded categories. This is the stricter interpretation -- if you haven't opted into Tech, you don't see any tech-flavored questions even if they're also tagged Hot Takes. This is cleaner.
- In the CategoryFilter UI, show Tech and Pinoy pills in a visually distinct "Themed" subsection so users understand they're opt-in.

### 6. API route -- add excludeCategories support

**File:** `src/app/api/questions/route.ts`

Add `excludeCategories` query parameter support. When present, add a Prisma `where` clause:

```ts
questionCategories: {
  none: {
    category: { name: { in: excludeCategories } }
  }
}
```

This filters out any question that has at least one excluded category.

### 7. Data client -- pass excludeCategories

**File:** `cli/lib/data-client.ts` (and HTTP implementation)

Add optional `excludeCategories` to the `listQuestions` filter interface so the CLI can also use it if needed. Not critical for v1 since CLI users explicitly choose their category.

---

## File Change Summary

| File | Change |
|------|--------|
| `prisma/seed.ts` | Add Tech and Pinoy category entries |
| `src/lib/categoryColors.ts` | Add color entries for Tech and Pinoy in all maps |
| `cli/lib/agent.ts` | Add themed category scopes, bleed rules, and examples to system prompt |
| `src/app/api/questions/route.ts` | Add `excludeCategories` query param support |
| `src/store/useAppStore.ts` | Add `excludedCategories` state with default `['Tech', 'Pinoy']` |
| `src/components/Filters/CategoryFilter.tsx` | Show themed categories in a distinct subsection; toggle exclusion on click |

## What This Does NOT Change

- Prisma schema (no migrations needed -- categories are data, not schema)
- Existing 7 categories and their behavior
- CLI command interface (--category already works with any name)
- Question structure (still 1-3 categories per question, many-to-many)

## Open Questions

1. **Strictness of exclusion:** Should "Hot Takes" + "Tech" questions appear when browsing Hot Takes with Tech excluded? The plan above says no (strict exclusion). An alternative is to only exclude questions where Tech/Pinoy is the *primary* or *only* subject-matter tag.
2. **More themes later?** If you anticipate adding more themes (e.g., "Gaming", "Sports"), consider making the themed vs. structural distinction a boolean flag on the Category model (`isThemed: boolean`). This avoids hardcoding category names in the store default. Not needed for v1 but worth considering.
3. **Migration for deployed DB:** The seed file handles new installs, but the deployed database at qotd.spencerjireh.com needs the two new Category rows inserted. A one-off `prisma db seed` or manual insert will be needed.
