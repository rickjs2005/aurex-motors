export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-pearl/8 bg-void px-6 py-14 md:px-12">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="display text-lg tracking-[0.35em] text-pearl">
            AUREX<span className="ml-2 font-light text-mist">MOTORS</span>
          </p>
          <p className="mt-3 max-w-sm text-xs font-light leading-relaxed text-mist/70">
            AUREX MOTORS is a fictional brand. This experience is a concept
            study in cinematic web design. 3D car: Ferrari 458 Italia model
            from the three.js examples (MIT), rendered live in your browser.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {["Design", "Performance", "Interior", "Gallery", "Configure"].map(
            (l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="btn-ghost !text-[0.62rem]">
                {l}
              </a>
            )
          )}
        </nav>
      </div>

      <p className="mt-12 text-[0.62rem] uppercase tracking-[0.25em] text-mist/50">
        © 2026 Aurex Motors — a concept experience
      </p>
    </footer>
  );
}
