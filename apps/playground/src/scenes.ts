export type Density = "airy" | "balanced" | "compact";
export type Theme = "midnight" | "dawn" | "signal";
export type Device = "desktop" | "mobile";

export interface StageCard {
  eyebrow: string;
  title: string;
  copy: string;
  meta: string;
}

export interface PlaygroundScene {
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

export const scenes: PlaygroundScene[] = [
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
