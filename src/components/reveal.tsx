"use client";

import { ReactNode, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** seconds */
  delay?: number;
  y?: number;
  /** fire once when entering (default) */
  start?: string;
}

/** scroll-triggered entrance — single fire, no scrub (scrubbed reveals
 *  strand elements half-invisible on odd viewports) */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 48,
  start = "top 82%",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const anim = gsap.fromTo(
      el,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration: 1.05,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start, toggleActions: "play none none none" },
      }
    );
    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, [delay, y, start]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

/** splits a headline into words and staggers them up from a mask */
export function RevealTitle({
  text,
  className,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const words = el.querySelectorAll<HTMLElement>("[data-word]");
    if (reduced) {
      words.forEach((w) => (w.style.transform = "none"));
      return;
    }

    // inline translateY(110%) parses into px-based `y` — tween that channel
    const anim = gsap.to(
      words,
      {
        y: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.07,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, [text]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden>
          <span data-word className="inline-block will-change-transform" style={{ transform: "translateY(110%)" }}>
            {w}
          </span>
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
