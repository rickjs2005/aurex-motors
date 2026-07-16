/**
 * Shared mutable state between the DOM world (scroll, pointer, UI)
 * and the 3D world (camera rig, car, stage). Everything here is read
 * inside useFrame — never via React state — so scroll/pointer never
 * cause re-renders.
 */

export type SceneName =
  | "hero"
  | "film-1"
  | "film-2"
  | "film-3"
  | "design-1"
  | "design-2"
  | "design-3"
  | "design-4"
  | "design-5"
  | "performance"
  | "interior"
  | "gallery"
  | "config"
  | "finale";

export type RimStyle = 0 | 1;

export interface CarConfig {
  /** body paint hex */
  color: string;
  /** rim style index */
  rim: RimStyle;
  /** interior ambient LED hex */
  ambient: string;
  /** underglow on/off */
  glow: boolean;
}

export const PAINTS = [
  { name: "Obsidian", hex: "#0d0d12" },
  { name: "Graphite", hex: "#3a3d46" },
  { name: "Glacier", hex: "#dcdde1" },
  { name: "Aurex Red", hex: "#a3071c" },
] as const;

export const AMBIENTS = [
  { name: "Signal Red", hex: "#ff2e24" },
  { name: "Ice Blue", hex: "#4cc3ff" },
  { name: "Amber", hex: "#ffb454" },
  { name: "Violet", hex: "#a06bff" },
] as const;

/** goal pose computed by the camera rig every frame from (scene, t) */
export interface Goal {
  cam: [number, number, number];
  look: [number, number, number];
  fov: number;
  /** car yaw */
  rotY: number;
  /** car x offset (finale launch) */
  carX: number;
  /** wheel spin speed rad/s */
  spin: number;
  /** 0..1 light intensities */
  key: number;
  rim: number;
  head: number;
  tail: number;
  cabin: number;
  /** speed-lines opacity 0..1 */
  streaks: number;
}

export const world = {
  scene: "hero" as SceneName,
  /** local progress 0..1 inside the active scene */
  t: 0,
  /** normalized pointer, -1..1 */
  pointer: { x: 0, y: 0 },
  /** set once the intro loader finished */
  introDone: false,
  /** live configurator state */
  config: {
    color: PAINTS[0].hex,
    rim: 0,
    ambient: AMBIENTS[0].hex,
    glow: false,
  } as CarConfig,
  quality: {
    mobile: false,
    reduced: false,
  },
  /** written by CameraRig each frame, read by Car/Stage */
  goal: {
    cam: [4.8, 1.15, 4.4],
    look: [0, 0.55, 0],
    fov: 40,
    rotY: -0.35,
    carX: 0,
    spin: 0,
    key: 0,
    rim: 0,
    head: 0,
    tail: 0,
    cabin: 0,
    streaks: 0,
  } as Goal,
};

/** tiny helpers */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
