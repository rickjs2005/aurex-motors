"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { world } from "@/lib/world";
import { sampleScene } from "@/lib/scenes";

/**
 * Reads (world.scene, world.t) written by the scroll trackers, samples the
 * film script and eases the camera toward it. Damping between scenes turns
 * hard cuts into dolly moves. Mouse parallax rides on top.
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const look = useRef(new THREE.Vector3(0, 0.55, 0));
  const par = useRef({ x: 0, y: 0 });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const goal = sampleScene(world.scene, world.t);

    // publish the sampled pose for the car + stage
    Object.assign(world.goal, goal);

    const k = 1 - Math.exp(-3.2 * dt);
    const reduced = world.quality.reduced;

    // mouse parallax (desktop only)
    const strength = world.quality.mobile || reduced ? 0 : 1;
    par.current.x += (world.pointer.x * strength - par.current.x) * (1 - Math.exp(-2.2 * dt));
    par.current.y += (world.pointer.y * strength - par.current.y) * (1 - Math.exp(-2.2 * dt));

    const tx = goal.cam[0] + par.current.x * 0.32;
    const ty = goal.cam[1] - par.current.y * 0.2;
    const tz = goal.cam[2];

    if (reduced) {
      camera.position.set(tx, ty, tz);
      look.current.set(goal.look[0], goal.look[1], goal.look[2]);
    } else {
      camera.position.x += (tx - camera.position.x) * k;
      camera.position.y += (ty - camera.position.y) * k;
      camera.position.z += (tz - camera.position.z) * k;
      look.current.x += (goal.look[0] + par.current.x * 0.14 - look.current.x) * k;
      look.current.y += (goal.look[1] - par.current.y * 0.1 - look.current.y) * k;
      look.current.z += (goal.look[2] - look.current.z) * k;
    }

    camera.lookAt(look.current);

    const fovK = reduced ? 1 : k;
    camera.fov += (goal.fov - camera.fov) * fovK;
    camera.updateProjectionMatrix();
  });

  return null;
}
