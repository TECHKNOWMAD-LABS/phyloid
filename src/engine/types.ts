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
  return Math.max(0, Math.min(1, value));
}

export function defaultGenome(overrides?: Partial<PhyloidGenome>): PhyloidGenome {
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
