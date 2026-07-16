"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * The car launches and vanishes; the screen falls to black and only
 * "Drive Tomorrow." remains.
 */
export default function Finale() {
  const root = useRef<HTMLElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const closing = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !veil.current || !closing.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      gsap.set(veil.current, { opacity: 1 });
      gsap.set(closing.current, { opacity: 1, y: 0 });
      return;
    }

    const veilAnim = gsap.fromTo(
      veil.current,
      { opacity: 0 },
      {
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "40% bottom",
          end: "75% bottom",
          scrub: true,
        },
      }
    );

    const closingAnim = gsap.fromTo(
      closing.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "70% bottom",
          end: "92% bottom",
          scrub: true,
        },
      }
    );

    return () => {
      veilAnim.scrollTrigger?.kill();
      veilAnim.kill();
      closingAnim.scrollTrigger?.kill();
      closingAnim.kill();
    };
  }, []);

  return (
    <section ref={root} id="finale" data-scene="finale" className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* blackout veil */}
        <div ref={veil} className="absolute inset-0 bg-black opacity-0" />

        <div ref={closing} className="relative z-10 px-6 text-center opacity-0">
          <p className="eyebrow mb-6">Aurex GT-1</p>
          <h2 className="display text-[clamp(2.8rem,8vw,7rem)] text-pearl">
            Drive Tomorrow<span className="text-aurex">.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-sm font-light leading-relaxed text-mist">
            First deliveries begin late 2026. Build yours, or take the wheel
            before you decide.
          </p>
          <a
            href="mailto:reserve@aurexmotors.com?subject=AUREX%20GT-1%20Test%20Drive"
            className="btn-primary mt-10"
            data-cursor="go"
          >
            Schedule a Test Drive
          </a>
        </div>
      </div>
    </section>
  );
}
