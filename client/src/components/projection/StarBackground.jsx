import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 3000;

function buildStarPath() {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    const r = 300 * Math.cos(2 * a);
    const rx = Math.sign(r) * Math.sqrt(Math.abs(r));
    points.push(new THREE.Vector3(Math.cos(a) * rx * 18, Math.sin(a * 2) * 60, Math.sin(a) * rx * 18));
  }
  return new THREE.CatmullRomCurve3(points, true);
}

export default function StarBackground() {
  const { gl, scene } = useThree();
  const pctRef = useRef(0);

  const { starScene, starCam, starPath, bgTarget } = useMemo(() => {
    const ss = new THREE.Scene();
    const sc = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 2000);
    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1500;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1500;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1500;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    ss.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff })));

    const path = buildStarPath();
    const target = new THREE.WebGLRenderTarget(1024, 576, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      depthBuffer: false,
    });
    return { starScene: ss, starCam: sc, starPath: path, bgTarget: target };
  }, []);

  // Set scene background to the render target texture
  useMemo(() => { scene.background = bgTarget.texture; }, [scene, bgTarget]);

  useFrame(() => {
    pctRef.current += 0.00015;
    const p1 = starPath.getPointAt(pctRef.current % 1);
    const p2 = starPath.getPointAt((pctRef.current + 0.01) % 1);
    starCam.position.copy(p1);
    starCam.lookAt(p2);

    const prev = gl.getRenderTarget();
    gl.setRenderTarget(bgTarget);
    gl.clear();
    gl.render(starScene, starCam);
    gl.setRenderTarget(prev);
  });

  return null;
}
