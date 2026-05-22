import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const VLINES = 14;
const HLINES = 6;
const GRID_W = 10.5;
const GRID_H = 4;

function GridLine({ points, lineRef }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points.flatMap((p) => [p.x, p.y, p.z]), 3));
    return g;
  }, [points]);

  return (
    <line ref={lineRef} geometry={geo}>
      <lineBasicMaterial color={[0.1, 0.5, 0.7]} transparent opacity={0.05} />
    </line>
  );
}

export default function Grid() {
  const vRefs = useRef([]);
  const hRefs = useRef([]);

  const { vPositions, hPositions } = useMemo(() => {
    const vp = [];
    for (let i = 0; i < VLINES; i++) {
      const x = -GRID_W / 2 + i * (GRID_W / (VLINES - 1));
      vp.push([new THREE.Vector3(x, -GRID_H / 2, 0), new THREE.Vector3(x, GRID_H / 2, 0)]);
    }
    const hp = [];
    for (let i = 0; i < HLINES; i++) {
      const y = -GRID_H / 2 + i * (GRID_H / (HLINES - 1));
      hp.push([new THREE.Vector3(-GRID_W / 2, y, 0), new THREE.Vector3(GRID_W / 2, y, 0)]);
    }
    return { vPositions: vp, hPositions: hp };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const phase = Math.sin(t * 0.9);

    for (let i = 0; i < VLINES; i++) {
      const ref = vRefs.current[i];
      if (!ref) continue;
      const center = (VLINES - 1) / 2;
      const dir = i < center ? 1 : -1;
      const dist = Math.abs(i - center) / center;
      ref.position.x = dir * (dist - 0.3) * phase * 0.08;
    }
    for (let i = 0; i < HLINES; i++) {
      const ref = hRefs.current[i];
      if (!ref) continue;
      const center = (HLINES - 1) / 2;
      const dir = i < center ? 1 : -1;
      const dist = Math.abs(i - center) / center;
      ref.position.y = dir * (dist - 0.3) * phase * 0.06;
    }

    // Color sync
    const rawBlend = 0.5 - 0.5 * Math.cos(t * 0.346);
    const tBias = Math.pow(rawBlend, 5);
    const sph = 0.6;
    const r = (0.05 + 0.06 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 0.8))) * (1 - tBias) + (0.46 + 0.07 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 2.4))) * tBias;
    const g = (0.69 + 0.14 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 0.0))) * (1 - tBias) + (0.34 + 0.05 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 1.2))) * tBias;
    const b = (0.64 + 0.12 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 2.0))) * (1 - tBias) + (0.44 + 0.05 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 3.6))) * tBias;

    // Update all line materials
    [...vRefs.current, ...hRefs.current].forEach((ref) => {
      if (ref?.material) ref.material.color.setRGB(r, g, b);
    });
  });

  return (
    <group position={[0, 1.0, -2]}>
      {vPositions.map((pts, i) => (
        <GridLine key={`v${i}`} points={pts} lineRef={(el) => (vRefs.current[i] = el)} />
      ))}
      {hPositions.map((pts, i) => (
        <GridLine key={`h${i}`} points={pts} lineRef={(el) => (hRefs.current[i] = el)} />
      ))}
    </group>
  );
}
