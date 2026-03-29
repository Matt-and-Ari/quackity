import "./style.css";

type Density = "airy" | "balanced" | "compact";
type Theme = "midnight" | "dawn" | "signal";
type Device = "desktop" | "mobile";

interface StageCard {
  eyebrow: string;
  title: string;
  copy: string;
  meta: string;
}

interface PlaygroundScene {
  id: string;
  name: string;
  kicker: string;
  headline: string;
  body: string;
  density: Density;
  theme: Theme;
  cards: StageCard[];
  checklist: string[];
  tokens: string[];
}

const scenes: PlaygroundScene[] = [
  {
    id: "marketing",
    name: "Marketing Home",
    kicker: "Launch narrative",
    headline: "A staging ground for hero layouts, value props, and CTA experiments.",
    body: "Use this scene when you want to rough in a homepage without wiring real data yet. The content blocks are intentionally opinionated so you can swap copy, rhythm, and hierarchy fast.",
    density: "airy",
    theme: "midnight",
    cards: [
      {
        eyebrow: "Hero",
        title: "Bold first impression",
        copy: "Frame the big promise with one sharp sentence and a supportive subhead.",
        meta: "Primary CTA + secondary proof",
      },
      {
        eyebrow: "Social proof",
        title: "Customer logos or metrics",
        copy: "Test trust-building treatments before connecting real logos and analytics.",
        meta: "Marquee, grid, or quote stack",
      },
      {
        eyebrow: "Feature lane",
        title: "Explain the product shape",
        copy: "Compare three-card, alternating, or editorial story sections in place.",
        meta: "Cards, timeline, or split panels",
      },
    ],
    checklist: [
      "Try a tighter headline with a stronger verb.",
      "Swap the CTA row from horizontal to stacked.",
      "Test proof modules above versus below the fold.",
    ],
    tokens: ["#7c3aed", "#10131f", "#f7f2ff", "#7dd3fc"],
  },
  {
    id: "dashboard",
    name: "Product Dashboard",
    kicker: "Dense interface",
    headline: "Mock operational views with enough realism to make layout decisions quickly.",
    body: "This preset is useful for tables, insight cards, filters, and side panels. Keep the fake data realistic enough to surface spacing, truncation, and hierarchy problems early.",
    density: "compact",
    theme: "signal",
    cards: [
      {
        eyebrow: "Summary strip",
        title: "Metrics at a glance",
        copy: "Use concise labels and one standout metric that earns the user's first look.",
        meta: "4-up stat row",
      },
      {
        eyebrow: "Activity feed",
        title: "Recent changes and alerts",
        copy: "Pressure-test line wrapping, icon rhythm, and badge contrast with noisy content.",
        meta: "Feed + filters",
      },
      {
        eyebrow: "Inspector",
        title: "Context without modal overload",
        copy: "Reserve a side panel for richer mock detail while keeping the core flow visible.",
        meta: "Split layout",
      },
    ],
    checklist: [
      "Check long labels in the metrics row.",
      "Test destructive states and disabled controls.",
      "Try a calmer neutral background behind tables.",
    ],
    tokens: ["#0f172a", "#14b8a6", "#f59e0b", "#e2e8f0"],
  },
  {
    id: "mobile",
    name: "Mobile Flow",
    kicker: "Small-screen focus",
    headline: "Pressure-test onboarding, cards, and gesture-friendly controls in a phone frame.",
    body: "Reach for this when the desktop view hides mobile compromises. The layout keeps controls chunky, copy short, and visual emphasis obvious so you can iterate on flow instead of plumbing.",
    density: "balanced",
    theme: "dawn",
    cards: [
      {
        eyebrow: "Onboarding",
        title: "Lead with one decision",
        copy: "Show the next best action instead of a wall of options.",
        meta: "Progress + single focus",
      },
      {
        eyebrow: "Collection",
        title: "Cards that stack cleanly",
        copy: "Use compact metadata and obvious tap targets to preserve scanability.",
        meta: "List + action rail",
      },
      {
        eyebrow: "Completion",
        title: "Reward the final step",
        copy: "Celebrate completion states with motion, contrast, and calm surrounding whitespace.",
        meta: "Success pattern",
      },
    ],
    checklist: [
      "Audit thumb reach for primary actions.",
      "Trim body copy until each card scans in one breath.",
      "Check light and dark screenshots side by side.",
    ],
    tokens: ["#f97316", "#fff7ed", "#1f2937", "#fb7185"],
  },
];

const appRootEl = document.querySelector<HTMLDivElement>("#app");

if (!appRootEl) {
  throw new Error("App root not found");
}

const appRoot: HTMLDivElement = appRootEl;

let activeSceneId = scenes[0]?.id ?? "";
let activeDevice: Device = "desktop";

function getScene(sceneId: string): PlaygroundScene {
  return scenes.find((scene) => scene.id === sceneId) ?? scenes[0];
}

