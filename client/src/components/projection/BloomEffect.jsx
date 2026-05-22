import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const ChromaAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.0016 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float     strength;
    varying vec2 vUv;
    void main() {
      vec2  dir    = vUv - 0.5;
      float dist   = length(dir);
      vec2  offset = dir * strength * dist;
      float r = texture2D(tDiffuse, vUv + offset * 1.8).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset * 1.8).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

export default function BloomEffect({ tune }) {
  const { gl, scene, camera, size } = useThree();

  const { composer, bloomPass } = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));

    const bp = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.22, 0.42, 0.72
    );
    c.addPass(bp);

    c.addPass(new ShaderPass(ChromaAberrationShader));
    c.addPass(new OutputPass());

    return { composer: c, bloomPass: bp };
  }, [gl, scene, camera, size.width, size.height]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size.width, size.height]);

  useFrame(() => {
    bloomPass.radius = THREE.MathUtils.clamp(tune.blurRadiusPx / 128, 0, 1);
    bloomPass.strength = 0.22 * Math.max(0.2, tune.highlightBoost);
    bloomPass.threshold = THREE.MathUtils.clamp(tune.lumaVisibilityThreshold, 0, 1);
    composer.render();
  }, 1);

  return null;
}
