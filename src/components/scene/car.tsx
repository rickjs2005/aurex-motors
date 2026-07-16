"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { world } from "@/lib/world";

/* ---------------------------------------------------------------------- */
/* Geometry — the AUREX GT-1 is built entirely from code.                  */
/*                                                                         */
/* The monocoque is an extruded side-profile with REAL wheel-arch cutouts  */
/* in the outline (the bevel wraps the arch edge into a fender lip). The   */
/* slab-sides are then killed by warping the vertices after extrusion:     */
/* plan taper (nose/tail pull inward) × tumblehome (sides curve in at the  */
/* rocker and above the shoulder). mergeVertices before the normals pass   */
/* turns the extrusion's flat facets into smooth automotive surfacing.     */
/* ---------------------------------------------------------------------- */

const WHEEL = { x: 1.45, y: 0.33, r: 0.325, arch: 0.4, z: 0.62 };

const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** plan-view half-width factor along the length */
const planTaper = (x: number) =>
  1 - 0.2 * ss(1.05, 2.36, x) - 0.12 * ss(1.5, 2.4, -x);

/** side-view tuck: pinched rocker, gentle tumblehome above the shoulder */
const tumblehome = (y: number) =>
  (0.88 + 0.12 * ss(0.14, 0.42, y)) * (1 - 0.13 * ss(0.58, 0.84, y));

function warp(
  geo: THREE.BufferGeometry,
  fn: (x: number, y: number) => number
) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, pos.getZ(i) * fn(pos.getX(i), pos.getY(i)));
  }
  pos.needsUpdate = true;
}

/** carve a wheel arch into the bottom outline (drawn rear→front) */
function archCut(s: THREE.Shape, cx: number, baseY: number) {
  const dy = baseY - WHEEL.y;
  const dx = Math.sqrt(WHEEL.arch * WHEEL.arch - dy * dy);
  s.lineTo(cx - dx, baseY);
  s.absarc(cx, WHEEL.y, WHEEL.arch, Math.atan2(dy, -dx), Math.atan2(dy, dx), true);
}

function finish(geo: THREE.ExtrudeGeometry, halfDepth: number, fn: (x: number, y: number) => number) {
  geo.translate(0, 0, -halfDepth);
  warp(geo, fn);
  // extrusions are non-indexed → flat shading; weld first, then smooth
  const merged = mergeVertices(geo, 1e-4);
  merged.computeVertexNormals();
  return merged;
}

function useBodyGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    // top line, nose → tail (beltline only; the canopy is separate)
    s.moveTo(2.35, 0.4);
    s.quadraticCurveTo(2.36, 0.52, 2.15, 0.56);
    s.quadraticCurveTo(1.6, 0.62, 1.05, 0.68);
    s.quadraticCurveTo(0.75, 0.72, 0.5, 0.76);
    s.quadraticCurveTo(-0.5, 0.82, -1.35, 0.8);
    s.quadraticCurveTo(-1.95, 0.78, -2.24, 0.66);
    s.lineTo(-2.34, 0.6);
    // tail, down
    s.lineTo(-2.36, 0.3);
    // bottom line, tail → nose, with real arch cutouts
    s.quadraticCurveTo(-2.15, 0.21, -2.0, 0.19);
    archCut(s, -WHEEL.x, 0.18);
    archCut(s, WHEEL.x, 0.18);
    s.quadraticCurveTo(2.2, 0.2, 2.32, 0.3);
    s.closePath();

    // deep walls + shallow bevel: the flat door region carries real width
    // so the tires don't dwarf the body. steps matter: the taper/tumblehome
    // warp can only bend where vertices exist — without them the hood
    // highlight renders as a staircase.
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 1.3,
      steps: 10,
      bevelEnabled: true,
      bevelThickness: 0.18,
      bevelSize: 0.08,
      bevelSegments: 10,
      curveSegments: 36,
    });
    return finish(geo, 0.65, (x, y) => planTaper(x) * tumblehome(y));
  }, []);
}

function useCanopyGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.66, 0.74);
    s.quadraticCurveTo(0.3, 1.06, 0.02, 1.12);
    s.quadraticCurveTo(-0.72, 1.1, -1.5, 0.77);
    s.lineTo(-1.25, 0.74);
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.78,
      steps: 6,
      bevelEnabled: true,
      bevelThickness: 0.13,
      bevelSize: 0.05,
      bevelSegments: 7,
      curveSegments: 28,
    });
    // strong DLO taper toward the roof + boat-tail toward the rear glass
    return finish(
      geo,
      0.39,
      (x, y) => (1 - 0.3 * ss(0.76, 1.14, y)) * (1 - 0.16 * ss(0.5, 1.6, -x))
    );
  }, []);
}

/* ---------------------------------------------------------------------- */

const DARK = new THREE.Color("#0a0a0c");

interface WheelProps {
  x: number;
  z: number;
  rimStyle: number;
  registry: React.MutableRefObject<THREE.Group[]>;
}

function Wheel({ x, z, rimStyle, registry }: WheelProps) {
  const spinRef = useRef<THREE.Group>(null);
  /** which way the wheel face points */
  const side = Math.sign(z);

  const blades = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);
  const spokes = useMemo(() => Array.from({ length: 5 }, (_, i) => i), []);

  const R = WHEEL.r; // tread radius

  return (
    <group
      position={[x, WHEEL.y + 0.02, z]}
      // a whisper of negative camber — top of the wheel leans into the body
      rotation={[-side * 0.045, 0, 0]}
      ref={(g) => {
        if (g && spinRef.current && !registry.current.includes(spinRef.current))
          registry.current.push(spinRef.current);
      }}
    >
      {/* arch liner — covers the body-coloured arch tunnel from inside
          (radius just under the cutout or it pokes through the fender) */}
      {/* basic material: a wheel well is a black hole — it must not react
          to the studio key light at all */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -side * 0.22]}>
        <cylinderGeometry args={[0.39, 0.39, 0.6, 28, 1, true]} />
        <meshBasicMaterial color="#050507" side={THREE.DoubleSide} />
      </mesh>

      <group ref={spinRef}>
        {/* tread band — rubber must swallow light, not bounce the studio */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R, R, 0.15, 48]} />
          <meshStandardMaterial color="#050506" roughness={1} envMapIntensity={0.18} />
        </mesh>
        {/* sidewall shoulders — hug the tread so the profile stays low */}
        {[-0.075, 0.075].map((o) => (
          <mesh key={o} position={[0, 0, o]}>
            <torusGeometry args={[R - 0.03, 0.042, 14, 48]} />
            <meshStandardMaterial color="#050506" roughness={1} envMapIntensity={0.18} />
          </mesh>
        ))}
        {/* thin sidewall ring BEHIND the rim face — never in front of it */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[R - 0.045, R - 0.045, 0.13, 48]} />
          <meshStandardMaterial color="#040405" roughness={1} envMapIntensity={0.15} />
        </mesh>

        {/* rim — 80% of the tire diameter (low-profile), deep dish */}
        <group position={[0, 0, side * 0.115]}>
          {/* outer lip */}
          <mesh>
            <torusGeometry args={[0.26, 0.016, 12, 48]} />
            <meshStandardMaterial color="#babdc4" metalness={1} roughness={0.22} />
          </mesh>
          {/* barrel — recessed, gives the dish its depth */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -side * 0.055]}>
            <cylinderGeometry args={[0.25, 0.25, 0.11, 48, 1, true]} />
            <meshStandardMaterial
              color="#131418"
              metalness={0.9}
              roughness={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -side * 0.1]}>
            <cylinderGeometry args={[0.25, 0.25, 0.015, 48]} />
            <meshStandardMaterial color="#0d0e11" metalness={0.85} roughness={0.5} />
          </mesh>
          {/* center cap */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.05, 0.05, 20]} />
            <meshStandardMaterial color="#d6d8de" metalness={1} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0, side * 0.027]}>
            <boxGeometry args={[0.018, 0.018, 0.005]} />
            <meshStandardMaterial
              color="#2a0503"
              emissive="#e10600"
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>

          {/* rim style 0 — turbine: twisted blades from hub to lip */}
          <group name="rim-0" visible={rimStyle === 0}>
            {blades.map((i) => (
              <group key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]}>
                <mesh
                  position={[0.15, 0, -side * 0.015]}
                  rotation={[side * 0.5, 0, 0.08]}
                >
                  <boxGeometry args={[0.21, 0.052, 0.022]} />
                  <meshStandardMaterial
                    color="#6a6d75"
                    metalness={1}
                    roughness={0.3}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* rim style 1 — aero twin-spoke, machined edge */}
          <group name="rim-1" visible={rimStyle === 1}>
            {spokes.map((i) => (
              <group key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
                {[-0.026, 0.026].map((oy) => (
                  <mesh key={oy} position={[0.15, oy, -side * 0.01]} rotation={[0, 0, oy * 2]}>
                    <boxGeometry args={[0.21, 0.024, 0.02]} />
                    <meshStandardMaterial
                      color="#33353c"
                      metalness={0.95}
                      roughness={0.3}
                    />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        </group>

        {/* brake disc — inboard of the rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.02]}>
          <cylinderGeometry args={[0.19, 0.19, 0.024, 36]} />
          <meshStandardMaterial color="#5d5f66" metalness={1} roughness={0.4} />
        </mesh>
      </group>

      {/* caliper — fixed, does not spin */}
      <mesh position={[0.09, 0.09, side * 0.045]} rotation={[0, 0, 0.75]}>
        <boxGeometry args={[0.12, 0.07, 0.045]} />
        <meshStandardMaterial color="#e10600" roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------------- */

export interface CarProps {
  /** live mode couples the car to world.goal + world.config */
  live?: boolean;
  paint?: string;
  rimStyle?: number;
  ambient?: string;
  glow?: boolean;
}

export default function Car({
  live = false,
  paint = "#0d0d12",
  rimStyle = 0,
  ambient = "#ff2e24",
  glow = false,
}: CarProps) {
  const bodyGeo = useBodyGeometry();
  const canopyGeo = useCanopyGeometry();

  const root = useRef<THREE.Group>(null);
  const bodyMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const headMat = useRef<THREE.MeshStandardMaterial>(null);
  const tailMat = useRef<THREE.MeshStandardMaterial>(null);
  const screenMat = useRef<THREE.MeshStandardMaterial>(null);
  const ambientMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const glowLight = useRef<THREE.PointLight>(null);
  const wheels = useRef<THREE.Group[]>([]);

  const targetColor = useMemo(() => new THREE.Color(paint), [paint]);
  const targetAmbient = useMemo(() => new THREE.Color(ambient), [ambient]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const g = root.current;
    if (!g) return;

    const cfg = live ? world.config : { color: paint, rim: rimStyle, ambient, glow };
    const goal = live
      ? world.goal
      : { rotY: g.rotation.y, carX: 0, spin: 0, head: 1, tail: 1, cabin: 0.5 };

    const k = live && world.quality.reduced ? 1 : 1 - Math.exp(-4.5 * dt);

    if (live) {
      g.rotation.y += (goal.rotY - g.rotation.y) * k;
      g.position.x += (goal.carX - g.position.x) * (1 - Math.exp(-2.8 * dt));
    }

    // paint — lerped so configurator changes feel liquid
    if (bodyMat.current) {
      targetColor.set(cfg.color);
      bodyMat.current.color.lerp(targetColor, k);
    }

    // lights
    if (headMat.current)
      headMat.current.emissiveIntensity +=
        (goal.head * 4.2 - headMat.current.emissiveIntensity) * k;
    if (tailMat.current)
      tailMat.current.emissiveIntensity +=
        (goal.tail * 5 - tailMat.current.emissiveIntensity) * k;
    // stay under the bloom threshold (1.2) — inside the cabin the camera
    // gets close enough that anything hotter whites out the frame
    if (screenMat.current)
      screenMat.current.emissiveIntensity +=
        (goal.cabin * 1.05 - screenMat.current.emissiveIntensity) * k;

    targetAmbient.set(cfg.ambient);
    for (const m of ambientMats.current) {
      m.emissive.lerp(targetAmbient, k);
      m.emissiveIntensity += (goal.cabin * 1.5 - m.emissiveIntensity) * k;
    }

    if (glowLight.current) {
      glowLight.current.color.lerp(targetAmbient, k);
      glowLight.current.intensity +=
        ((cfg.glow ? 14 : 0) - glowLight.current.intensity) * k;
    }

    // wheels
    const spin = live ? goal.spin : 0;
    for (const w of wheels.current) w.rotation.z -= spin * dt;

    // rim style switch
    if (live) {
      for (const w of wheels.current) {
        const r0 = w.getObjectByName("rim-0");
        const r1 = w.getObjectByName("rim-1");
        if (r0) r0.visible = cfg.rim === 0;
        if (r1) r1.visible = cfg.rim === 1;
      }
    }
  });

  const pushAmbient = (m: THREE.MeshStandardMaterial | null) => {
    if (m && !ambientMats.current.includes(m)) ambientMats.current.push(m);
  };

  return (
    <group ref={root}>
      {/* body */}
      <mesh geometry={bodyGeo} castShadow>
        <meshPhysicalMaterial
          ref={bodyMat}
          color={paint}
          metalness={0.88}
          roughness={0.26}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.3}
        />
      </mesh>

      {/* glass canopy — keep reflections tame or the overhead softbox
          blooms into a supernova */}
      <mesh geometry={canopyGeo}>
        <meshPhysicalMaterial
          color="#07090c"
          metalness={0.2}
          roughness={0.14}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={0.55}
        />
      </mesh>

      {/* ---- front fascia ---- */}
      {/* gloss black panel — the "grille" of an EV */}
      <mesh position={[2.29, 0.32, 0]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[0.05, 0.2, 0.9]} />
        <meshPhysicalMaterial
          color="#050608"
          metalness={0.4}
          roughness={0.12}
          clearcoat={1}
        />
      </mesh>
      {/* tech dot matrix */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[2.315, 0.32, -0.36 + i * 0.09]}>
          <boxGeometry args={[0.012, 0.02, 0.02]} />
          <meshStandardMaterial
            color="#1a0505"
            emissive="#e10600"
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}

      {/* headlight housing — recessed dark glass the blade lives in */}
      <mesh position={[2.265, 0.52, 0]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.04, 0.09, 1.14]} />
        <meshPhysicalMaterial color="#030507" metalness={0.3} roughness={0.15} clearcoat={1} />
      </mesh>
      {/* light blade */}
      <mesh position={[2.285, 0.52, 0]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.02, 0.04, 1.08]} />
        <meshStandardMaterial
          ref={headMat}
          color="#e8f4ff"
          emissive="#dff1ff"
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </mesh>
      {/* DRL fangs */}
      {[-0.42, 0.42].map((z) => (
        <mesh key={z} position={[2.26, 0.44, z]} rotation={[0.15 * Math.sign(z), 0, 0]}>
          <boxGeometry args={[0.03, 0.13, 0.026]} />
          <meshStandardMaterial
            color="#e8f4ff"
            emissive="#dff1ff"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ---- tail — gloss panel housing the full-width bar ---- */}
      <mesh position={[-2.34, 0.55, 0]}>
        <boxGeometry args={[0.03, 0.15, 1.3]} />
        <meshPhysicalMaterial color="#040507" metalness={0.3} roughness={0.14} clearcoat={1} />
      </mesh>
      <mesh position={[-2.372, 0.56, 0]}>
        <boxGeometry args={[0.02, 0.045, 1.24]} />
        <meshStandardMaterial
          ref={tailMat}
          color="#2a0503"
          emissive="#ff1408"
          emissiveIntensity={0.2}
          toneMapped={false}
        />
      </mesh>

      {/* ---- aero (kept tucked and matte — bright trays under the nose
           read as floating shelves) ---- */}
      <mesh position={[2.05, 0.08, 0]}>
        <boxGeometry args={[0.38, 0.035, 1.05]} />
        <meshStandardMaterial color="#060608" roughness={1} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[-1.95, 0.1, 0]}>
        <boxGeometry args={[0.4, 0.04, 1.34]} />
        <meshStandardMaterial color="#060608" roughness={1} envMapIntensity={0.2} />
      </mesh>
      {[-0.42, -0.14, 0.14, 0.42].map((z) => (
        <mesh key={z} position={[-2.1, 0.15, z]}>
          <boxGeometry args={[0.26, 0.08, 0.02]} />
          <meshStandardMaterial color="#060608" roughness={1} envMapIntensity={0.2} />
        </mesh>
      ))}
      {/* side skirts — between the arches only */}
      {[-0.6, 0.6].map((z) => (
        <mesh key={z} position={[0, 0.15, z]}>
          <boxGeometry args={[2.0, 0.07, 0.05]} />
          <meshStandardMaterial color={DARK} roughness={1} envMapIntensity={0.2} />
        </mesh>
      ))}

      {/* ---- panel lines & flush handles (sell the closeups) ---- */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* door shutlines, tilted to follow the tumblehome */}
          <mesh position={[0.52, 0.48, side * 0.652]} rotation={[-side * 0.1, 0, 0.06]}>
            <boxGeometry args={[0.007, 0.52, 0.012]} />
            <meshStandardMaterial color="#050507" roughness={1} />
          </mesh>
          <mesh position={[-0.85, 0.48, side * 0.652]} rotation={[-side * 0.1, 0, -0.05]}>
            <boxGeometry args={[0.007, 0.52, 0.012]} />
            <meshStandardMaterial color="#050507" roughness={1} />
          </mesh>
          {/* flush door handle */}
          <mesh position={[0.18, 0.64, side * 0.657]}>
            <boxGeometry args={[0.2, 0.024, 0.012]} />
            <meshStandardMaterial color="#3c3f45" metalness={1} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* mirrors — stalk actually reaches the shoulder */}
      {[-0.68, 0.68].map((z) => (
        <group key={z} position={[0.62, 0.77, z]}>
          <mesh>
            <boxGeometry args={[0.11, 0.045, 0.07]} />
            <meshPhysicalMaterial
              color="#0d0d12"
              metalness={0.85}
              roughness={0.3}
              clearcoat={1}
              envMapIntensity={0.5}
            />
          </mesh>
          <mesh position={[0, -0.05, z > 0 ? -0.06 : 0.06]} rotation={[z > 0 ? 0.5 : -0.5, 0, 0]}>
            <boxGeometry args={[0.03, 0.12, 0.03]} />
            <meshStandardMaterial color="#0a0a0c" />
          </mesh>
        </group>
      ))}

      {/* ---- wheels — sitting inside the real arch cutouts ---- */}
      <Wheel x={WHEEL.x} z={WHEEL.z} rimStyle={rimStyle} registry={wheels} />
      <Wheel x={WHEEL.x} z={-WHEEL.z} rimStyle={rimStyle} registry={wheels} />
      <Wheel x={-WHEEL.x} z={WHEEL.z} rimStyle={rimStyle} registry={wheels} />
      <Wheel x={-WHEEL.x} z={-WHEEL.z} rimStyle={rimStyle} registry={wheels} />

      {/* underbody panel — closes the arch cutouts from below so you can't
          see daylight through the car */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[4.15, 0.07, 1.26]} />
        <meshStandardMaterial color="#050506" roughness={1} />
      </mesh>

      {/* ---- cabin ---- */}
      <group>
        {/* floor + tub */}
        <mesh position={[-0.35, 0.38, 0]}>
          <boxGeometry args={[2.1, 0.05, 1.1]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.9} />
        </mesh>
        {/* dash */}
        <mesh position={[0.52, 0.7, 0]}>
          <boxGeometry args={[0.46, 0.2, 0.95]} />
          <meshStandardMaterial color="#101014" roughness={0.6} />
        </mesh>
        {/* cowl plug — seals the seam between canopy and hood so the
            emissive dash can't leak light through the gap */}
        <mesh position={[0.66, 0.72, 0]}>
          <boxGeometry args={[0.34, 0.14, 1.0]} />
          <meshStandardMaterial color="#0a0a0d" roughness={0.8} />
        </mesh>
        {/* panoramic screen */}
        <mesh position={[0.42, 0.85, 0]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.025, 0.14, 0.92]} />
          <meshStandardMaterial
            ref={screenMat}
            color="#020507"
            emissive="#8fdcff"
            emissiveIntensity={0.4}
            toneMapped={false}
          />
        </mesh>
        {/* steering wheel */}
        <group position={[0.26, 0.8, -0.33]} rotation={[0, 0, -0.35]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.16, 0.022, 12, 32]} />
            <meshStandardMaterial color="#15151a" roughness={0.5} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.02, 0.03, 0.3]} />
            <meshStandardMaterial color="#1c1c22" roughness={0.5} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.02, 0.16, 0.03]} />
            <meshStandardMaterial color="#1c1c22" roughness={0.5} />
          </mesh>
          <mesh position={[0.015, 0, 0]}>
            <boxGeometry args={[0.015, 0.045, 0.045]} />
            <meshStandardMaterial
              color="#2a0503"
              emissive="#e10600"
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
        </group>
        {/* seats */}
        {[-0.33, 0.33].map((z) => (
          <group key={z} position={[-0.4, 0, z]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.52, 0.12, 0.46]} />
              <meshStandardMaterial color="#141418" roughness={0.75} />
            </mesh>
            <mesh position={[-0.28, 0.72, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.13, 0.52, 0.46]} />
              <meshStandardMaterial color="#141418" roughness={0.75} />
            </mesh>
            <mesh position={[-0.36, 1.0, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.1, 0.16, 0.22]} />
              <meshStandardMaterial color="#141418" roughness={0.75} />
            </mesh>
            {/* seat LED piping */}
            <mesh position={[-0.22, 0.72, z > 0 ? -0.24 : 0.24]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.02, 0.5, 0.012]} />
              <meshStandardMaterial
                ref={pushAmbient}
                color="#050505"
                emissive="#ff2e24"
                emissiveIntensity={1}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
        {/* center console */}
        <mesh position={[-0.15, 0.52, 0]}>
          <boxGeometry args={[0.75, 0.16, 0.2]} />
          <meshStandardMaterial color="#101014" roughness={0.6} />
        </mesh>
        <mesh position={[-0.05, 0.61, 0]}>
          <boxGeometry args={[0.4, 0.012, 0.14]} />
          <meshStandardMaterial
            ref={pushAmbient}
            color="#050505"
            emissive="#ff2e24"
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
        {/* door ambient strips */}
        {[-0.55, 0.55].map((z) => (
          <mesh key={z} position={[-0.3, 0.64, z]}>
            <boxGeometry args={[1.7, 0.016, 0.016]} />
            <meshStandardMaterial
              ref={pushAmbient}
              color="#050505"
              emissive="#ff2e24"
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* underglow */}
      <pointLight
        ref={glowLight}
        position={[0, 0.1, 0]}
        intensity={0}
        distance={3.5}
        decay={1.8}
        color="#ff2e24"
      />

      {/* fake contact shadow */}
      <ShadowBlob />
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
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  if (!tex) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <planeGeometry args={[5.4, 2.6]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}
