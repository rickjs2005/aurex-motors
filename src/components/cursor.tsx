"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor: a red dot and a trailing ring. The ring morphs and
 * grows a label over interactive targets ([data-cursor="..."], links,
 * buttons). Fine pointers only.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("aurex-cursor");
    // the divs render unconditionally (SSR) — only reveal them here,
    // otherwise touch devices show them parked at the top-left corner
    if (dot.current) dot.current.style.opacity = "1";
    if (ring.current) ring.current.style.opacity = "1";

    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let scale = 1;
    let targetScale = 1;
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    };

    const onOver = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>(
        "a, button, [data-cursor]"
      );
      const kind = t?.dataset.cursor;
      if (kind && label.current) {
        label.current.textContent = kind;
        targetScale = 3.2;
      } else if (t) {
        if (label.current) label.current.textContent = "";
        targetScale = 1.9;
      } else {
        if (label.current) label.current.textContent = "";
        targetScale = 1;
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const k = 1 - Math.exp(-14 * dt);
      ringPos.x += (pos.x - ringPos.x) * k;
      ringPos.y += (pos.y - ringPos.y) * k;
      scale += (targetScale - scale) * k;

      if (dot.current)
        dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%,-50%)`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%,-50%) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      document.documentElement.classList.remove("aurex-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-aurex opacity-0"
        aria-hidden
      />
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[100] flex h-9 w-9 items-center justify-center rounded-full border border-pearl/40 opacity-0 mix-blend-difference"
        aria-hidden
      >
        <span
          ref={label}
          className="text-[5px] font-medium uppercase tracking-[0.2em] text-pearl"
        />
      </div>
    </>
  );
}
