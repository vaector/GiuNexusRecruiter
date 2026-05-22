import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BEAM_VERT, GLASS_FRAG } from "./shaders";

export default function GlassMonitor() {
  const overlayRef = useRef();

  const overlayUniforms = useMemo(() => ({
    time:     { value: 0 },
    impactUv: { value: new THREE.Vector2(0.22, 0.50) },
  }), []);

  useFrame(({ clock }) => {
    if (overlayRef.current) overlayRef.current.uniforms.time.value = clock.elapsedTime;
  });

  return (
    <>
      {/* Dark monitor body — slightly wider than screen, sits behind it */}
      <mesh position={[0, 1.0, 0.43]} renderOrder={-1}>
        <planeGeometry args={[2.48, 1.68]} />
        <meshStandardMaterial color={0x060d18} />
      </mesh>

      {/* Glass diffraction overlay — sits in front of the screen */}
      <mesh position={[0, 1.0, 0.52]} renderOrder={1}>
        <planeGeometry args={[2.0, 1.3]} />
        <shaderMaterial
          ref={overlayRef}
          vertexShader={BEAM_VERT}
          fragmentShader={GLASS_FRAG}
          uniforms={overlayUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
