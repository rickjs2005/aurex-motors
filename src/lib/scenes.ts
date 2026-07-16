import { Goal, SceneName, lerp, easeInOut } from "./world";

type V3 = [number, number, number];

/** a keyframed pose: [from, to] pairs lerped by eased local progress */
interface SceneDef {
  cam: [V3, V3];
  look: [V3, V3];
  fov: [number, number];
  rotY: [number, number];
  carX?: [number, number];
  spin?: [number, number];
  key: [number, number];
  rim: [number, number];
  head: [number, number];
  tail: [number, number];
  cabin: [number, number];
  streaks?: [number, number];
}

/**
 * The film script. One entry per scene; the camera rig lerps inside a
 * scene by eased scroll progress and damps *between* scenes, so cuts
 * become dolly moves.
 *
 * Car sits at origin, nose pointing +x. Ground y=0.
 */
export const SCENES: Record<SceneName, SceneDef> = {
  // The car surfaces from darkness; camera drifts in, faint key light rises.
  hero: {
    cam: [
      [5.4, 1.35, 4.9],
      [4.1, 1.0, 3.6],
    ],
    look: [
      [0, 0.5, 0],
      [0, 0.55, 0],
    ],
    fov: [42, 40],
    rotY: [-0.42, 0.05],
    key: [0.75, 1],
    rim: [0.5, 0.75],
    head: [0.35, 0.5],
    tail: [0, 0],
    cabin: [0.05, 0.1],
  },

  // Full side profile glides past — rim light carves the silhouette.
  "film-1": {
    cam: [
      [0.6, 0.72, 5.6],
      [-0.7, 0.66, 5.0],
    ],
    look: [
      [0.2, 0.58, 0],
      [-0.2, 0.55, 0],
    ],
    fov: [35, 34],
    rotY: [0.05, 0],
    key: [0.7, 0.75],
    rim: [0.9, 1],
    head: [0.3, 0.3],
    tail: [0, 0.15],
    cabin: [0.1, 0.1],
  },

  // Low frontal — the light blade ignites.
  "film-2": {
    cam: [
      [4.6, 0.45, 1.9],
      [3.9, 0.4, 1.15],
    ],
    look: [
      [1.6, 0.5, 0],
      [1.9, 0.48, 0.05],
    ],
    fov: [33, 31],
    rotY: [0, -0.18],
    key: [0.6, 0.7],
    rim: [0.7, 0.7],
    head: [0.3, 1],
    tail: [0.15, 0.15],
    cabin: [0.1, 0.1],
  },

  // Elevated rear 3/4 — the full-width tail bar burns red.
  "film-3": {
    cam: [
      [-5.4, 2.4, 3.6],
      [-4.5, 1.8, 2.7],
    ],
    look: [
      [-1.0, 0.45, 0],
      [-1.4, 0.5, 0],
    ],
    fov: [38, 36],
    rotY: [-0.18, -0.3],
    key: [0.55, 0.6],
    rim: [0.8, 0.85],
    head: [1, 1],
    tail: [0.2, 1],
    cabin: [0.1, 0.12],
  },

  // ---- design close-ups (cameras stay OUTSIDE the bodywork) ----
  // headlight
  "design-1": {
    cam: [
      [3.6, 0.85, 2.0],
      [3.05, 0.62, 1.4],
    ],
    look: [
      [2.15, 0.5, 0.15],
      [2.2, 0.5, 0.1],
    ],
    fov: [30, 28],
    rotY: [-0.3, -0.15],
    key: [0.7, 0.75],
    rim: [0.6, 0.6],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.12, 0.12],
  },
  // wheel
  "design-2": {
    cam: [
      [2.7, 0.62, 2.2],
      [2.25, 0.46, 1.75],
    ],
    look: [
      [1.45, 0.36, 0.62],
      [1.45, 0.34, 0.64],
    ],
    fov: [31, 29],
    rotY: [-0.15, 0],
    key: [0.85, 0.9],
    rim: [0.55, 0.55],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.12, 0.12],
  },
  // front fascia ("grille")
  "design-3": {
    cam: [
      [3.9, 0.6, 1.25],
      [3.35, 0.45, 0.75],
    ],
    look: [
      [2.3, 0.42, 0],
      [2.32, 0.4, 0],
    ],
    fov: [30, 28],
    rotY: [0, 0],
    key: [0.75, 0.8],
    rim: [0.6, 0.6],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.12, 0.12],
  },
  // the canopy, from above
  "design-4": {
    cam: [
      [2.2, 1.85, 2.0],
      [1.55, 1.55, 1.45],
    ],
    look: [
      [-0.1, 0.9, -0.1],
      [0, 0.9, -0.15],
    ],
    fov: [34, 32],
    rotY: [0, 0],
    key: [0.7, 0.7],
    rim: [0.6, 0.6],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.35, 0.7],
  },
  // steering wheel, inside the cabin (intentionally interior)
  "design-5": {
    cam: [
      [0.98, 1.06, -0.3],
      [0.66, 0.96, -0.32],
    ],
    look: [
      [-0.35, 0.8, -0.34],
      [-0.4, 0.78, -0.34],
    ],
    fov: [42, 44],
    rotY: [0, 0],
    key: [0.5, 0.5],
    rim: [0.4, 0.4],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.9, 1],
  },

  // rear 3/4, wheels spinning, air streaking past
  performance: {
    cam: [
      [-3.8, 1.15, 3.9],
      [-3.2, 0.85, 3.3],
    ],
    look: [
      [0.2, 0.5, 0],
      [0.4, 0.45, 0],
    ],
    fov: [42, 44],
    rotY: [0, 0],
    spin: [4, 30],
    key: [0.7, 0.75],
    rim: [1, 1],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.15, 0.15],
    streaks: [0, 1],
  },

  // inside the cabin the whole time — dollying through the glass
  // blasts the emissive dash across the lens
  interior: {
    cam: [
      [1.05, 1.04, 0.3],
      [0.4, 0.95, -0.12],
    ],
    look: [
      [0.2, 0.82, -0.15],
      [-0.75, 0.72, -0.05],
    ],
    fov: [40, 47],
    rotY: [0, 0],
    key: [0.4, 0.3],
    rim: [0.4, 0.3],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.6, 1],
  },

  // main canvas fades out — gallery has its own stage
  gallery: {
    cam: [
      [0.4, 1.1, 5.2],
      [0.4, 1.1, 5.2],
    ],
    look: [
      [0, 0.55, 0],
      [0, 0.55, 0],
    ],
    fov: [40, 40],
    rotY: [0, 0],
    key: [0.4, 0.4],
    rim: [0.5, 0.5],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.2, 0.2],
  },

  // slow orbit while the panel drives materials
  config: {
    cam: [
      [5.6, 1.6, 3.4],
      [-3.2, 1.5, 5.6],
    ],
    look: [
      [0, 0.45, 0],
      [0, 0.45, 0],
    ],
    fov: [38, 38],
    rotY: [0, 0],
    key: [0.95, 0.95],
    rim: [0.8, 0.8],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.6, 0.6],
  },

  // launch: the car tears off into the dark
  finale: {
    cam: [
      [1.2, 0.85, 5.4],
      [2.4, 1.05, 6.2],
    ],
    look: [
      [0, 0.55, 0],
      [14, 0.6, 0],
    ],
    fov: [40, 50],
    rotY: [0, 0],
    carX: [0, 34],
    spin: [0, 70],
    key: [0.8, 0.2],
    rim: [0.9, 0.2],
    head: [1, 1],
    tail: [1, 1],
    cabin: [0.2, 0],
    streaks: [0, 1],
  },
};

const v = (pair: [V3, V3], t: number): V3 => [
  lerp(pair[0][0], pair[1][0], t),
  lerp(pair[0][1], pair[1][1], t),
  lerp(pair[0][2], pair[1][2], t),
];

/** sample the film script into a goal pose */
export function sampleScene(scene: SceneName, rawT: number): Goal {
  const s = SCENES[scene] ?? SCENES.hero;
  const t = easeInOut(Math.min(1, Math.max(0, rawT)));
  return {
    cam: v(s.cam, t),
    look: v(s.look, t),
    fov: lerp(s.fov[0], s.fov[1], t),
    rotY: lerp(s.rotY[0], s.rotY[1], t),
    carX: s.carX ? lerp(s.carX[0], s.carX[1], t) : 0,
    spin: s.spin ? lerp(s.spin[0], s.spin[1], t) : 0,
    key: lerp(s.key[0], s.key[1], t),
    rim: lerp(s.rim[0], s.rim[1], t),
    head: lerp(s.head[0], s.head[1], t),
    tail: lerp(s.tail[0], s.tail[1], t),
    cabin: lerp(s.cabin[0], s.cabin[1], t),
    streaks: s.streaks ? lerp(s.streaks[0], s.streaks[1], t) : 0,
  };
}
