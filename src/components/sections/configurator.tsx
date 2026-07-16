"use client";

import { useState } from "react";
import { world, PAINTS, AMBIENTS, CarConfig, RimStyle } from "@/lib/world";
import Reveal from "@/components/reveal";

const BASE_PRICE = 248_000;
const PAINT_PRICE = [0, 1_200, 3_400, 5_600];
const RIM_PRICE = [0, 4_800];
const GLOW_PRICE = 1_900;

/**
 * The panel writes straight into world.config; the live car in the main
 * canvas lerps its materials toward it every frame — changes feel liquid,
 * no re-render of the 3D tree.
 */
export default function Configurator() {
  const [cfg, setCfg] = useState<CarConfig>({ ...world.config });

  const update = (patch: Partial<CarConfig>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    Object.assign(world.config, next);
  };

  const paintIdx = Math.max(0, PAINTS.findIndex((p) => p.hex === cfg.color));
  const ambientIdx = Math.max(0, AMBIENTS.findIndex((a) => a.hex === cfg.ambient));
  const price =
    BASE_PRICE +
    PAINT_PRICE[paintIdx] +
    RIM_PRICE[cfg.rim] +
    (cfg.glow ? GLOW_PRICE : 0);

  return (
    <section id="configure" data-scene="config" className="relative h-[240vh]">
      <div className="pointer-events-none sticky top-0 flex h-screen items-center">
        <div className="w-full px-6 md:px-12">
          <Reveal className="pointer-events-auto">
            <div className="glass w-full max-w-sm p-8">
              <p className="eyebrow mb-1">Configurator</p>
              <h3 className="display text-3xl text-pearl">Build your GT-1</h3>

              {/* paint */}
              <p className="mt-8 mb-3 text-[0.62rem] uppercase tracking-[0.3em] text-mist">
                Paint — {PAINTS[paintIdx].name}
              </p>
              <div className="flex gap-3">
                {PAINTS.map((p) => (
                  <button
                    key={p.hex}
                    className="swatch"
                    style={{ background: p.hex }}
                    data-active={cfg.color === p.hex}
                    aria-label={p.name}
                    onClick={() => update({ color: p.hex })}
                  />
                ))}
              </div>

              {/* rims */}
              <p className="mt-7 mb-3 text-[0.62rem] uppercase tracking-[0.3em] text-mist">
                Wheels
              </p>
              <div className="flex gap-3">
                {(["Turbine 22”", "Aero 22”"] as const).map((label, i) => (
                  <button
                    key={label}
                    onClick={() => update({ rim: i as RimStyle })}
                    className={`border px-4 py-2 text-[0.62rem] uppercase tracking-[0.22em] transition-colors duration-300 ${
                      cfg.rim === i
                        ? "border-aurex text-pearl"
                        : "border-pearl/15 text-mist hover:border-pearl/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ambient */}
              <p className="mt-7 mb-3 text-[0.62rem] uppercase tracking-[0.3em] text-mist">
                Cabin light — {AMBIENTS[ambientIdx].name}
              </p>
              <div className="flex gap-3">
                {AMBIENTS.map((a) => (
                  <button
                    key={a.hex}
                    className="swatch !h-8 !w-8"
                    style={{ background: a.hex, boxShadow: `0 0 14px ${a.hex}55` }}
                    data-active={cfg.ambient === a.hex}
                    aria-label={a.name}
                    onClick={() => update({ ambient: a.hex })}
                  />
                ))}
              </div>

              {/* glow */}
              <button
                onClick={() => update({ glow: !cfg.glow })}
                className={`mt-7 flex w-full items-center justify-between border px-4 py-3 text-[0.62rem] uppercase tracking-[0.22em] transition-colors duration-300 ${
                  cfg.glow
                    ? "border-aurex text-pearl"
                    : "border-pearl/15 text-mist hover:border-pearl/40"
                }`}
              >
                Underglow signature
                <span
                  className={`ml-4 block h-2 w-2 rounded-full transition-all duration-300 ${
                    cfg.glow ? "bg-aurex shadow-[0_0_10px_2px_rgba(225,6,0,0.7)]" : "bg-pearl/20"
                  }`}
                />
              </button>

              {/* price */}
              <div className="mt-8 flex items-end justify-between border-t border-pearl/10 pt-6">
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-mist">
                    Estimated
                  </p>
                  <p className="display mt-1 text-2xl text-pearl">
                    ${price.toLocaleString("en-US")}
                  </p>
                </div>
                <a
                  href="#finale"
                  className="btn-ghost !text-[0.6rem] !text-aurex-glow"
                >
                  Reserve →
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
