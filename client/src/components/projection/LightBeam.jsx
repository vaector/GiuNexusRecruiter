import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BEAM_VERT, BEAM_FRAG_ENHANCED } from "./shaders";

function createGlowTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.5)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.12)");
  grad.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function Flare({ position, scale, color, baseOpacity, speed, phase, zoomProgressRef }) {
  const ref = useRef();
  const tex = useMemo(() => createGlowTexture(256), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 0.88 + 0.12 * Math.sin(clock.elapsedTime * speed + phase);
    const zp = zoomProgressRef ? zoomProgressRef.current : 0;
    ref.current.scale.setScalar(scale * pulse);
    ref.current.material.opacity = baseOpacity * pulse * (1 - zp);
  });

  return (
    <sprite ref={ref} position={position}>
      <spriteMaterial
        map={tex}
        color={color}
        transparent
        opacity={baseOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function BeamPlane({ matRef, position, rotation, length, height, uniforms }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[length / 2, 0, 0]}>
        <planeGeometry args={[length, height]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={BEAM_VERT}
          fragmentShader={BEAM_FRAG_ENHANCED}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function LightBeam({ zoomProgressRef }) {
  const coreRef = useRef();
  const glowRef = useRef();
  const haloRef = useRef();

  const coreUniforms = useMemo(() => ({
    time:           { value: 0 },
    xScale:         { value: 9.2 },
    yScale:         { value: 0.006 },
    distortion:     { value: 0.008 },
    intensity:      { value: 2.2 },
    amplitude:      { value: 0.65 },
    beamColor:      { value: new THREE.Color("#ffffff") },
    widthGrowStart: { value: 0.05 },
    widthGrowEnd:   { value: 0.95 },
  }), []);

  const glowUniforms = useMemo(() => ({
    time:           { value: 0 },
    xScale:         { value: 8.8 },
    yScale:         { value: 0.014 },
    distortion:     { value: 0.016 },
    intensity:      { value: 1.3 },
    amplitude:      { value: 0.5 },
    beamColor:      { value: new THREE.Color("#cce4ff") },
    widthGrowStart: { value: 0.0 },
    widthGrowEnd:   { value: 1.0 },
  }), []);

  const haloUniforms = useMemo(() => ({
    time:           { value: 0 },
    xScale:         { value: 8.0 },
    yScale:         { value: 0.15 },
    distortion:     { value: 0.048 },
    intensity:      { value: 0.72 },
    amplitude:      { value: 0.18 },
    beamColor:      { value: new THREE.Color("#7aacff") },
    widthGrowStart: { value: 0.15 },
    widthGrowEnd:   { value: 0.92 },
  }), []);

  const coreBaseAmp = 0.65;
  const glowBaseAmp = 0.5;
  const haloBaseAmp = 0.18;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.18;
    const zp = zoomProgressRef ? zoomProgressRef.current : 0;
    const fade = 1 - zp;
    if (coreRef.current) { coreRef.current.uniforms.time.value = t; coreRef.current.uniforms.amplitude.value = coreBaseAmp * fade; }
    if (glowRef.current) { glowRef.current.uniforms.time.value = t; glowRef.current.uniforms.amplitude.value = glowBaseAmp * fade; }
    if (haloRef.current) { haloRef.current.uniforms.time.value = t; haloRef.current.uniforms.amplitude.value = haloBaseAmp * fade; }
  });

  const pos = [-6.5, 0.5, 0.48];
  const rot = [0, 0, 0.08];
  const len = 6;

  return (
    <group>
      {/* Narrow bright white core */}
      <BeamPlane
        matRef={coreRef}
        position={pos}
        rotation={rot}
        length={len}
        height={0.75}
        uniforms={coreUniforms}
      />

      {/* Wider soft glow with chromatic tint */}
      <BeamPlane
        matRef={glowRef}
        position={[pos[0], pos[1], pos[2] - 0.01]}
        rotation={rot}
        length={len}
        height={2.6}
        uniforms={glowUniforms}
      />

      {/* Outer halo with visible wave */}
      <BeamPlane
        matRef={haloRef}
        position={[pos[0], pos[1], pos[2] - 0.02]}
        rotation={rot}
        length={len}
        height={2.0}
        uniforms={haloUniforms}
      />



      {/* Impact orb — where beam strikes the screen surface */}
      <Flare
        position={[-0.15, 1.06, 0.56]}
        scale={0.0}
        color="#ffd87a"
        baseOpacity={0.48}
        speed={0.52}
        phase={0.8}
        zoomProgressRef={zoomProgressRef}
      />
    </group>
  );
}