function renderSceneTabs(activeScene: PlaygroundScene): string {
  return scenes
    .map(
      (scene) => `
        <button
          class="nav-chip${scene.id === activeScene.id ? " is-active" : ""}"
          type="button"
          data-scene="${scene.id}"
        >
          <span>${scene.name}</span>
          <small>${scene.kicker}</small>
        </button>
      `,
    )
    .join("");
}

function renderDeviceTabs(device: Device): string {
  return (["desktop", "mobile"] as const)
    .map(
      (value) => `
        <button
          class="device-tab${value === device ? " is-active" : ""}"
          type="button"
          data-device="${value}"
        >
          ${value}
        </button>
      `,
    )
    .join("");
}

function renderCards(cards: StageCard[]): string {
  return cards
    .map(
      (card) => `
        <article class="stage-card">
          <p class="eyebrow">${card.eyebrow}</p>
          <h3>${card.title}</h3>
          <p>${card.copy}</p>
          <span>${card.meta}</span>
        </article>
      `,
    )
    .join("");
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function renderTokens(tokens: string[]): string {
  return tokens
    .map(
      (token) => `
        <li>
          <span class="swatch" style="--swatch:${token}"></span>
          <code>${token}</code>
        </li>
      `,
    )
    .join("");
}

function renderPreview(scene: PlaygroundScene, device: Device): string {
  const isMobile = device === "mobile";
  const previewCards = isMobile ? scene.cards.slice(0, 2) : scene.cards;

  return `
    <section class="preview-shell ${scene.theme} ${scene.density} ${isMobile ? "mobile" : "desktop"}">
      <div class="preview-topbar">
        <div class="traffic-lights">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="preview-address">playground://${scene.id}</div>
        <div class="preview-badge">${scene.density}</div>
      </div>

      <div class="preview-hero">
        <p class="eyebrow">${scene.kicker}</p>
        <h2>${scene.headline}</h2>
        <p>${scene.body}</p>
        <div class="cta-row">
          <a href="/">Primary action</a>
          <button type="button">Secondary path</button>
        </div>
      </div>

      <div class="preview-grid">
        ${renderCards(previewCards)}
      </div>

      <div class="preview-footer">
        <div>
          <strong>Use this space for mock data</strong>
          <p>Drop in placeholders, swap density, and tune visual hierarchy before wiring anything real.</p>
        </div>
        <div class="footer-pill">${isMobile ? "Tap-first" : "Wide layout"}</div>
      </div>
    </section>
  `;
}

function render(): void {
  const scene = getScene(activeSceneId);

  appRoot.innerHTML = `
    <div class="shell">
      <aside class="sidebar panel">
        <div class="panel-header">
          <p class="eyebrow">Playground</p>
          <h1>Website clone sandbox</h1>
          <p class="muted">
            A dedicated app for roughing in UI, mock data, layout systems, and interaction ideas without touching production screens.
          </p>
        </div>

        <section>
          <div class="section-heading">
            <h2>Scenes</h2>
            <span>${scenes.length} presets</span>
          </div>
          <div class="nav-chip-list">
            ${renderSceneTabs(scene)}
          </div>
        </section>

        <section>
          <div class="section-heading">
            <h2>Prompt starter</h2>
          </div>
          <p class="muted prompt-copy">
            "Build a ${scene.name.toLowerCase()} variation with ${scene.density} spacing, stronger contrast, and realistic placeholder content."
          </p>
        </section>
      </aside>

      <main class="workspace">
        <header class="workspace-header panel">
          <div>
            <p class="eyebrow">${scene.kicker}</p>
            <h2>${scene.name}</h2>
          </div>
          <div class="device-switch" role="tablist" aria-label="Preview device">
            ${renderDeviceTabs(activeDevice)}
          </div>
        </header>

        <div class="stage panel">
          ${renderPreview(scene, activeDevice)}
        </div>
      </main>

      <aside class="inspector panel">
        <section>
          <div class="section-heading">
            <h2>What to try</h2>
          </div>
          <ul class="checklist">
            ${renderChecklist(scene.checklist)}
          </ul>
        </section>

        <section>
          <div class="section-heading">
            <h2>Color tokens</h2>
          </div>
          <ul class="token-list">
            ${renderTokens(scene.tokens)}
          </ul>
        </section>

        <section class="note-card">
          <p class="eyebrow">Workflow</p>
          <p class="muted">
            Start here for UI spikes, then copy the parts that survive into the real app once the direction feels right.
          </p>
        </section>
      </aside>
    </div>
  `;

  bindEvents();
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-scene]").forEach((button) => {
    button.addEventListener("click", () => {
      activeSceneId = button.dataset.scene ?? activeSceneId;
      activeDevice = activeSceneId === "mobile" ? "mobile" : activeDevice;
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-device]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextDevice = button.dataset.device;

      if (nextDevice === "desktop" || nextDevice === "mobile") {
        activeDevice = nextDevice;
        render();
      }
    });
  });
}

render();
