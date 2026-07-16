"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { world } from "@/lib/world";

/* ---------------------------------------------------------------------- */
/* Geometry — the AUREX GT-1 is built entirely from code: an extruded      */
/* side-profile with a heavy bevel gives the monocoque its shoulders;      */
/* a second extrusion forms the glass canopy. No external models.         */
/* ---------------------------------------------------------------------- */

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
    // bottom line, tail → nose
    s.quadraticCurveTo(-2.1, 0.2, -1.85, 0.18);
    s.lineTo(1.8, 0.18);
    s.quadraticCurveTo(2.2, 0.2, 2.32, 0.3);
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 1.12,
      bevelEnabled: true,
      bevelThickness: 0.29,
      bevelSize: 0.07,
      bevelSegments: 7,
      curveSegments: 28,
    });
    geo.translate(0, 0, -0.56);
    geo.computeVertexNormals();
    return geo;
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
      bevelEnabled: true,
      bevelThickness: 0.13,
      bevelSize: 0.05,
      bevelSegments: 5,
      curveSegments: 20,
    });
    geo.translate(0, 0, -0.39);
    geo.computeVertexNormals();
    return geo;
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

  return (
    <group
      position={[x, 0.35, z]}
      ref={(g) => {
        if (g && spinRef.current && !registry.current.includes(spinRef.current))
          registry.current.push(spinRef.current);
      }}
    >
      {/* arch shadow disc — flush with the body wall, frames the tire */}
      <mesh position={[0, 0.02, side * 0.035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.03, 32]} />
        <meshStandardMaterial color="#030304" roughness={1} />
      </mesh>

      <group ref={spinRef}>
        {/* tire */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.24, 40]} />
          <meshStandardMaterial color="#060607" roughness={0.96} />
        </mesh>

        {/* rim assembly sits on the outer face */}
        <group position={[0, 0, side * 0.12]}>
          <mesh>
            <torusGeometry args={[0.28, 0.022, 10, 40]} />
            <meshStandardMaterial color="#c7c9cf" metalness={1} roughness={0.25} />
          </mesh>
          {/* rim dish */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.29, 0.29, 0.02, 40]} />
            <meshStandardMaterial color="#1a1b1f" metalness={0.9} roughness={0.4} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.02]}>
            <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
            <meshStandardMaterial color="#dadce2" metalness={1} roughness={0.2} />
          </mesh>

          {/* rim style 0 — turbine */}
          <group name="rim-0" visible={rimStyle === 0}>
            {blades.map((i) => (
              <group key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]}>
                <mesh
                  position={[0.16, 0, side * 0.02]}
                  rotation={[side * 0.4, 0, 0]}
                >
                  <boxGeometry args={[0.22, 0.055, 0.03]} />
                  <meshStandardMaterial
                    color="#6a6d75"
                    metalness={1}
                    roughness={0.32}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* rim style 1 — aero twin-spoke */}
          <group name="rim-1" visible={rimStyle === 1}>
            {spokes.map((i) => (
              <group key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]}>
                <mesh position={[0.16, 0.03, side * 0.02]}>
                  <boxGeometry args={[0.24, 0.026, 0.028]} />
                  <meshStandardMaterial
                    color="#33353c"
                    metalness={0.95}
                    roughness={0.3}
                  />
                </mesh>
                <mesh position={[0.16, -0.03, side * 0.02]}>
                  <boxGeometry args={[0.24, 0.026, 0.028]} />
                  <meshStandardMaterial
                    color="#33353c"
                    metalness={0.95}
                    roughness={0.3}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* brake disc — inboard of the rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.03]}>
          <cylinderGeometry args={[0.19, 0.19, 0.03, 28]} />
          <meshStandardMaterial color="#55575e" metalness={1} roughness={0.45} />
        </mesh>
      </group>

      {/* caliper — fixed, does not spin */}
      <mesh position={[0.1, 0.1, side * 0.05]} rotation={[0, 0, 0.7]}>
        <boxGeometry args={[0.11, 0.075, 0.05]} />
        <meshStandardMaterial color="#e10600" roughness={0.4} />
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

    const k = 1 - Math.exp(-4.5 * dt);

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
    if (screenMat.current)
      screenMat.current.emissiveIntensity +=
        (goal.cabin * 1.7 - screenMat.current.emissiveIntensity) * k;

    targetAmbient.set(cfg.ambient);
    for (const m of ambientMats.current) {
      m.emissive.lerp(targetAmbient, k);
      m.emissiveIntensity += (goal.cabin * 3.2 - m.emissiveIntensity) * k;
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
          metalness={0.85}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.35}
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
        <boxGeometry args={[0.05, 0.2, 1.06]} />
        <meshPhysicalMaterial
          color="#050608"
          metalness={0.4}
          roughness={0.12}
          clearcoat={1}
        />
      </mesh>
      {/* tech dot matrix */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[2.315, 0.32, -0.4 + i * 0.1]}>
          <boxGeometry args={[0.012, 0.02, 0.02]} />
          <meshStandardMaterial
            color="#1a0505"
            emissive="#e10600"
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}

      {/* light blade */}
      <mesh position={[2.28, 0.52, 0]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.025, 0.045, 1.22]} />
        <meshStandardMaterial
          ref={headMat}
          color="#e8f4ff"
          emissive="#dff1ff"
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </mesh>
      {/* DRL fangs */}
      {[-0.5, 0.5].map((z) => (
        <mesh key={z} position={[2.26, 0.44, z]} rotation={[0.15 * Math.sign(z), 0, 0]}>
          <boxGeometry args={[0.03, 0.14, 0.028]} />
          <meshStandardMaterial
            color="#e8f4ff"
            emissive="#dff1ff"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ---- tail ---- */}
      <mesh position={[-2.35, 0.56, 0]}>
        <boxGeometry args={[0.025, 0.05, 1.4]} />
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
      <mesh position={[2.0, 0.09, 0]}>
        <boxGeometry args={[0.4, 0.04, 1.44]} />
        <meshStandardMaterial color="#060608" roughness={1} />
      </mesh>
      <mesh position={[-1.95, 0.1, 0]}>
        <boxGeometry args={[0.4, 0.04, 1.44]} />
        <meshStandardMaterial color="#060608" roughness={1} />
      </mesh>
      {[-0.42, -0.14, 0.14, 0.42].map((z) => (
        <mesh key={z} position={[-2.1, 0.15, z]}>
          <boxGeometry args={[0.26, 0.08, 0.02]} />
          <meshStandardMaterial color="#060608" roughness={1} />
        </mesh>
      ))}
      {/* side skirts */}
      {[-0.82, 0.82].map((z) => (
        <mesh key={z} position={[0, 0.15, z]}>
          <boxGeometry args={[2.9, 0.08, 0.06]} />
          <meshStandardMaterial color={DARK} roughness={0.9} />
        </mesh>
      ))}
      {/* mirrors — stalk reaches down to the shoulder line */}
      {[-0.88, 0.88].map((z) => (
        <group key={z} position={[0.62, 0.8, z]}>
          <mesh>
            <boxGeometry args={[0.15, 0.06, 0.09]} />
            <meshPhysicalMaterial
              color="#0d0d12"
              metalness={0.85}
              roughness={0.3}
              clearcoat={1}
            />
          </mesh>
          <mesh position={[0, -0.07, z > 0 ? -0.04 : 0.04]}>
            <boxGeometry args={[0.03, 0.1, 0.03]} />
            <meshStandardMaterial color="#0a0a0c" />
          </mesh>
        </group>
      ))}

      {/* ---- wheels — outer face sits just proud of the body side ---- */}
      <Wheel x={1.45} z={0.82} rimStyle={rimStyle} registry={wheels} />
      <Wheel x={1.45} z={-0.82} rimStyle={rimStyle} registry={wheels} />
      <Wheel x={-1.45} z={0.82} rimStyle={rimStyle} registry={wheels} />
      <Wheel x={-1.45} z={-0.82} rimStyle={rimStyle} registry={wheels} />

      {/* ---- cabin ---- */}
      <group>
        {/* floor + tub */}
        <mesh position={[-0.35, 0.38, 0]}>
          <boxGeometry args={[2.1, 0.05, 1.1]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.9} />
        </mesh>
        {/* dash */}
        <mesh position={[0.52, 0.7, 0]}>
          <boxGeometry args={[0.46, 0.2, 1.08]} />
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
