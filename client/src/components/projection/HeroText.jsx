import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

const FONT = "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-900-normal.ttf";
const FONT_NORMAL = "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf";

// Inversion material — renders as the opposite of whatever is behind it
const InvertMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  depthTest: false,
  uniforms: {},
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(0.7, 0.7, 0.7, 1.0);
    }
  `,
  blending: THREE.CustomBlending,
  blendEquation: THREE.ReverseSubtractEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
});

const WhiteMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(1, 1, 1),
  transparent: true,
  depthWrite: false,
  depthTest: false,
});

export default function HeroText({ plainWhite = true }) {
  const groupRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    g.position.x = THREE.MathUtils.damp(g.position.x, mouse.current.x * 0.06, 2, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, 0.1 + mouse.current.y * 0.03, 2, delta);
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 2.0]} renderOrder={999}>
      <Text
        fontSize={0.32}
        font={FONT_NORMAL}
        letterSpacing={0.0}
        anchorX="center"
        anchorY="middle"
        position={[0, 0.1, 0]}
        material={plainWhite ? WhiteMaterial : InvertMaterial}
        renderOrder={999}
      >
        NEXUS
      </Text>
      <Text
        fontSize={0.06}
        font={FONT_NORMAL}
        letterSpacing={0.05}
        anchorX="center"
        anchorY="middle"
        position={[0, -0.1, 0]}
        material={plainWhite ? WhiteMaterial : InvertMaterial}
        renderOrder={999}
      >
        AI-POWERED TALENT MATCHING
      </Text>
    </group>
  );
}
