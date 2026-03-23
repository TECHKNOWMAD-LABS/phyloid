/** Core types for the Phyloid engine adapter layer */

export interface PhyloidGenome {
  id: string;
  name: string;
  detail: number;       // icosahedron subdivision level 0-5
  fitness: number[];    // per-vertex fitness values [0,1]
  color: [number, number, number]; // RGB base color
  scale: number;
  mutations: number;
}

export interface EngineObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  visible: boolean;
}

export interface RenderStats {
  fps: number;
  drawCalls: number;
  triangles: number;
}

export interface EngineAdapter {
  readonly name: string;
  init(container: HTMLElement): void;
  createPhyloid(genome: PhyloidGenome): EngineObject;
  removePhyloid(id: string): void;
  updateFitness(id: string, fitness: number[]): void;
  setCameraPosition(x: number, y: number, z: number): void;
  render(): void;
  getStats(): RenderStats;
  dispose(): void;
}

export function createGenomeId(): string {
  return `phy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clampFitness(value: number): number {
  // Guard: NaN / Infinity → 0.5 (neutral fitness)
  if (!isFinite(value) || isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

/** Validate a genome and return sanitized copy. Throws on unrecoverable errors. */
export function validateGenome(genome: Partial<PhyloidGenome>): void {
  if (!genome || typeof genome !== "object") {
    throw new TypeError("genome must be an object");
  }
  if (typeof genome.detail === "number" && (genome.detail < 0 || genome.detail > 5)) {
    throw new RangeError(`genome.detail must be 0-5, got ${genome.detail}`);
  }
  if (typeof genome.scale === "number" && (genome.scale <= 0 || !isFinite(genome.scale))) {
    throw new RangeError(`genome.scale must be a positive finite number, got ${genome.scale}`);
  }
  if (
    genome.color !== undefined &&
    (!Array.isArray(genome.color) || genome.color.length !== 3)
  ) {
    throw new TypeError("genome.color must be a 3-element array");
  }
}

export function defaultGenome(overrides?: Partial<PhyloidGenome>): PhyloidGenome {
  if (overrides !== undefined) validateGenome(overrides);
  return {
    id: createGenomeId(),
    name: "Unnamed Phyloid",
    detail: 2,
    fitness: [],
    color: [0.2, 0.8, 0.5],
    scale: 1,
    mutations: 0,
    ...overrides,
  };
}
