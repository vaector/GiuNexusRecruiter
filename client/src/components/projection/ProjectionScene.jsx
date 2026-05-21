import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import CornerFrame from "./CornerFrame";
import StarBackground from "./StarBackground";
import Grid from "./Grid";
import Screen from "./Screen";
import LightBeam from "./LightBeam";
import GlassMonitor from "./GlassMonitor";
import Floor from "./Floor";
import BloomEffect from "./BloomEffect";
import GlassPanel from "./GlassPanel";
import HeroText from "./HeroText";

const TUNE = {
  projectionIntensity: 1.64,
  reflectionGain: 1.0,
  blurRadiusPx: 64,
  highlightBoost: 1.65,
  lumaVisibilityThreshold: 0.12,
  invertColor: false,
  halftone: true,
  toneCut: false,
};

function CameraZoom({ targetRef, progressRef }) {
  const { camera, size } = useThree();
  const progressLocal = useRef(0);
  const farPos = useMemo(() => new THREE.Vector3(0, 1.2, 5.5), []);
  const farLook = useMemo(() => new THREE.Vector3(0, 0.8, 0), []);
  const nearLook = useMemo(() => new THREE.Vector3(0, 1.0, 0.5), []);
  const nearPos = useMemo(() => new THREE.Vector3(), []);

  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const lerpSpeed = 1 - Math.pow(0.001, delta);
    progressLocal.current += (targetRef.current - progressLocal.current) * lerpSpeed;
    const p = progressLocal.current;
    if (progressRef) progressRef.current = p;

    const aspect = size.width / size.height;
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const dW = 2 / (2 * Math.tan(hFov / 2));
    const dH = 1.3 / (2 * Math.tan(vFov / 2));
    const minDist = Math.min(dW, dH) * 0.92;
    nearPos.set(0, 1.0, 0.5 + minDist);

    camera.position.lerpVectors(farPos, nearPos, p);
    lookTarget.lerpVectors(farLook, nearLook, p);
    camera.lookAt(lookTarget);
  });

  return null;
}

export default function ProjectionScene({ zoomTargetRef: externalZoomTargetRef }) {
  const localZoomTargetRef = useRef(0);
  const zoomTargetRef = externalZoomTargetRef || localZoomTargetRef;
  const zoomProgressRef = useRef(0);

  const tune = useMemo(() => TUNE, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#030303",
        overflow: "hidden",
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.78,
        }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 1.2, 5.5] }}
        onCreated={({ camera }) => camera.lookAt(0, 0.8, 0)}
        frameloop="always"
        style={{ width: "100%", height: "100%" }}
      >
        <CameraZoom targetRef={zoomTargetRef} progressRef={zoomProgressRef} />
        <StarBackground />
        <Grid />
        <GlassMonitor />
        <Screen tune={tune} zoomProgressRef={zoomProgressRef} />
        <GlassPanel />
        <LightBeam zoomProgressRef={zoomProgressRef} />
        <HeroText />
        <Floor tune={tune} zoomProgressRef={zoomProgressRef} />
        <BloomEffect tune={tune} />
      </Canvas>

      <CornerFrame visible={true} />

      <span
        style={{
          position: "absolute",
          bottom: "24px",
          left: "36px",
          fontFamily: "'Courier New', monospace",
          fontSize: "8px",
          letterSpacing: "1.5px",
          color: "rgba(140,230,240,0.55)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          userSelect: "none",
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        LATENCY: 22MS // SYS_STATUS: OPERATIONAL
      </span>
    </div>
  );
}