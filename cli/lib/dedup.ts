export interface ProposedQuestion {
  text: string;
  seriousnessLevel: number;
  categoryNames: string[];
}

export interface RejectedQuestion extends ProposedQuestion {
  reason: string;
  similarity?: number;
  matchedText?: string;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): Set<string> {
  const norm = normalizeText(text);
  return new Set(norm.split(" ").filter(Boolean));
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

export function deduplicateBatch(
  proposed: ProposedQuestion[],
  existingTexts: string[],
  threshold = 0.8
): { accepted: ProposedQuestion[]; rejected: RejectedQuestion[] } {
  const accepted: ProposedQuestion[] = [];
  const rejected: RejectedQuestion[] = [];

  for (const q of proposed) {
    const qNorm = normalizeText(q.text);
    let isRejected = false;

    // 1. Exact normalized match vs DB
    for (const existing of existingTexts) {
      const existingNorm = normalizeText(existing);
      if (qNorm === existingNorm) {
        rejected.push({ ...q, reason: "Exact duplicate of existing question", matchedText: existing });
        isRejected = true;
        break;
      }
    }
    if (isRejected) continue;

    // 2. Exact normalized match vs already-accepted batch items
    for (const acc of accepted) {
      if (qNorm === normalizeText(acc.text)) {
        rejected.push({ ...q, reason: "Exact duplicate within batch", matchedText: acc.text });
        isRejected = true;
        break;
      }
    }
    if (isRejected) continue;

    // 3. Jaccard similarity >= threshold vs DB
    for (let i = 0; i < existingTexts.length; i++) {
      const sim = jaccardSimilarity(q.text, existingTexts[i]);
      if (sim >= threshold) {
        rejected.push({
          ...q,
          reason: "Too similar to existing question",
          similarity: sim,
          matchedText: existingTexts[i],
        });
        isRejected = true;
        break;
      }
    }
    if (isRejected) continue;

    // 4. Jaccard similarity >= threshold vs accepted batch items
    for (const acc of accepted) {
      const sim = jaccardSimilarity(q.text, acc.text);
      if (sim >= threshold) {
        rejected.push({
          ...q,
          reason: "Too similar to another question in batch",
          similarity: sim,
          matchedText: acc.text,
        });
        isRejected = true;
        break;
      }
    }
    if (isRejected) continue;

    accepted.push(q);
  }

  return { accepted, rejected };
}
