"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { world } from "@/lib/world";

/* ---------------------------------------------------------------------- */
/* The AUREX GT-1 rides on the Ferrari 458 Italia model that ships with    */
/* the three.js examples (draco-compressed GLB, full interior). We clone   */
/* the scene per instance and rebind its materials to the AUREX brand:     */
/* configurable paint, red accents, emissive light signature.              */
/*                                                                         */
/* Model space: nose at -z, ground y=0, wheels spin around local x.        */
/* The wrapper group rotates it nose-first onto +x, matching the film      */
/* script in lib/scenes.ts.                                                */
/* ---------------------------------------------------------------------- */

const MODEL = "/models/ferrari-opt.glb";
const DRACO = "/draco/";

useGLTF.preload(MODEL, DRACO);

export interface CarProps {
  /** live mode couples the car to world.goal + world.config */
  live?: boolean;
  paint?: string;
  rimStyle?: number;
  ambient?: string;
  glow?: boolean;
}

interface Rig {
  root: THREE.Group;
  body: THREE.MeshPhysicalMaterial;
  rims: THREE.MeshStandardMaterial;
  head: THREE.MeshStandardMaterial;
  led: THREE.MeshStandardMaterial;
  tail: THREE.MeshStandardMaterial;
  wheels: THREE.Object3D[];
  strips: THREE.MeshStandardMaterial;
}

function buildRig(template: THREE.Group): Rig {
  const root = template.clone(true);

  const body = new THREE.MeshPhysicalMaterial({
    color: "#0d0d12",
    metalness: 0.9,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.25,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#11151b",
    metalness: 0.2,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.6,
    transparent: true,
    opacity: 0.86,
  });
  const head = new THREE.MeshStandardMaterial({
    color: "#cfe4f4",
    emissive: "#dff1ff",
    emissiveIntensity: 0.4,
    metalness: 0.6,
    roughness: 0.2,
    toneMapped: false,
  });
  const led = new THREE.MeshStandardMaterial({
    color: "#dfe8ee",
    emissive: "#eaf6ff",
    emissiveIntensity: 0.3,
    roughness: 0.3,
    toneMapped: false,
  });
  const tail = new THREE.MeshStandardMaterial({
    color: "#3a0a08",
    emissive: "#ff1408",
    emissiveIntensity: 0.2,
    roughness: 0.3,
    toneMapped: false,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: "#b30d10",
    metalness: 0.4,
    roughness: 0.35,
  });
  const rims = new THREE.MeshStandardMaterial({
    color: "#c8cad1",
    metalness: 1,
    roughness: 0.3,
  });
  const dark = new THREE.MeshStandardMaterial({ color: "#0a0a0c", roughness: 0.9 });
  // the source model's grays are studio-bright — pull everything toward
  // the AUREX dark cabin: black leather, red piping, gunmetal hardware
  const gunmetal = new THREE.MeshStandardMaterial({
    color: "#26282e",
    metalness: 0.9,
    roughness: 0.5,
  });
  // "chrome" carries the grilles and badges — satin dark metal reads
  // stealth instead of showroom silver
  const satin = new THREE.MeshStandardMaterial({
    color: "#585c66",
    metalness: 1,
    roughness: 0.38,
  });
  const plastic = new THREE.MeshStandardMaterial({ color: "#232529", roughness: 0.7 });
  const tires = new THREE.MeshStandardMaterial({
    color: "#0a0a0b",
    roughness: 1,
    envMapIntensity: 0.2,
  });
  const leather = new THREE.MeshStandardMaterial({ color: "#17181c", roughness: 0.8 });
  const leatherRed = new THREE.MeshStandardMaterial({ color: "#7d0e13", roughness: 0.7 });
  const interiorLight = new THREE.MeshStandardMaterial({ color: "#222429", roughness: 0.75 });
  const carpet = new THREE.MeshStandardMaterial({ color: "#0b0b0d", roughness: 1 });

  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = false;
    o.receiveShadow = false;
    const name = (o.material as THREE.Material)?.name;
    switch (name) {
      case "Body_Color":
        o.material = body;
        break;
      case "Glass_Gray":
        o.material = glass;
        break;
      case "Projector_Glass":
        o.material = head;
        break;
      case "Turn_Signal_LED":
        o.material = led;
        break;
      case "Taillight_Glass":
        o.material = tail;
        break;
      case "Ferrari_Yellow":
        o.material = accent;
        break;
      case "_0098_DodgerBlue":
        o.material = dark;
        break;
      case "metal_gray":
        o.material = gunmetal;
        break;
      case "plastic_gray":
        o.material = plastic;
        break;
      case "Tires":
        o.material = tires;
        break;
      case "Leather":
        o.material = leather;
        break;
      case "Leather_red":
        o.material = leatherRed;
        break;
      case "Interior_light":
      case "Interior_dark":
        o.material = interiorLight;
        break;
      case "Carpet":
        o.material = carpet;
        break;
      case "metal_chrome":
        o.material = satin;
        break;
      case "Carbon_Fiber":
        o.material = leather;
        break;
      default:
        break;
    }
  });

  // the four wheel groups spin; their rim meshes get a per-instance finish
  const wheels: THREE.Object3D[] = [];
  for (const suffix of ["fl", "fr", "rl", "rr"]) {
    const w = root.getObjectByName(`wheel_${suffix}`);
    if (!w) continue;
    wheels.push(w);
    w.traverse((o) => {
      if (o instanceof THREE.Mesh && /^(rim_|wheel)/.test(o.name)) {
        o.material = rims;
      }
    });
  }

  // AUREX cabin light — slim LED strips hugging the door tops
  const strips = new THREE.MeshStandardMaterial({
    color: "#050505",
    emissive: "#ff2e24",
    emissiveIntensity: 1,
    toneMapped: false,
  });
  const doorGeo = new THREE.BoxGeometry(0.01, 0.01, 0.7);
  for (const x of [-0.86, 0.86]) {
    const strip = new THREE.Mesh(doorGeo, strips);
    strip.position.set(x, 0.72, 0.15);
    root.add(strip);
  }

  return { root, body, rims, head, led, tail, wheels, strips };
}

