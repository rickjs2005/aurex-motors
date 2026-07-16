"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#design", label: "Design" },
  { href: "#performance", label: "Performance" },
  { href: "#interior", label: "Interior" },
  { href: "#gallery", label: "Gallery" },
  { href: "#configure", label: "Configure" },
];

export default function Nav() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const show = () => setShown(true);
    if (typeof window !== "undefined" && window.location.hash) show();
    window.addEventListener("aurex:intro-done", show);
    return () => window.removeEventListener("aurex:intro-done", show);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[70] flex items-center justify-between px-6 py-5 transition-all duration-1000 md:px-12 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      <a href="#top" className="display text-sm tracking-[0.35em] text-pearl">
        AUREX<span className="ml-2 font-light text-mist">MOTORS</span>
      </a>

      <nav className="hidden items-center gap-8 lg:flex">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="btn-ghost !text-[0.62rem]">
            {l.label}
          </a>
        ))}
      </nav>

      <a href="#finale" className="btn-primary !px-5 !py-2.5 !text-[0.6rem]">
        Test Drive
      </a>
    </header>
  );
}
