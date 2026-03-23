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
  // Strip unicode control characters that could cause parsing issues
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

  // Detail
  let detail = 2;
  for (const token of tokens) {
    if (token in DETAIL_KEYWORDS) {
      detail = DETAIL_KEYWORDS[token];
      break;
    }
  }

  // Fitness profile
  let fitnessProfile: WorldIntent["fitnessProfile"] = "random";
  for (const token of tokens) {
    if (token in FITNESS_KEYWORDS) {
      fitnessProfile = FITNESS_KEYWORDS[token];
      break;
    }
  }

  // Color
  let colorHint: [number, number, number] | null = null;
  for (const token of tokens) {
    if (token in COLOR_MAP) {
      colorHint = COLOR_MAP[token];
      break;
    }
  }

  // Scale
  let scale = 1;
  if (lower.includes("tiny") || lower.includes("small")) scale = 0.4;
  else if (lower.includes("large") || lower.includes("big") || lower.includes("huge")) scale = 1.8;
  else if (lower.includes("giant") || lower.includes("massive")) scale = 2.5;

  return { organisms, detail, fitnessProfile, colorHint, scale };
}

/** Generate fitness values for a given vertex count and profile */
export function generateFitness(
  vertexCount: number,
  profile: WorldIntent["fitnessProfile"],
): number[] {
  // Guard: negative or non-finite count → return empty array
  if (!isFinite(vertexCount) || vertexCount <= 0) return [];
  // Cap at 100,000 vertices to prevent memory exhaustion
  const count = Math.min(Math.floor(vertexCount), 100_000);
  const fitness: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    switch (profile) {
      case "random":
        fitness.push(Math.random());
        break;
      case "gradient":
        fitness.push(t);
        break;
      case "uniform":
        fitness.push(0.7);
        break;
      case "spiky":
        fitness.push(i % 3 === 0 ? 0.95 : 0.2);
        break;
    }
  }
  return fitness;
}

/** Approximate vertex count for an IcosahedronGeometry at a given detail level */
export function icosahedronVertexCount(detail: number): number {
  // Guard: clamp detail to valid range 0-5
  const clampedDetail = Math.max(0, Math.min(5, Math.floor(detail)));
  // Three.js IcosahedronGeometry: 10 * 4^detail + 2 unique vertices,
  // but BufferGeometry duplicates for flat faces ≈ 60 * 4^detail
  return 60 * Math.pow(4, clampedDetail);
}

/**
 * Generate a world of Phyloid genomes from a natural-language description.
 */
export function generateWorld(prompt: string): PhyloidGenome[] {
  const intent = parseWorldPrompt(prompt);
  const genomes: PhyloidGenome[] = [];
  const vertCount = icosahedronVertexCount(intent.detail);

  for (let i = 0; i < intent.organisms; i++) {
    const color: [number, number, number] = intent.colorHint
      ? [...intent.colorHint]
      : [Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1];

    genomes.push(
      defaultGenome({
        id: createGenomeId(),
        name: `Phyloid-${i + 1}`,
        detail: intent.detail,
        fitness: generateFitness(vertCount, intent.fitnessProfile),
        color,
        scale: intent.scale * (0.8 + Math.random() * 0.4),
      }),
    );
  }

  return genomes;
}