export default function Car({
  live = false,
  paint = "#0d0d12",
  rimStyle = 0,
  ambient = "#ff2e24",
  glow = false,
}: CarProps) {
  const { scene: template } = useGLTF(MODEL, DRACO);

  const outer = useRef<THREE.Group>(null);
  const glowLight = useRef<THREE.PointLight>(null);

  const rig = useMemo(() => buildRig(template), [template]);

  const targetColor = useMemo(() => new THREE.Color(paint), [paint]);
  const targetAmbient = useMemo(() => new THREE.Color(ambient), [ambient]);
  const targetRim = useMemo(() => new THREE.Color(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const g = outer.current;
    if (!g) return;

    const cfg = live ? world.config : { color: paint, rim: rimStyle, ambient, glow };
    const goal = live
      ? world.goal
      : { rotY: g.rotation.y, carX: 0, spin: 0, head: 1, tail: 1, cabin: 0.5 };

    const k = live && world.quality.reduced ? 1 : 1 - Math.exp(-4.5 * dt);

    if (live) {
      g.rotation.y += (goal.rotY - g.rotation.y) * k;
      g.position.x +=
        (goal.carX - g.position.x) *
        (world.quality.reduced ? 1 : 1 - Math.exp(-2.8 * dt));
    }

    // paint — lerped so configurator changes feel liquid
    targetColor.set(cfg.color);
    rig.body.color.lerp(targetColor, k);

    // rim finish: 0 polished, 1 satin black
    targetRim.set(cfg.rim === 0 ? "#c8cad1" : "#22242a");
    rig.rims.color.lerp(targetRim, k);

    // light signature
    rig.head.emissiveIntensity += (goal.head * 3.4 - rig.head.emissiveIntensity) * k;
    rig.led.emissiveIntensity += (goal.head * 1.6 - rig.led.emissiveIntensity) * k;
    rig.tail.emissiveIntensity += (goal.tail * 3.2 - rig.tail.emissiveIntensity) * k;

    // cabin
    targetAmbient.set(cfg.ambient);
    rig.strips.emissive.lerp(targetAmbient, k);
    rig.strips.emissiveIntensity +=
      (Math.max(goal.cabin, 0.15) * 1.15 - rig.strips.emissiveIntensity) * k;

    if (glowLight.current) {
      glowLight.current.color.lerp(targetAmbient, k);
      glowLight.current.intensity +=
        ((cfg.glow ? 14 : 0) - glowLight.current.intensity) * k;
    }

    // wheels spin around their local x (model axle)
    const spin = live ? goal.spin : 0;
    for (const w of rig.wheels) w.rotation.x += spin * dt;
  });

  return (
    <group ref={outer}>
      {/* nose -z → +x, sized to the film script's 4.7m stage */}
      <group rotation={[0, -Math.PI / 2, 0]} scale={1.04}>
        <primitive object={rig.root} />
      </group>

      {/* soft contact shadow */}
      <ShadowBlob />

      {/* underglow */}
      <pointLight
        ref={glowLight}
        position={[0, 0.12, 0]}
        intensity={0}
        distance={3.5}
        decay={1.8}
        color="#ff2e24"
      />
    </group>
  );
}

function ShadowBlob() {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 126);
    g.addColorStop(0, "rgba(0,0,0,0.85)");
    g.addColorStop(0.65, "rgba(0,0,0,0.4)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  if (!tex) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <planeGeometry args={[5.2, 2.5]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}
