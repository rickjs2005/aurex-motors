"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HEADLINE = "THE FUTURE HAS ARRIVED";

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const chars = el.querySelectorAll<HTMLElement>("[data-char]");
    const rest = el.querySelectorAll<HTMLElement>("[data-hero-rest]");

    const play = () => {
      if (reduced) {
        gsap.set([chars, rest], { opacity: 1, yPercent: 0, y: 0 });
        return;
      }
      gsap
        .timeline()
        // NOTE: the pre-JS state is an inline translateY(115%), which GSAP
        // parses into `y` in px — tween `y`, not yPercent, or nothing moves
        .to(chars, {
          y: 0,
          opacity: 1,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.035,
        })
        .to(
          rest,
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 },
          "-=0.55"
        );
    };

    if (typeof window !== "undefined" && (window as unknown as { __aurexIntroDone?: boolean }).__aurexIntroDone) {
      play();
    }
    const onDone = () => {
      (window as unknown as { __aurexIntroDone?: boolean }).__aurexIntroDone = true;
      play();
    };
    window.addEventListener("aurex:intro-done", onDone);

    // headline recedes as you scroll into the film
    let st: ScrollTrigger | undefined;
    if (!reduced && content.current) {
      const anim = gsap.to(content.current, {
        opacity: 0,
        y: -80,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "45% top",
          scrub: true,
        },
      });
      st = anim.scrollTrigger;
    }

    return () => {
      window.removeEventListener("aurex:intro-done", onDone);
      st?.kill();
    };
  }, []);

  const scrollToFilm = () => {
    document.querySelector("#film")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={root} id="top" data-scene="hero" className="relative h-[220vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-end">
        <div className="scrim-b pointer-events-none absolute inset-x-0 bottom-0 h-[55vh]" />

        <div ref={content} className="relative z-10 px-6 pb-16 md:px-12 md:pb-20">
          <p
            data-hero-rest
            className="eyebrow mb-5 translate-y-4 opacity-0"
          >
            Aurex GT-1 · All Electric
          </p>

          <h1
            className="display max-w-5xl text-[clamp(2.6rem,8.5vw,7.5rem)] text-pearl"
            aria-label={HEADLINE}
          >
            {HEADLINE.split(" ").map((word, wi) => (
              <span key={wi} className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom" aria-hidden>
                {word.split("").map((c, ci) => (
                  <span
                    key={ci}
                    data-char
                    className="inline-block opacity-0 will-change-transform"
                    style={{ transform: "translateY(115%)" }}
                  >
                    {c}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            data-hero-rest
            className="mt-6 max-w-md translate-y-4 text-base font-light text-mist opacity-0 md:text-lg"
          >
            Designed to redefine performance.
          </p>

          <div data-hero-rest className="mt-10 flex translate-y-4 items-center gap-8 opacity-0">
            <button onClick={scrollToFilm} className="btn-primary" data-cursor="scroll">
              Explore
            </button>
            <span className="hidden items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-mist/70 md:flex">
              <span className="block h-px w-10 bg-mist/40" />
              Scroll to begin the film
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
