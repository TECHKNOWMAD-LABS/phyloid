import { ThreeAdapter } from "../engine/three-adapter.js";
import type { EngineAdapter, PhyloidGenome } from "../engine/types.js";
import { generateWorld } from "../world/nl-generator.js";
import { TIERS, getTierById, canCreateOrganism, canUseDetail } from "../payments/stripe-tiers.js";

export class PhyloidApp {
  private engine: EngineAdapter;
  private genomes: PhyloidGenome[] = [];
  private tierId = "free";
  private animationId = 0;

  constructor(engine?: EngineAdapter) {
    this.engine = engine ?? new ThreeAdapter();
  }

  init(container: HTMLElement): void {
    this.engine.init(container);
    this.buildUI(container);
    this.animate();
  }

  setTier(tierId: string): void {
    // Validate tier ID — silently fall back to free on unknown values
    const knownIds = TIERS.map((t) => t.id);
    this.tierId = knownIds.includes(tierId) ? tierId : "free";
  }

  generateFromPrompt(prompt: string): PhyloidGenome[] {
    // Sanitize prompt — null/undefined/non-string → empty string (returns [])
    if (typeof prompt !== "string") prompt = "";
    const tier = getTierById(this.tierId) ?? TIERS[0];

    let genomes = generateWorld(prompt);

    // Enforce tier limits
    genomes = genomes.filter((g) => canUseDetail(tier, g.detail));
    genomes = genomes.filter((_, i) => canCreateOrganism(tier, i));

    // Clear existing
    this.genomes.forEach((g) => this.engine.removePhyloid(g.id));
    this.genomes = [];

    // Create new
    for (const genome of genomes) {
      this.engine.createPhyloid(genome);
      if (genome.fitness.length > 0) {
        this.engine.updateFitness(genome.id, genome.fitness);
      }
      this.genomes.push(genome);
    }

    // Spread organisms in a circle
    const count = this.genomes.length;
    this.genomes.forEach((g, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = count > 1 ? 2 + count * 0.15 : 0;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Position is set via the mesh in the adapter; for now organisms auto-rotate
    });

    this.engine.setCameraPosition(0, 2, 5 + count * 0.3);
    return this.genomes;
  }

  getGenomes(): PhyloidGenome[] {
    return [...this.genomes];
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.engine.dispose();
  }

  private animate = (): void => {
    this.engine.render();
    this.animationId = requestAnimationFrame(this.animate);
  };

  private buildUI(container: HTMLElement): void {
    const ui = document.createElement("div");
    ui.id = "phyloid-ui";
    ui.innerHTML = `
      <div class="phyloid-panel">
        <h1>Phyloid</h1>
        <p class="subtitle">Describe a world of living shapes</p>
        <div class="input-row">
          <input type="text" id="nl-prompt"
            placeholder="e.g. swarm of spiky green organisms"
            autocomplete="off" />
          <button id="generate-btn">Generate</button>
        </div>
        <div id="stats" class="stats"></div>
      </div>
    `;
    container.appendChild(ui);

    const input = ui.querySelector("#nl-prompt") as HTMLInputElement;
    const btn = ui.querySelector("#generate-btn") as HTMLButtonElement;

    const handleGenerate = (): void => {
      const prompt = input.value.trim();
      if (!prompt) return;
      const genomes = this.generateFromPrompt(prompt);
      const statsEl = ui.querySelector("#stats")!;
      statsEl.textContent = `${genomes.length} organism${genomes.length !== 1 ? "s" : ""} generated`;
    };

    btn.addEventListener("click", handleGenerate);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleGenerate();
    });
  }
}
