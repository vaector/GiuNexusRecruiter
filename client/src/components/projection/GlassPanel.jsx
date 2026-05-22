import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function GlassPanel() {
  const matRef = useRef();

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.time.value = clock.elapsedTime;
    }
  });

  return (
    <group>
      {/* Frosted glass blur layer */}
      <mesh position={[0, 1.0, 0.44]} renderOrder={-3}>
        <planeGeometry args={[2.1, 1.38]} />
        <meshPhysicalMaterial
          transparent
          transmission={0.92}
          roughness={0.6}
          thickness={0.3}
          ior={1.1}
          color="#0a2020"
          opacity={0.15}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Border overlay */}
      <mesh position={[0, 1.0, 0.45]} renderOrder={-2}>
        <planeGeometry args={[2.1, 1.38]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={{
          time: { value: 0 },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;
            float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));

            // Pale teal fresnel glow
            float fresnel = smoothstep(0.18, 0.0, edge);
            vec3 teal = vec3(0.0, 0.898, 0.8);
            vec3 color = teal * 0.3 * fresnel;
            float alpha = 0.01 + fresnel * 0.25;

            // Rainbow border line
            float border = smoothstep(0.008, 0.0, edge);
            float perimeter = uv.x + uv.y + sin(uv.x * 6.0 + time * 0.6) * 0.15 + cos(uv.y * 5.0 + time * 0.8) * 0.15;
            float r = 0.5 + 0.5 * sin(perimeter * 4.0 + time * 0.7);
            float g = 0.5 + 0.5 * sin(perimeter * 4.0 + time * 0.7 + 2.094);
            float b = 0.5 + 0.5 * sin(perimeter * 4.0 + time * 0.7 + 4.189);
            color += vec3(r, g, b) * border;
            alpha += border * 0.85;

            gl_FragColor = vec4(color, alpha);
          }
        `}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
      </mesh>
    </group>
  );
}
