"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { world, SceneName } from "@/lib/world";

gsap.registerPlugin(ScrollTrigger);

/**
 * One ScrollTrigger per [data-scene] section writes (scene, local t)
 * into the shared world. The camera rig samples it every frame —
 * no React re-renders on scroll. Also mirrors the active scene onto
 * <html data-scene> so CSS can react (letterbox, canvas dimming).
 */
export default function SceneTracker() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scene]")
    );

    const triggers = sections.map((el) => {
      const name = el.dataset.scene as SceneName;
      // end at "bottom top" — adjacent sections hand off with no dead zone
      // (with "bottom bottom" the scene sticks for a full viewport between
      // sections and the canvas freezes/hides at the wrong moments)
      return ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          world.scene = name;
          world.t = self.progress;
          if (document.documentElement.dataset.scene !== name)
            document.documentElement.dataset.scene = name;
        },
      });
    });

    // initial state before any scroll
    if (sections.length) {
      document.documentElement.dataset.scene = sections[0].dataset.scene!;
    }

    return () => {
      triggers.forEach((t) => t.kill());
      delete document.documentElement.dataset.scene;
    };
  }, []);

  return (
    <>
      <div id="letterbox-top" />
      <div id="letterbox-bottom" />
    </>
  );
}
