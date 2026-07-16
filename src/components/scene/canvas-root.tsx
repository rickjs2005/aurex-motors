"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import Car from "./car";
import Stage from "./stage";
import CameraRig from "./camera-rig";
import { world } from "@/lib/world";

/**
 * The fixed, full-viewport stage that everything scrolls over.
 * Pauses its render loop while the gallery (which has its own canvas)
 * covers the screen.
 */
export default function CanvasRoot() {
  const [paused, setPaused] = useState(false);
  // adaptive resolution: PerformanceMonitor walks this down on weak GPUs
  const [dpr, setDpr] = useState(1.5);
  const [profile, setProfile] = useState<{
    mobile: boolean;
    reduced: boolean;
  } | null>(null);

  useEffect(() => {
    const mobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 768;
    // ?snap: poses apply instantly (no damping) — used by visual tests,
    // where headless GL runs at ~1fps and damped cameras never arrive
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      new URLSearchParams(window.location.search).has("snap");
    world.quality.mobile = mobile;
    world.quality.reduced = reduced;
    setProfile({ mobile, reduced });

    const onMove = (e: PointerEvent) => {
      world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      world.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // pause the main loop while the gallery owns the screen
    let raf = 0;
    const watch = () => {
      setPaused((p) => {
        const next = world.scene === "gallery";
        return next === p ? p : next;
      });
      raf = requestAnimationFrame(watch);
    };
    raf = requestAnimationFrame(watch);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!profile) return <div id="main-canvas" className="fixed inset-0 z-0" />;

  const high = !profile.mobile;

  return (
    <div id="main-canvas" className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        frameloop={paused ? "never" : "always"}
        dpr={high ? dpr : [1, 1.25]}
        camera={{ position: [5.4, 1.35, 4.9], fov: 42, near: 0.1, far: 60 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={(state) => {
          // debug handle — lets tooling assert camera/world state
          (window as unknown as { __aurex?: object }).__aurex = {
            camera: state.camera,
            world,
          };
          window.dispatchEvent(new CustomEvent("aurex:ready"));
        }}
      >
        <Suspense fallback={null}>
          <PerformanceMonitor
            onDecline={() => setDpr(1)}
            onIncline={() => setDpr(1.5)}
          >
            <Stage quality={high ? "high" : "low"} />
            <Car live />
            <CameraRig />
            {high && !profile.reduced && (
              <EffectComposer>
                <Bloom
                  intensity={0.5}
                  luminanceThreshold={1.2}
                  mipmapBlur
                  radius={0.6}
                />
                <Vignette offset={0.26} darkness={0.82} />
              </EffectComposer>
            )}
          </PerformanceMonitor>
        </Suspense>
      </Canvas>
    </div>
  );
}
