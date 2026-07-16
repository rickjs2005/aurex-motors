"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { world } from "@/lib/world";

/**
 * Intro sequence: wordmark → luminous beam sweep → the GT-1 drawn as a
 * glowing contour → the outline "gains volume" (glow + fill) → the veil
 * lifts and the real 3D car is already idling underneath.
 */
export default function Loader() {
  const [gone, setGone] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let canvasReady = false;
    let minTimeDone = false;
    let finished = false;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tryFinish = () => {
      if (finished || !canvasReady || !minTimeDone) return;
      finished = true;
      gsap.to(overlay.current, {
        yPercent: -100,
        duration: reduced ? 0.01 : 1.1,
        ease: "power4.inOut",
        onComplete: () => {
          world.introDone = true;
          window.dispatchEvent(new CustomEvent("aurex:intro-done"));
          setGone(true);
        },
      });
    };

    const onReady = () => {
      canvasReady = true;
      tryFinish();
    };
    window.addEventListener("aurex:ready", onReady);
    // in case the canvas mounted before us
    const fallback = window.setTimeout(onReady, 4000);

    const paths = svg.current?.querySelectorAll<SVGElement>("[data-draw]");
    const tl = gsap.timeline();

    if (reduced) {
      minTimeDone = true;
      tryFinish();
    } else {
      tl.fromTo(
        word.current,
        { opacity: 0, letterSpacing: "0.9em" },
        { opacity: 1, letterSpacing: "0.42em", duration: 1.1, ease: "power3.out" },
        0.15
      )
        .fromTo(
          tag.current,
          { opacity: 0, y: 8 },
          { opacity: 0.9, y: 0, duration: 0.7, ease: "power2.out" },
          0.7
        )
        .fromTo(
          paths ?? [],
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            duration: 1.9,
            ease: "power2.inOut",
            stagger: 0.12,
          },
          0.9
        )
        // the car gains volume: glow blooms, panels catch light
        .to(
          svg.current,
          { filter: "drop-shadow(0 0 26px rgba(225,6,0,0.55))", duration: 0.7 },
          ">-0.3"
        )
        .to(
          svg.current?.querySelectorAll("[data-fill]") ?? [],
          { fillOpacity: 0.16, duration: 0.7, ease: "power2.out" },
          "<"
        )
        .call(() => {
          minTimeDone = true;
          tryFinish();
        });
    }

    return () => {
      window.removeEventListener("aurex:ready", onReady);
      window.clearTimeout(fallback);
      tl.kill();
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-void"
    >
      {/* luminous beam sweeping the screen */}
      <div className="pointer-events-none absolute top-1/2 h-px w-[38vw] -translate-y-1/2 overflow-visible">
        <div className="loader-beam h-px w-full bg-gradient-to-r from-transparent via-aurex-glow to-transparent shadow-[0_0_18px_2px_rgba(225,6,0,0.6)]" />
      </div>

      <div
        ref={word}
        className="display text-[clamp(1.4rem,4vw,2.6rem)] tracking-[0.42em] text-pearl"
        style={{ opacity: 0 }}
      >
        AUREX&nbsp;MOTORS
      </div>
      <p
        ref={tag}
        className="eyebrow mt-4"
        style={{ opacity: 0 }}
      >
        Electric Gran Turismo
      </p>

      {/* the GT-1 contour */}
      <svg
        ref={svg}
        viewBox="0 0 640 250"
        className="mt-10 w-[min(78vw,560px)]"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="stroke-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e10600" />
            <stop offset="0.5" stopColor="#f4f4f6" />
            <stop offset="1" stopColor="#e10600" />
          </linearGradient>
        </defs>

        {/* body silhouette */}
        <path
          data-draw
          data-fill
          d="M 86 190
             C 70 186, 66 160, 84 146
             L 100 140
             C 150 106, 214 90, 276 88
             C 330 88, 362 102, 396 118
             C 458 130, 522 138, 560 150
             C 578 156, 582 168, 574 180
             L 548 190
             A 42 42 0 0 0 464 190
             L 218 190
             A 42 42 0 0 0 134 190
             Z"
          stroke="url(#stroke-g)"
          strokeWidth="2.4"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
          fill="#e10600"
          fillOpacity="0"
        />
        {/* canopy line */}
        <path
          data-draw
          d="M 210 130 C 250 104, 300 98, 344 112"
          stroke="rgba(244,244,246,0.7)"
          strokeWidth="1.6"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
        {/* wheels */}
        <circle
          data-draw
          cx="176"
          cy="190"
          r="34"
          stroke="url(#stroke-g)"
          strokeWidth="2.4"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
        <circle
          data-draw
          cx="506"
          cy="190"
          r="34"
          stroke="url(#stroke-g)"
          strokeWidth="2.4"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
        <circle
          data-draw
          cx="176"
          cy="190"
          r="12"
          stroke="rgba(244,244,246,0.5)"
          strokeWidth="1.4"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
        <circle
          data-draw
          cx="506"
          cy="190"
          r="12"
          stroke="rgba(244,244,246,0.5)"
          strokeWidth="1.4"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
        {/* light blade */}
        <path
          data-draw
          d="M 560 152 L 578 158"
          stroke="#fff"
          strokeWidth="3"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
      </svg>

      <p className="eyebrow absolute bottom-10 animate-[loader-pulse_1.6s_ease-in-out_infinite]">
        Rendering experience
      </p>
    </div>
  );
}
