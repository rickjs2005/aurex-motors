# AUREX MOTORS — GT-1

[Português](README.pt-BR.md)

A cinematic, scroll-driven website experience for a **fictional** luxury
electric-car maker. The idea: step into a commercial, not a website.

> **Type:** concept / portfolio piece (fictional brand). AUREX MOTORS does not exist and is not affiliated with Ferrari or any automaker.
> **Demo:** https://aurex-motors-ecru.vercel.app

![Hero of the AUREX GT-1 experience](docs/screenshots/hero.webp)

The car (AUREX GT-1) uses the Ferrari 458 Italia 3D model that ships with the
three.js examples (`public/models/ferrari-opt.glb`, Draco-compressed), with its
materials rebound in code to the AUREX identity. The studio environment is
built with Lightformers, without a downloaded HDR.

## Features

- Scroll narrative in scenes (hero, film, design, performance, interior,
  gallery, configurator, finale) with a scripted React Three Fiber camera.
- Real-time configurator: paint, wheels, cabin light colour and underglow,
  with an estimated (fictional) price.
- Gallery with its own canvas (4 cars); the main canvas pauses while it is
  on screen.
- Post-processing (Bloom/Vignette), custom cursor, loader and Lenis smooth
  scrolling (disabled on touch screens).
- The "Schedule a Test Drive" button opens a `mailto:` to an example address
  (`reserve@aurexmotors.example`, a reserved domain; nothing is sent anywhere).

![Configurator](docs/screenshots/configurator.webp)

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP +
ScrollTrigger · Lenis · React Three Fiber + drei · @react-three/postprocessing
(Bloom/Vignette) · Framer Motion · three.js

## Running locally

Prerequisites: Node.js 20 or newer (verified with Node 22) and npm.

```bash
npm ci
npm run dev        # http://localhost:3000
```

No environment variables are needed. The public URL used in the metadata
(Open Graph) is hard-coded in `src/app/layout.tsx` (`SITE_URL`).

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run start` | serves the production build |
| `npm run lint` | ESLint (the Draco decoder in `public/draco/` is ignored as third-party code) |

The `@gltf-transform/*` and `draco3dgltf` devDependencies were used to
optimise the GLB; there is no committed script for that step.

## Structure

```
src/app/               layout, single page and global styles
src/components/        nav, loader, cursor, smooth scroll, scene tracker
src/components/scene/  3D canvas, camera rig, car and stage
src/components/sections/  hero, story, gallery, configurator, finale
src/lib/               scene script (scenes.ts) and shared state (world.ts)
public/models/         ferrari-opt.glb (Draco)
public/draco/          Draco decoder (WASM/JS)
docs/screenshots/      images used in this README
```

## Architecture

- `src/lib/world.ts` — shared mutable state (scroll, pointer, car
  configuration). Read inside `useFrame`, never through React state:
  scrolling re-renders nothing.
- `src/lib/scenes.ts` — the "film script": camera keyframes, car rotation
  and light intensities per scene.
- `src/components/scene-tracker.tsx` — one ScrollTrigger per `[data-scene]`
  writes `(scene, progress)` into the world; mirrors the active scene on
  `<html data-scene>` for CSS (letterbox, canvas dimming).
- `src/components/scene/camera-rig.tsx` — samples the script with
  exponential damping: cuts become dolly moves. Mouse parallax on top.
- `src/components/scene/car.tsx` — loads the GLB (Draco decoder in
  `public/draco/`), clones the scene per instance and rebinds materials:
  configurable paint, red details and an emissive light signature.
- The configurator writes straight into `world.config`; the car lerps its
  materials every frame ("liquid" swap, zero 3D re-render).
- The gallery has its own canvas (4 cars, panning camera) — the main canvas
  pauses (`frameloop="never"`) meanwhile.

## Documented gotchas

- GSAP reads an inline `translateY(115%)` as `y` in px — animate `y`, not
  `yPercent`, or nothing moves.
- Tailwind v4: CSS outside `@layer` beats ANY utility (`md:hidden` does not
  hide a non-layered `.btn-primary`).
- Scene triggers need `end: "bottom top"` — with `bottom bottom` there is a
  100vh dead zone between sections and the canvas freezes/hides at the wrong
  time.
- Emissives with `toneMapped={false}` + a strong Environment + Bloom = a
  supernova; the glass needs a low `envMapIntensity`.
- Lenis is disabled on `pointer: coarse` (ScrollTrigger measurements break on
  touch; native scrolling is better there).

## Limitations

- Requires WebGL; the experience is heavy (page First Load JS ≈ 577 kB, plus
  the GLB) and needs a reasonable GPU.
- Content, specifications and prices are fictional; there is no backend,
  booking or real form.
- No automated tests; CI runs lint, type checking and the build.

## Credits

- 3D model: Ferrari 458 Italia by [vicent091036](https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6),
  distributed with the [three.js](https://github.com/mrdoob/three.js) examples
  (`examples/models/gltf/ferrari.glb`), re-optimised here. The model is under
  its original author's licence (not three.js's MIT licence): check it before
  any commercial use. "Ferrari" and the 458 Italia design belong to their
  owners; this project has no connection with Ferrari.
- Draco decoder in `public/draco/`: [Google Draco](https://github.com/google/draco)
  (Apache-2.0), as distributed by three.js.
- Space Grotesk and Inter fonts via `next/font/google`.

## Security

See [SECURITY.md](SECURITY.md).

## License

No license has been chosen yet; all rights reserved by the author. The
third-party items above remain under their own licences.
