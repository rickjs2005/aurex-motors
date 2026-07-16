"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial, Sparkles } from "@react-three/drei";
import { world } from "@/lib/world";

/** studio light rig + reflective floor + atmosphere */
export default function Stage({ quality = "high" }: { quality?: "high" | "low" }) {
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const red = useRef<THREE.PointLight>(null);
  const cones = useRef<THREE.Group>(null);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const k = 1 - Math.exp(-3.5 * dt);
    const g = world.goal;

    if (key.current) {
      key.current.intensity += (g.key * 260 - key.current.intensity) * k;
      // the key light leans toward the cursor — reflections follow the hand
      key.current.position.x += (5 + world.pointer.x * 2.2 - key.current.position.x) * k;
      key.current.position.z += (4 + world.pointer.x * 1.4 - key.current.position.z) * k;
      key.current.position.y += (5 - world.pointer.y * 1.2 - key.current.position.y) * k;
    }
    if (rim.current) rim.current.intensity += (g.rim * 180 - rim.current.intensity) * k;
    if (red.current) red.current.intensity += (g.tail * 40 - red.current.intensity) * k;

    if (cones.current) {
      cones.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.15;
    }
  });

  return (
    <>
      <color attach="background" args={["#050507"]} />
      <fog attach="fog" args={["#050507", 7, 26]} />

      <ambientLight intensity={0.18} />

      <spotLight
        ref={key}
        position={[5, 5, 4]}
        angle={0.55}
        penumbra={1}
        decay={1.2}
        intensity={140}
        color="#f2f4ff"
      />
      <spotLight
        ref={rim}
        position={[-5.5, 3.5, -4.5]}
        angle={0.6}
        penumbra={1}
        decay={1.2}
        intensity={100}
        color="#bcd6ff"
      />
      <pointLight
        ref={red}
        position={[-3.4, 0.9, -2.6]}
        decay={1.6}
        distance={7}
        intensity={0}
        color="#e10600"
      />

      {/* procedural studio environment — no HDR downloads */}
      <Environment resolution={quality === "high" ? 256 : 64} frames={1}>
        <Lightformer
          intensity={2}
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[12, 1.6, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.6}
          position={[-6, 2.4, 5]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[5, 1, 1]}
          color="#cfe4ff"
        />
        <Lightformer
          intensity={1.1}
          position={[6, 1.6, -5]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[4, 0.8, 1]}
          color="#ffd9cf"
        />
        <Lightformer
          intensity={0.7}
          position={[-7, 1, -4]}
          scale={[3, 0.5, 1]}
          color="#ff2e24"
        />
      </Environment>

      {/* reflective studio floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[30, 64]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={45}
            roughness={0.9}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#060609"
            metalness={0.6}
            mirror={0.5}
          />
        ) : (
          <meshStandardMaterial color="#07070a" roughness={0.4} metalness={0.6} />
        )}
      </mesh>

      {/* floating dust */}
      <Sparkles
        count={quality === "high" ? 130 : 45}
        size={1.6}
        speed={0.25}
        opacity={0.4}
        scale={[16, 6, 12]}
        position={[0, 2.6, 0]}
        color="#9fb6d8"
      />

      {/* volumetric shafts (faked with additive cones) — behind the car,
          whisper-quiet or they wash the whole frame */}
      <group ref={cones}>
        <VolumeCone position={[1.8, 3.2, -2.4]} tint="#8ab4ff" opacity={0.02} />
        <VolumeCone position={[-2.6, 3.4, -1.8]} tint="#ffffff" opacity={0.014} />
      </group>

      <SpeedLines />
    </>
  );
}

function VolumeCone({
  position,
  tint,
  opacity = 0.045,
}: {
  position: [number, number, number];
  tint: string;
  opacity?: number;
}) {
  return (
    <mesh position={position}>
      <coneGeometry args={[1.7, 6, 24, 1, true]} />
      <meshBasicMaterial
        color={tint}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/** air streaks for the performance + finale scenes */
function SpeedLines() {
  const ref = useRef<THREE.LineSegments>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);

  const COUNT = 130;
  const { geometry, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 6);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const x = Math.random() * 18 - 9;
      const y = 0.15 + Math.random() * 2.6;
      const z = Math.random() * 9 - 4.5;
      const len = 0.5 + Math.random() * 1.1;
      positions.set([x, y, z, x + len, y, z], i * 6);
      speeds[i] = 14 + Math.random() * 22;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry, speeds };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const target = world.goal.streaks;
    if (!ref.current || !mat.current) return;

    mat.current.opacity += (target * 0.55 - mat.current.opacity) * (1 - Math.exp(-4 * dt));
    const visible = mat.current.opacity > 0.015;
    ref.current.visible = visible;
    if (!visible) return;

    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const v = speeds[i] * dt * target;
      arr[i * 6] -= v;
      arr[i * 6 + 3] -= v;
      if (arr[i * 6 + 3] < -9) {
        const shift = 18;
        arr[i * 6] += shift;
        arr[i * 6 + 3] += shift;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref} geometry={geometry} visible={false}>
      <lineBasicMaterial
        ref={mat}
        color="#a8c8f0"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}
