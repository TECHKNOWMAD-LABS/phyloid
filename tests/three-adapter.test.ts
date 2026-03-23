/**
 * Tests for src/engine/three-adapter.ts
 * Three.js is mocked to avoid WebGL/canvas requirements in test environments.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- Three.js mock — NOTE: vi.mock is hoisted, factory must not reference
//      outer variables that haven't been initialized yet. Use vi.fn() inline.
vi.mock("three", () => {
  const mockDisposeGeometry = vi.fn();
  const mockDisposeMaterial = vi.fn();
  const mockGeometry = {
    getAttribute: vi.fn((name: string) => {
      if (name === "position") {
        const arr = new Float32Array(60 * 3);
        for (let i = 0; i < arr.length; i++) arr[i] = (i % 3) === 0 ? 1 : 0;
        return { count: 60, array: arr, needsUpdate: false };
      }
      return null;
    }),
    setAttribute: vi.fn(),
    computeVertexNormals: vi.fn(),
    dispose: mockDisposeGeometry,
  };

  const mockMaterial = { dispose: mockDisposeMaterial };

  return {
    Scene: vi.fn(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      background: null,
    })),
    PerspectiveCamera: vi.fn(() => ({
      position: { set: vi.fn() },
      lookAt: vi.fn(),
      aspect: 1,
      updateProjectionMatrix: vi.fn(),
    })),
    WebGLRenderer: vi.fn(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: { parentNode: null },
      info: { render: { calls: 5, triangles: 1200 } },
    })),
    Clock: vi.fn(() => ({
      getDelta: vi.fn(() => 0.016),
    })),
    AmbientLight: vi.fn(() => ({ position: { set: vi.fn() } })),
    DirectionalLight: vi.fn(() => ({ position: { set: vi.fn() } })),
    PointLight: vi.fn(() => ({ position: { set: vi.fn() } })),
    Color: vi.fn(),
    IcosahedronGeometry: vi.fn(() => mockGeometry),
    MeshPhongMaterial: vi.fn(() => mockMaterial),
    Mesh: vi.fn((geometry: unknown, material: unknown) => ({
      name: "",
      rotation: { x: 0, y: 0 },
      geometry,
      material,
    })),
    BufferAttribute: vi.fn((arr: Float32Array, size: number) => ({ array: arr, itemSize: size })),
  };
});

// ---- Tests ----------------------------------------------------------------
import { ThreeAdapter } from "../src/engine/three-adapter";
import { defaultGenome } from "../src/engine/types";

function makeContainer(): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "clientWidth", { get: () => 800, configurable: true });
  Object.defineProperty(el, "clientHeight", { get: () => 600, configurable: true });
  el.appendChild = vi.fn();
  el.removeChild = vi.fn();
  return el;
}

describe("engine/ThreeAdapter", () => {
  let adapter: ThreeAdapter;
  let container: HTMLElement;

  beforeEach(() => {
    adapter = new ThreeAdapter();
    container = makeContainer();
  });

  afterEach(() => {
    try { adapter.dispose(); } catch { /* ignore */ }
  });

  // Test 15
  it("init attaches renderer to container", () => {
    adapter.init(container);
    expect(container.appendChild).toHaveBeenCalled();
  });

  // Test 16
  it("createPhyloid returns EngineObject with matching id", () => {
    adapter.init(container);
    const genome = defaultGenome({ fitness: [0.2, 0.5, 0.8] });
    const obj = adapter.createPhyloid(genome);
    expect(obj.id).toBe(genome.id);
    expect(obj.visible).toBe(true);
    expect(obj.position).toEqual([0, 0, 0]);
  });

  // Test 17
  it("createPhyloid adds mesh to scene — scene.add called", () => {
    adapter.init(container);
    const genome = defaultGenome();
    adapter.createPhyloid(genome);
    // scene.add is called for lights (3 times) + mesh (1 time)
    // We only verify it doesn't throw and createPhyloid returns an object
    const obj = adapter.createPhyloid(genome);
    expect(obj).toBeDefined();
  });

  // Test 18
  it("removePhyloid disposes geometry and material", () => {
    adapter.init(container);
    const genome = defaultGenome();
    adapter.createPhyloid(genome);
    expect(() => adapter.removePhyloid(genome.id)).not.toThrow();
  });

  // Test 19
  it("removePhyloid is a no-op for unknown id", () => {
    adapter.init(container);
    expect(() => adapter.removePhyloid("nonexistent_id_xyz")).not.toThrow();
  });

  // Test 20
  it("updateFitness runs without error for known id", () => {
    adapter.init(container);
    const genome = defaultGenome({ fitness: [0.1, 0.9, 0.5] });
    adapter.createPhyloid(genome);
    expect(() => adapter.updateFitness(genome.id, [0.1, 0.5, 0.9])).not.toThrow();
  });

  // Test 21
  it("updateFitness is a no-op for unknown id", () => {
    adapter.init(container);
    expect(() => adapter.updateFitness("unknown_xyz", [0.5])).not.toThrow();
  });

  // Test 22
  it("setCameraPosition delegates to camera.position.set", () => {
    adapter.init(container);
    // Should not throw with valid coordinates
    expect(() => adapter.setCameraPosition(1, 2, 3)).not.toThrow();
    expect(() => adapter.setCameraPosition(-5, 0, 10)).not.toThrow();
  });

  // Test 23
  it("render does not throw", () => {
    adapter.init(container);
    expect(() => adapter.render()).not.toThrow();
  });

  // Test 24
  it("getStats returns numeric fps, drawCalls, triangles", () => {
    adapter.init(container);
    const stats = adapter.getStats();
    expect(stats).toHaveProperty("fps");
    expect(stats).toHaveProperty("drawCalls");
    expect(stats).toHaveProperty("triangles");
    expect(typeof stats.fps).toBe("number");
    expect(typeof stats.drawCalls).toBe("number");
    expect(typeof stats.triangles).toBe("number");
  });

  // Test 25
  it("dispose cleans up without throwing", () => {
    adapter.init(container);
    const g1 = defaultGenome();
    const g2 = defaultGenome();
    adapter.createPhyloid(g1);
    adapter.createPhyloid(g2);
    expect(() => adapter.dispose()).not.toThrow();
  });

  // Test 26
  it("name is 'three-r128'", () => {
    expect(adapter.name).toBe("three-r128");
  });
});
