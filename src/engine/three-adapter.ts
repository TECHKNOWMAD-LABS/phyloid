import * as THREE from "three";
import type { EngineAdapter, EngineObject, PhyloidGenome, RenderStats } from "./types.js";
import { clampFitness } from "./types.js";

/**
 * Three.js r128 engine adapter.
 * Uses IcosahedronGeometry with per-vertex fitness displacement and coloring.
 */
export class ThreeAdapter implements EngineAdapter {
  readonly name = "three-r128";

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private meshes = new Map<string, THREE.Mesh>();
  private clock = new THREE.Clock();
  private container: HTMLElement | null = null;

  init(container: HTMLElement): void {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a2e);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 0, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 5, 5);
    this.scene.add(directional);
    const point = new THREE.PointLight(0x00ffaa, 0.4, 20);
    point.position.set(-3, 2, 4);
    this.scene.add(point);

    window.addEventListener("resize", this.onResize);
  }

  createPhyloid(genome: PhyloidGenome): EngineObject {
    const geometry = new THREE.IcosahedronGeometry(genome.scale, genome.detail);
    this.applyFitnessToGeometry(geometry, genome.fitness, genome.color);

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      flatShading: true,
      shininess: 60,
      transparent: true,
      opacity: 0.92,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = genome.id;
    this.meshes.set(genome.id, mesh);
    this.scene.add(mesh);

    return {
      id: genome.id,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      visible: true,
    };
  }

  removePhyloid(id: string): void {
    const mesh = this.meshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.meshes.delete(id);
    }
  }

  updateFitness(id: string, fitness: number[]): void {
    const mesh = this.meshes.get(id);
    if (!mesh) return;

    const geometry = mesh.geometry as THREE.IcosahedronGeometry;
    const posAttr = geometry.getAttribute("position");
    const count = posAttr.count;

    const colors = new Float32Array(count * 3);
    const positions = posAttr.array as Float32Array;
    const original = new Float32Array(positions);

    for (let i = 0; i < count; i++) {
      const f = clampFitness(fitness[i % fitness.length] ?? 0.5);

      // Displace vertex along normal direction by fitness
      const nx = original[i * 3];
      const ny = original[i * 3 + 1];
      const nz = original[i * 3 + 2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      const displacement = (f - 0.5) * 0.3;

      positions[i * 3] = original[i * 3] + (nx / len) * displacement;
      positions[i * 3 + 1] = original[i * 3 + 1] + (ny / len) * displacement;
      positions[i * 3 + 2] = original[i * 3 + 2] + (nz / len) * displacement;

      // Color: low fitness = red, mid = yellow, high = green/cyan
      colors[i * 3] = 1.0 - f;
      colors[i * 3 + 1] = f;
      colors[i * 3 + 2] = f * 0.5;
    }

    posAttr.needsUpdate = true;
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
  }

  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  render(): void {
    const dt = this.clock.getDelta();
    this.meshes.forEach((mesh) => {
      mesh.rotation.y += dt * 0.3;
      mesh.rotation.x += dt * 0.1;
    });
    this.renderer.render(this.scene, this.camera);
  }

  getStats(): RenderStats {
    const info = this.renderer.info;
    return {
      fps: Math.round(1 / (this.clock.getDelta() || 0.016)),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    };
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.meshes.forEach((_, id) => this.removePhyloid(id));
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentNode) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  private applyFitnessToGeometry(
    geometry: THREE.BufferGeometry,
    fitness: number[],
    baseColor: [number, number, number],
  ): void {
    const posAttr = geometry.getAttribute("position");
    const count = posAttr.count;
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const f = clampFitness(fitness[i] ?? 0.5);
      colors[i * 3] = baseColor[0] * (1 - f) + f;
      colors[i * 3 + 1] = baseColor[1] * f;
      colors[i * 3 + 2] = baseColor[2] * f * 0.8;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  private onResize = (): void => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
