import Reveal, { RevealTitle } from "@/components/reveal";
import Counter from "@/components/counter";

/* ------------------------------------------------------------------ */
/* Film — three cinematic beats. Each section is a camera scene;      */
/* the caption rides sticky at the bottom like a subtitle.            */
/* ------------------------------------------------------------------ */

function FilmBeat({
  scene,
  index,
  title,
  copy,
  align = "left",
}: {
  scene: string;
  index: string;
  title: string;
  copy: string;
  align?: "left" | "right";
}) {
  return (
    <section data-scene={scene} className="relative h-[135vh]">
      <div className="pointer-events-none sticky top-0 flex h-screen items-end">
        <div
          className={`relative z-10 w-full px-6 pb-24 md:px-12 ${
            align === "right" ? "flex justify-end text-right" : ""
          }`}
        >
          <Reveal>
            <p className="eyebrow mb-3">{index}</p>
            <h2 className="display max-w-xl text-[clamp(1.9rem,4.6vw,3.8rem)] text-pearl">
              {title}
            </h2>
            <p className={`mt-4 max-w-sm text-sm font-light leading-relaxed text-mist ${align === "right" ? "ml-auto" : ""}`}>
              {copy}
            </p>
          </Reveal>
        </div>
        <div className="scrim-b pointer-events-none absolute inset-x-0 bottom-0 h-[45vh]" />
      </div>
    </section>
  );
}

export function Film() {
  return (
    <div id="film">
      <FilmBeat
        scene="film-1"
        index="Scene 01"
        title="Sculpted by wind."
        copy="One unbroken line from nose to tail. The GT-1's silhouette was shaped in the wind tunnel first and the studio second — a 0.19 drag coefficient, drawn in light."
      />
      <FilmBeat
        scene="film-2"
        index="Scene 02"
        title="It sees the road before you do."
        copy="A single light blade spans the nose. Adaptive matrix beams carve the dark at 340 km/h, dimming around traffic in milliseconds."
        align="right"
      />
      <FilmBeat
        scene="film-3"
        index="Scene 03"
        title="A signature written in red."
        copy="The full-width tail bar is the last thing most drivers will ever see of a GT-1. It burns at dusk like the horizon it is about to cross."
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Design close-ups — the camera kisses the sheet metal.              */
/* ------------------------------------------------------------------ */

const CLOSEUPS = [
  {
    scene: "design-1",
    n: "01",
    title: "Light Blade",
    copy: "1.46 metres of continuous LED, cut into the carbon nose. It greets you when you approach and breathes while charging.",
  },
  {
    scene: "design-2",
    n: "02",
    title: "Forged Wheels",
    copy: "Forged 22-inch five-spokes over carbon-ceramic brakes. Each wheel torque-vectored, individually driven.",
  },
  {
    scene: "design-3",
    n: "03",
    title: "The Front Fascia",
    copy: "No grille. No engine. A single gloss-black sensor band reads the road two hundred metres ahead, in the dark, in the rain.",
  },
  {
    scene: "design-4",
    n: "04",
    title: "The Open Cockpit",
    copy: "No roof between you and tomorrow. The windshield wraps the cabin in a pocket of still air — a conversation at 300 km/h.",
  },
  {
    scene: "design-5",
    n: "05",
    title: "The Helm",
    copy: "A yoke carved from a single billet, wrapped by hand. Behind it, nothing but road and one panoramic display.",
  },
];

export function Design() {
  return (
    <div id="design">
      {CLOSEUPS.map((c, i) => (
        <section key={c.scene} data-scene={c.scene} className="relative h-[130vh]">
          <div className="pointer-events-none sticky top-0 flex h-screen items-center">
            <div
              className={`relative z-10 w-full px-6 md:px-12 ${
                i % 2 ? "flex justify-end" : ""
              }`}
            >
              <Reveal className="pointer-events-auto">
                <div className="glass max-w-sm p-8">
                  <p className="eyebrow mb-4">
                    Design <span className="text-aurex-glow">/ {c.n}</span>
                  </p>
                  <h3 className="display text-3xl text-pearl">{c.title}</h3>
                  <p className="mt-4 text-sm font-light leading-relaxed text-mist">
                    {c.copy}
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Performance — giant counting numbers over the rolling shot.        */
/* ------------------------------------------------------------------ */

const STATS = [
  { value: 2.4, decimals: 1, unit: "s", label: "0–100 km/h" },
  { value: 340, decimals: 0, unit: "km/h", label: "Top speed" },
  { value: 720, decimals: 0, unit: "km", label: "Range · WLTP" },
  { value: 1080, decimals: 0, unit: "hp", label: "Tri-motor output" },
];

export function Performance() {
  return (
    <section id="performance" data-scene="performance" className="relative h-[190vh]">
      <div className="pointer-events-none sticky top-0 flex h-screen flex-col justify-center">
        <div className="scrim-radial absolute inset-0" />
        <div className="relative z-10 px-6 md:px-12">
          <Reveal>
            <p className="eyebrow mb-3">Performance</p>
            <RevealTitle
              text="Numbers that need no adjectives."
              className="display max-w-3xl text-[clamp(2rem,5vw,4.2rem)] text-pearl"
            />
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 md:mt-20 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <div>
                  <div className="display text-[clamp(2.6rem,6vw,5.5rem)] leading-none text-pearl">
                    <Counter value={s.value} decimals={s.decimals} />
                    <span className="ml-1 align-top text-[0.35em] font-medium text-aurex-glow">
                      {s.unit}
                    </span>
                  </div>
                  <p className="mt-3 text-[0.68rem] uppercase tracking-[0.3em] text-mist">
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Interior — the camera slips through the glass.                     */
/* ------------------------------------------------------------------ */

const INTERIOR_BEATS = [
  {
    n: "01",
    title: "One display. Zero noise.",
    copy: "A panoramic screen spans the cabin, dimming to a single line of speed at night. Everything else is leather, carbon and silence.",
  },
  {
    n: "02",
    title: "Seats carved around you.",
    copy: "Scanned to your posture in thirty seconds, stitched by hand over eleven hours. Heating, cooling and eight-point massage — standard.",
  },
  {
    n: "03",
    title: "Light that reads the drive.",
    copy: "Ambient light shifts with your mode: ice blue in Range, deep amber at dusk, signal red the moment you engage Overboost.",
  },
];

export function Interior() {
  return (
    <section id="interior" data-scene="interior" className="relative h-[320vh]">
      {INTERIOR_BEATS.map((b, i) => (
        <div key={b.n} className="pointer-events-none flex h-[calc(320vh/3)] items-center">
          <div className={`w-full px-6 md:px-12 ${i % 2 ? "flex justify-end" : ""}`}>
            <Reveal className="pointer-events-auto">
              <div className="glass max-w-sm p-8">
                <p className="eyebrow mb-4">
                  Interior <span className="text-aurex-glow">/ {b.n}</span>
                </p>
                <h3 className="display text-3xl text-pearl">{b.title}</h3>
                <p className="mt-4 text-sm font-light leading-relaxed text-mist">
                  {b.copy}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      ))}
    </section>
  );
}
