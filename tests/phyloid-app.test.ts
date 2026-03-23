/**
 * Tests for src/ui/app.ts — PhyloidApp
 * Mocks the engine adapter and DOM environment.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EngineAdapter, EngineObject, PhyloidGenome, RenderStats } from "../src/engine/types";

// ---- Mock EngineAdapter ---------------------------------------------------
function makeMockEngine(): EngineAdapter & {
  _genomes: string[];
  _initCalled: boolean;
} {
  const _genomes: string[] = [];
  return {
    name: "mock-engine",
    _genomes,
    _initCalled: false,
    init: vi.fn(function (this: { _initCalled: boolean }) {
      this._initCalled = true;
    }),
    createPhyloid: vi.fn((genome: PhyloidGenome): EngineObject => {
      _genomes.push(genome.id);
      return { id: genome.id, position: [0, 0, 0], rotation: [0, 0, 0], visible: true };
    }),
    removePhyloid: vi.fn((id: string) => {
      const idx = _genomes.indexOf(id);
      if (idx !== -1) _genomes.splice(idx, 1);
    }),
    updateFitness: vi.fn(),
    setCameraPosition: vi.fn(),
    render: vi.fn(),
    getStats: vi.fn((): RenderStats => ({ fps: 60, drawCalls: 10, triangles: 500 })),
    dispose: vi.fn(),
  };
}

// Mock requestAnimationFrame/cancelAnimationFrame for jsdom
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  // Don't auto-call to avoid infinite loop in tests
  return 42;
});
vi.stubGlobal("cancelAnimationFrame", vi.fn());

import { PhyloidApp } from "../src/ui/app";

describe("ui/PhyloidApp", () => {
  let engine: ReturnType<typeof makeMockEngine>;
  let container: HTMLElement;
  let app: PhyloidApp;

  beforeEach(() => {
    engine = makeMockEngine();
    container = document.createElement("div");
    Object.defineProperty(container, "clientWidth", { get: () => 800 });
    Object.defineProperty(container, "clientHeight", { get: () => 600 });
    app = new PhyloidApp(engine);
  });

  afterEach(() => {
    try { app.dispose(); } catch { /* ignore */ }
    vi.clearAllMocks();
  });

  // Test 27
  it("init calls engine.init and builds UI", () => {
    app.init(container);
    expect(engine.init).toHaveBeenCalledWith(container);
    // UI panel should be in container
    expect(container.querySelector("#phyloid-ui")).toBeTruthy();
  });

  // Test 28
  it("generateFromPrompt returns array of genomes", () => {
    app.init(container);
    const genomes = app.generateFromPrompt("3 green creatures");
    expect(Array.isArray(genomes)).toBe(true);
    expect(genomes.length).toBeGreaterThan(0);
    expect(genomes.length).toBeLessThanOrEqual(3);
  });

  // Test 29
  it("generateFromPrompt calls createPhyloid for each genome", () => {
    app.init(container);
    app.generateFromPrompt("2 blue organisms");
    expect(engine.createPhyloid).toHaveBeenCalled();
  });

  // Test 30
  it("generateFromPrompt removes old genomes before adding new", () => {
    app.init(container);
    app.generateFromPrompt("1 red creature");
    const firstCallCount = (engine.createPhyloid as ReturnType<typeof vi.fn>).mock.calls.length;
    app.generateFromPrompt("1 blue creature");
    expect(engine.removePhyloid).toHaveBeenCalled();
    const secondCallCount = (engine.createPhyloid as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(secondCallCount).toBeGreaterThan(firstCallCount);
  });

  // Test 31
  it("getGenomes returns a copy of internal genomes array", () => {
    app.init(container);
    app.generateFromPrompt("1 organism");
    const g1 = app.getGenomes();
    const g2 = app.getGenomes();
    expect(g1).not.toBe(g2); // copy, not reference
    expect(g1).toEqual(g2);
  });

  // Test 32
  it("setTier restricts organism count for free tier", () => {
    app.init(container);
    app.setTier("free");
    // Free tier max 5 organisms, max detail 2
    const genomes = app.generateFromPrompt("swarm of complex organisms");
    // swarm = 12 organisms, complex detail = 4 — free tier should restrict
    expect(genomes.length).toBeLessThanOrEqual(5);
    genomes.forEach((g) => expect(g.detail).toBeLessThanOrEqual(2));
  });

  // Test 33
  it("setTier enterprise allows large count", () => {
    app.init(container);
    app.setTier("enterprise");
    const genomes = app.generateFromPrompt("swarm of organisms");
    // swarm = 12, enterprise allows 500
    expect(genomes.length).toBe(12);
  });

  // Test 34
  it("dispose calls engine.dispose and cancels animation", () => {
    app.init(container);
    app.dispose();
    expect(engine.dispose).toHaveBeenCalled();
  });

  // Test 35
  it("UI generate button triggers generateFromPrompt", () => {
    app.init(container);
    const input = container.querySelector("#nl-prompt") as HTMLInputElement;
    const btn = container.querySelector("#generate-btn") as HTMLButtonElement;
    expect(input).toBeTruthy();
    expect(btn).toBeTruthy();
    input.value = "red spiky creature";
    btn.click();
    expect(engine.createPhyloid).toHaveBeenCalled();
  });

  // Test 36
  it("UI does not generate on empty prompt", () => {
    app.init(container);
    const input = container.querySelector("#nl-prompt") as HTMLInputElement;
    const btn = container.querySelector("#generate-btn") as HTMLButtonElement;
    input.value = "";
    btn.click();
    expect(engine.createPhyloid).not.toHaveBeenCalled();
  });

  // Test 37
  it("UI generate on Enter key press", () => {
    app.init(container);
    const input = container.querySelector("#nl-prompt") as HTMLInputElement;
    input.value = "tiny blue creatures";
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    input.dispatchEvent(event);
    expect(engine.createPhyloid).toHaveBeenCalled();
  });

  // Test 38
  it("stats element updated after generation", () => {
    app.init(container);
    const input = container.querySelector("#nl-prompt") as HTMLInputElement;
    const btn = container.querySelector("#generate-btn") as HTMLButtonElement;
    input.value = "1 organism";
    btn.click();
    const stats = container.querySelector("#stats");
    expect(stats?.textContent).toMatch(/organism/);
  });
});
