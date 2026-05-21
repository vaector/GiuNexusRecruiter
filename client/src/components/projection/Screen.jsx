import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createGradientRenderSource } from "./shaders";

export default function Screen({ tune, zoomProgressRef }) {
  const { gl, camera } = useThree();
  const meshRef = useRef();
  const mouseNDC = useRef(new THREE.Vector2(0, 0));
  const smoothMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const strength = useRef(0);
  const mouseActive = useRef(false);

  const screenSrc = useMemo(() => {
    const src = createGradientRenderSource(gl, 1024, 576);
    src.setEffects({
      projectionIntensity: 1,
      reflectionGain: 1,
      highlightBoost: 1,
      lumaVisibilityThreshold: 0,
      invertColor: false,
      halftone: false,
      toneCut: false,
    });
    src.render(gl, 0);
    return src;
  }, [gl]);

  useEffect(() => () => screenSrc.dispose(), [screenSrc]);

  useEffect(() => {
    const onMove = (e) => {
      mouseNDC.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseActive.current = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const halfW = 1.0;
  const halfH = 0.65;

  useFrame((state, delta) => {
    const { clock } = state;
    const mesh = meshRef.current;
    if (!mesh) return;

    if (mouseActive.current) {
      const bl = new THREE.Vector3(-halfW, -halfH, 0).applyMatrix4(mesh.matrixWorld).project(camera);
      const tr = new THREE.Vector3(halfW, halfH, 0).applyMatrix4(mesh.matrixWorld).project(camera);

      const mx = mouseNDC.current.x;
      const my = mouseNDC.current.y;

      const u = (mx - bl.x) / (tr.x - bl.x);
      const v = (my - bl.y) / (tr.y - bl.y);

      // Strength based on distance from screen bounds
      const dx = u < 0 ? -u : u > 1 ? u - 1 : 0;
      const dy = v < 0 ? -v : v > 1 ? v - 1 : 0;
      const distFromBounds = Math.sqrt(dx * dx + dy * dy);
      const targetStrength = Math.max(0, 1 - distFromBounds * 1.5);

      // Clamp the mouse UV so it stays near the screen
      const clampedU = Math.max(-0.5, Math.min(1.5, u));
      const clampedV = Math.max(-0.5, Math.min(1.5, v));

      const lerpSpeed = 1 - Math.pow(0.001, delta);
      smoothMouse.current.x += (clampedU - smoothMouse.current.x) * lerpSpeed;
      smoothMouse.current.y += (clampedV - smoothMouse.current.y) * lerpSpeed;
      strength.current += (targetStrength - strength.current) * lerpSpeed;

      screenSrc.setMouse(smoothMouse.current.x, smoothMouse.current.y, strength.current);
    }

    if (zoomProgressRef) {
      screenSrc.setZoomProgress(zoomProgressRef.current);
    }

    screenSrc.render(gl, clock.elapsedTime);
  });

  return (
    <mesh ref={meshRef} position={[0, 1.0, 0.5]}>
      <planeGeometry args={[2, 1.3]} />
      <meshBasicMaterial map={screenSrc.texture} toneMapped={false} side={THREE.DoubleSide} transparent />
    </mesh>
  );
}