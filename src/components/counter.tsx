"use client";

import { useEffect, useRef } from "react";

interface CounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

/** counts up when it enters the viewport — rAF, ease-out expo */
export default function Counter({
  value,
  decimals = 0,
  duration = 2.2,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fmt = (v: number) =>
      v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    if (reduced) {
      el.textContent = fmt(value);
      return;
    }

    let raf = 0;
    let fired = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || fired) return;
        fired = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / (duration * 1000), 1);
          const eased = 1 - Math.pow(2, -10 * p);
          el.textContent = fmt(value * (p === 1 ? 1 : eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
