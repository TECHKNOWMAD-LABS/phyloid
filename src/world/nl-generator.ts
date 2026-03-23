import { defaultGenome, createGenomeId, type PhyloidGenome } from "../engine/types.js";

/** Token patterns recognized by the NL world generator */
interface WorldIntent {
  organisms: number;
  detail: number;
  fitnessProfile: "random" | "gradient" | "uniform" | "spiky";
  colorHint: [number, number, number] | null;
  scale: number;
}

const COLOR_MAP: Record<string, [number, number, number]> = {
  red: [0.9, 0.2, 0.1],
  green: [0.1, 0.9, 0.3],
  blue: [0.1, 0.3, 0.9],
  purple: [0.6, 0.1, 0.8],
  cyan: [0.1, 0.8, 0.8],
  orange: [0.9, 0.5, 0.1],
  pink: [0.9, 0.3, 0.6],
  yellow: [0.9, 0.9, 0.1],
  white: [0.9, 0.9, 0.9],
};

const DETAIL_KEYWORDS: Record<string, number> = {
  simple: 1,
  basic: 1,
  smooth: 3,
  detailed: 3,
  complex: 4,
  intricate: 4,
  ultra: 5,
  highres: 5,
};

const FITNESS_KEYWORDS: Record<string, WorldIntent["fitnessProfile"]> = {
  random: "random",
  chaotic: "random",
  gradient: "gradient",
  smooth: "gradient",
  flowing: "gradient",
  uniform: "uniform",
  flat: "uniform",
  even: "uniform",
  spiky: "spiky",
  jagged: "spiky",
  rough: "spiky",
  mountainous: "spiky",
};

/**
 * Parse a natural-language prompt into a WorldIntent.
 * Gracefully handles null/undefined/empty inputs and over-long strings.
 */
export function parseWorldPrompt(prompt: string): WorldIntent {
  // Input sanitization: handle null/undefined/non-string inputs
  if (prompt === null || prompt === undefined || typeof prompt !== "string") {
    prompt = "";
  }
  // Truncate excessively long prompts (>2048 chars) to avoid regex DoS
  if (prompt.length > 2048) {
    prompt = prompt.slice(0, 2048);
  }
  // Strip unicode control characters (C0: 0x00-0x1F, DEL: 0x7F, C1: 0x80-0x9F)
  // eslint-disable-next-line no-control-regex
  prompt = prompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");

  const lower = prompt.toLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);

  // Count
  let organisms = 1;
  const countMatch = lower.match(/(\d+)\s+(?:\w+\s+)*(phyloid|organism|creature|sphere|shape|form|object)s?/);
  if (countMatch) {
    organisms = Math.min(parseInt(countMatch[1], 10), 50);
  } else if (lower.includes("swarm") || lower.includes("many") || lower.includes("colony")) {
    organisms = 12;
  } else if (lower.includes("pair") || lower.includes("two") || lower.includes("couple")) {
    organisms = 2;
  } else if (lower.includes("few") || lower.includes("some") || lower.includes("several")) {
    organisms = 5;
  }

  // Single-pass token scan for detail, fitnessProfile, color, and scale keywords
  // (avoids 3 separate O(n) iterations over the token list)
  let detail = 2;
  let fitnessProfile: WorldIntent["fitnessProfile"] = "random";
  let colorHint: [number, number, number] | null = null;
  let scale = 1;

  for (const token of tokens) {
    if (detail === 2 && token in DETAIL_KEYWORDS) detail = DETAIL_KEYWORDS[token];
    if (fitnessProfile === "random" && token in FITNESS_KEYWORDS) fitnessProfile = FITNESS_KEYWORDS[token];
    if (colorHint === null && token in COLOR_MAP) colorHint = COLOR_MAP[token];
    // Scale keywords (checked once via token set)
    if (token === "tiny" || token === "small") scale = 0.4;
    else if (token === "large" || token === "big" || token === "huge") { if (scale === 1) scale = 1.8; }
    else if (token === "giant" || token === "massive") scale = 2.5;
  }

  return { organisms, detail, fitnessProfile, colorHint, scale };
}

/**
 * Generate fitness values for a given vertex count and profile.
 *
 * Performance notes:
 * - Pre-allocates the result array once (avoids repeated Array.push resizes)
 * - For deterministic profiles (uniform, gradient, spiky), this is O(n) with
 *   tight inner loops — no branching per element for uniform/spiky
 */
export function generateFitness(
  vertexCount: number,
  profile: WorldIntent["fitnessProfile"],
): number[] {
  // Guard: negative or non-finite count → return empty array
  if (!isFinite(vertexCount) || vertexCount <= 0) return [];
  // Cap at 100,000 vertices to prevent memory exhaustion
  const count = Math.min(Math.floor(vertexCount), 100_000);

  // Pre-allocate to avoid incremental Array growth
  const fitness = new Array<number>(count);

  switch (profile) {
    case "random":
      for (let i = 0; i < count; i++) fitness[i] = Math.random();
      break;
    case "gradient": {
      const inv = count > 1 ? 1 / (count - 1) : 0;
      for (let i = 0; i < count; i++) fitness[i] = count > 1 ? i * inv : 0.5;
      break;
    }
    case "uniform":
      fitness.fill(0.7);
      break;
    case "spiky":
      for (let i = 0; i < count; i++) fitness[i] = i % 3 === 0 ? 0.95 : 0.2;
      break;
  }

  return fitness;
}

/**
 * Memoized lookup table for icosahedron vertex counts (detail levels 0-5).
 * Avoids repeated Math.pow calls — only 6 distinct values possible.
 */
const _VERTEX_COUNT_CACHE: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5].map(
  (d) => 60 * Math.pow(4, d),
);

/** Approximate vertex count for an IcosahedronGeometry at a given detail level */
export function icosahedronVertexCount(detail: number): number {
  // Guard: clamp detail to valid range 0-5
  const clampedDetail = Math.max(0, Math.min(5, Math.floor(detail)));
  // Three.js IcosahedronGeometry: 10 * 4^detail + 2 unique vertices,
  // but BufferGeometry duplicates for flat faces ≈ 60 * 4^detail
  return _VERTEX_COUNT_CACHE[clampedDetail];
}

/**
 * Generate a world of Phyloid genomes from a natural-language description.
 */
export function generateWorld(prompt: string): PhyloidGenome[] {
  const intent = parseWorldPrompt(prompt);
  const vertCount = icosahedronVertexCount(intent.detail);

  // Performance: deterministic profiles (uniform, gradient, spiky) produce identical
  // fitness arrays for all organisms in the same world — generate once and share.
  // Random profile MUST be unique per organism, so we generate per-organism only then.
  const sharedFitness: number[] | null =
    intent.fitnessProfile !== "random"
      ? generateFitness(vertCount, intent.fitnessProfile)
      : null;

  // Pre-allocate result array
  const genomes: PhyloidGenome[] = new Array(intent.organisms);

  for (let i = 0; i < intent.organisms; i++) {
    const color: [number, number, number] = intent.colorHint
      ? [intent.colorHint[0], intent.colorHint[1], intent.colorHint[2]]
      : [Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1];

    const fitness = sharedFitness ?? generateFitness(vertCount, "random");

    genomes[i] = defaultGenome({
      id: createGenomeId(),
      name: `Phyloid-${i + 1}`,
      detail: intent.detail,
      fitness,
      color,
      scale: intent.scale * (0.8 + Math.random() * 0.4),
    });
  }

  return genomes;
}
