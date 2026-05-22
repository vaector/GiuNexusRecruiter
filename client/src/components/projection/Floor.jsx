import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createGradientRenderSource } from "./shaders";

export default function Floor({ tune, zoomProgressRef }) {
  const { gl } = useThree();
  const spotRef = useRef();
  const targetRef = useRef();
  const floorMatRef = useRef();

  const projSrc = useMemo(() => {
    const src = createGradientRenderSource(gl, 1024, 576);
    src.render(gl, 0);
    return src;
  }, [gl]);

  useEffect(() => () => projSrc.dispose(), [projSrc]);

  // Link spot target and map after mount
  useEffect(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current;
      spotRef.current.map = projSrc.texture;
    }
  }, [projSrc]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const zp = zoomProgressRef ? zoomProgressRef.current : 0;
    const fade = 1 - zp;
    projSrc.setEffects(tune);
    projSrc.render(gl, t);

    if (spotRef.current) {
      spotRef.current.intensity = 220 * Math.max(0, tune.projectionIntensity) * Math.max(0, tune.reflectionGain) * fade;
    }
    if (floorMatRef.current) {
      floorMatRef.current.envMapIntensity = 0.35 * Math.max(0.1, tune.reflectionGain) * fade;
    }
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100, 64, 64]} />
        <meshStandardMaterial ref={floorMatRef} color={0x0a0a1a} roughness={0.88} metalness={0.06} />
      </mesh>
      <spotLight
        ref={spotRef}
        color={0xffffff}
        intensity={220}
        decay={6}
        distance={35}
        angle={Math.PI / 3.1}
        penumbra={0.58}
        castShadow
        position={[0, 1.0, 0.52]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <object3D ref={targetRef} position={[0, 0.02, 1.15]} />
      <hemisphereLight color={0xffffff} groundColor={0x060608} intensity={0.04} position={[0, 10, 0]} />
    </>
  );
}
