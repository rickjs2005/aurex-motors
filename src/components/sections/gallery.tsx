"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import Car from "@/components/scene/car";
import { world, PAINTS } from "@/lib/world";

const SLOT = 7;

const VARIANTS = [
  { ...PAINTS[0], line: "GT-1 Launch Edition", spec: "1,080 hp · Turbine 22”" },
  { ...PAINTS[1], line: "GT-1 Graphite", spec: "1,080 hp · Aero twin-spoke" },
  { ...PAINTS[2], line: "GT-1 Glacier", spec: "980 hp · Long Range" },
  { ...PAINTS[3], line: "GT-1 Aurex Red", spec: "1,080 hp · Track Pack" },
] as const;

/* ---- the showroom line: all four cars in one canvas, camera pans ---- */

function ShowroomCars({ active }: { active: number }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    groups.current.forEach((g, i) => {
      if (g) g.rotation.y += dt * (i === active ? 0.32 : 0.14);
    });
  });
  return (
    <>
      {VARIANTS.map((v, i) => (
        <group key={v.name} position={[i * SLOT, 0, 0]}>
          {/* every slot gets its own light — one spot can't reach a 21m line */}
          <pointLight position={[1.6, 3.4, 2.6]} intensity={70} decay={1.7} color="#f2f4ff" />
          <pointLight position={[-2, 1.4, -2.4]} intensity={26} decay={1.7} color="#bcd6ff" />
          <group ref={(g) => void (groups.current[i] = g)}>
            <Car paint={v.hex} rimStyle={i % 2} ambient="#ff2e24" />
          </group>
        </group>
      ))}
    </>
  );
}

function ShowroomCamera() {
  const camera = useThree((s) => s.camera);
  const look = useRef(new THREE.Vector3());
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const k = 1 - Math.exp(-4 * dt);
    const x = world.t * SLOT * (VARIANTS.length - 1);
    camera.position.x += (x + 2.6 - camera.position.x) * k;
    camera.position.y += (1.15 - camera.position.y) * k;
    camera.position.z += (5.4 - camera.position.z) * k;
    look.current.set(x, 0.5, 0);
    camera.lookAt(look.current);
  });
  return null;
}

function ShowroomStage() {
  return (
    <>
      <color attach="background" args={["#07070a"]} />
      <fog attach="fog" args={["#07070a", 8, 22]} />
      <ambientLight intensity={0.25} />
      <spotLight position={[4, 6, 5]} angle={0.6} penumbra={1} decay={1.2} intensity={200} />
      <spotLight position={[-5, 4, -4]} angle={0.6} penumbra={1} decay={1.2} intensity={90} color="#bcd6ff" />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={3.5} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 1.4, 1]} />
        <Lightformer intensity={1.2} position={[-6, 2, 5]} scale={[5, 0.8, 1]} color="#cfe4ff" />
      </Environment>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 30]} />
        <meshStandardMaterial color="#08080b" roughness={0.35} metalness={0.7} />
      </mesh>
    </>
  );
}

/* ---- fullscreen experience for a single variant ---- */

function FullscreenCar({ index, onClose }: { index: number; onClose: () => void }) {
  const v = VARIANTS[index];

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-void"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [4.4, 1.3, 4.2], fov: 38 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ShowroomStage />
          <SpinningCar paint={v.hex} rim={index % 2} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-8 md:p-14">
        <div className="scrim-b absolute inset-0" />
        <div className="relative">
          <p className="eyebrow mb-2">{v.spec}</p>
          <h3 className="display text-4xl text-pearl md:text-6xl">{v.line}</h3>
        </div>
      </div>

      <button
        onClick={onClose}
        data-cursor="close"
        className="btn-ghost absolute right-6 top-6 z-10 !text-pearl md:right-12 md:top-8"
      >
        Close ✕
      </button>
    </motion.div>
  );
}

function SpinningCar({ paint, rim }: { paint: string; rim: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.3;
  });
  return (
    <group ref={g}>
      <Car paint={paint} rimStyle={rim} />
    </group>
  );
}

/* ---- section ---- */

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);

  // mount the canvas only when the section approaches
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setMounted(true),
      { rootMargin: "80% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // slide the HTML captions with scroll + track the focused car
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (track.current && world.scene === "gallery") {
        const x = world.t * (VARIANTS.length - 1) * 100;
        track.current.style.transform = `translate3d(${-x}vw, 0, 0)`;
        const idx = Math.round(world.t * (VARIANTS.length - 1));
        setActive((a) => (a === idx ? a : idx));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={section} id="gallery" data-scene="gallery" className="relative h-[380vh] bg-void">
      <div className="sticky top-0 h-screen overflow-hidden">
        {mounted && (
          <Canvas
            className="!absolute inset-0"
            dpr={[1, 1.6]}
            camera={{ position: [2.6, 1.15, 5.4], fov: 40 }}
            gl={{ antialias: true }}
          >
            <Suspense fallback={null}>
              <ShowroomStage />
              <ShowroomCars active={active} />
              <ShowroomCamera />
            </Suspense>
          </Canvas>
        )}

        {/* sliding captions */}
        <div
          ref={track}
          className="pointer-events-none absolute inset-0 flex will-change-transform"
        >
          {VARIANTS.map((v, i) => (
            <div key={v.name} className="flex w-screen shrink-0 items-end justify-between px-6 pb-20 md:px-12">
              <div>
                <p className="eyebrow mb-2">
                  The Collection <span className="text-aurex">/ 0{i + 1}</span>
                </p>
                <h3 className="display text-4xl text-pearl md:text-6xl">{v.line}</h3>
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-mist">{v.spec}</p>
              </div>
              <button
                onClick={() => setOpen(i)}
                data-cursor="enter"
                className="btn-primary pointer-events-auto hidden md:inline-flex"
              >
                Enter
              </button>
            </div>
          ))}
        </div>

        {/* header + progress */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-24 md:px-12">
          <p className="eyebrow">The Collection — four expressions of one idea</p>
          <div className="flex gap-2">
            {VARIANTS.map((v, i) => (
              <span
                key={v.name}
                className={`block h-1 w-8 rounded-full transition-colors duration-500 ${
                  i === active ? "bg-aurex" : "bg-pearl/15"
                }`}
              />
            ))}
          </div>
        </div>

        {/* mobile enter button — inside the sticky frame */}
        <button
          onClick={() => setOpen(active)}
          data-cursor="enter"
          className="btn-primary !absolute bottom-8 right-6 md:!hidden"
        >
          Enter
        </button>
      </div>

      <AnimatePresence>
        {open !== null && <FullscreenCar index={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}
