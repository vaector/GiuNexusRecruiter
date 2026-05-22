import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const FLUORESCENT = {
  orange: 0xff4500,
  green: 0x00ff80,
};

const PARAMS = {
  bodyColor: 0x0f2027,
  ghostOpacity: 0.88,
  emissiveIntensity: 5.8,
  pulseSpeed: 1.6,
  pulseIntensity: 0.6,
  eyeGlowDecay: 0.95,
  eyeGlowResponse: 0.31,
  followSpeed: 0.075,
  wobbleAmount: 0.35,
  floatSpeed: 1.6,
  movementThreshold: 0.07,
  particleDecayRate: 0.005,
  fireflyGlowIntensity: 2.6,
  fireflySpeed: 0.04,
  rimLightIntensity: 1.8,
};

const MAX_PARTICLES = 80;
const FIREFLY_COUNT = 15;

const AnalogDecayShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uAnalogGrain: { value: 0.4 },
    uAnalogBleeding: { value: 1.0 },
    uAnalogVSync: { value: 1.0 },
    uAnalogScanlines: { value: 1.0 },
    uAnalogVignette: { value: 1.0 },
    uAnalogJitter: { value: 0.4 },
    uAnalogIntensity: { value: 0.6 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uAnalogGrain;
    uniform float uAnalogBleeding;
    uniform float uAnalogVSync;
    uniform float uAnalogScanlines;
    uniform float uAnalogVignette;
    uniform float uAnalogJitter;
    uniform float uAnalogIntensity;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float random(float x) {
      return fract(sin(x) * 43758.5453123);
    }

    float gaussian(float z, float u, float o) {
      return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
    }

    vec3 grain(vec2 uv, float time, float intensity) {
      float seed = dot(uv, vec2(12.9898, 78.233));
      float noise = fract(sin(seed) * 43758.5453 + time * 2.0);
      noise = gaussian(noise, 0.0, 0.5 * 0.5);
      return vec3(noise) * intensity;
    }

    void main() {
      vec2 uv = vUv;
      float time = uTime * 1.8;

      vec2 jitteredUV = uv;
      if (uAnalogJitter > 0.01) {
        float jitterAmount = (random(vec2(floor(time * 60.0))) - 0.5) * 0.003 * uAnalogJitter * uAnalogIntensity;
        jitteredUV.x += jitterAmount;
        jitteredUV.y += (random(vec2(floor(time * 30.0) + 1.0)) - 0.5) * 0.001 * uAnalogJitter * uAnalogIntensity;
      }

      if (uAnalogVSync > 0.01) {
        float vsyncRoll = sin(time * 2.0 + uv.y * 100.0) * 0.02 * uAnalogVSync * uAnalogIntensity;
        float vsyncChance = step(0.95, random(vec2(floor(time * 4.0))));
        jitteredUV.y += vsyncRoll * vsyncChance;
      }

      vec4 color = texture2D(tDiffuse, jitteredUV);

      if (uAnalogBleeding > 0.01) {
        float bleedAmount = 0.012 * uAnalogBleeding * uAnalogIntensity;
        float offsetPhase = time * 1.5 + uv.y * 20.0;
        vec2 redOffset = vec2(sin(offsetPhase) * bleedAmount, 0.0);
        vec2 blueOffset = vec2(-sin(offsetPhase * 1.1) * bleedAmount * 0.8, 0.0);
        float r = texture2D(tDiffuse, jitteredUV + redOffset).r;
        float g = texture2D(tDiffuse, jitteredUV).g;
        float b = texture2D(tDiffuse, jitteredUV + blueOffset).b;
        color = vec4(r, g, b, color.a);
      }

      if (uAnalogGrain > 0.01) {
        vec3 grainEffect = grain(uv, time, 0.075 * uAnalogGrain * uAnalogIntensity);
        grainEffect *= (1.0 - color.rgb);
        color.rgb += grainEffect;
      }

      if (uAnalogScanlines > 0.01) {
        float scanlineFreq = 600.0 + uAnalogScanlines * 400.0;
        float scanlinePattern = sin(uv.y * scanlineFreq) * 0.5 + 0.5;
        float scanlineIntensity = 0.1 * uAnalogScanlines * uAnalogIntensity;
        color.rgb *= (1.0 - scanlinePattern * scanlineIntensity);
        float horizontalLines = sin(uv.y * scanlineFreq * 0.1) * 0.02 * uAnalogScanlines * uAnalogIntensity;
        color.rgb *= (1.0 - horizontalLines);
      }

      if (uAnalogVignette > 0.01) {
        vec2 vignetteUV = (uv - 0.5) * 2.0;
        float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.3 * uAnalogVignette * uAnalogIntensity;
        color.rgb *= vignette;
      }

      gl_FragColor = color;
    }
  `,
};

function GhostScene({ mouseRef, passwordFocusedRef }) {
  const { gl, scene, camera, size } = useThree();

  const ghostGroupRef = useRef();
  const ghostBodyRef = useRef();
  const ghostMaterialRef = useRef();
  const leftEyeMatRef = useRef();
  const rightEyeMatRef = useRef();
  const leftOuterMatRef = useRef();
  const rightOuterMatRef = useRef();
  const particleRefs = useRef([]);
  const particleDataRef = useRef([]);
  const fireflyRefs = useRef([]);
  const fireflyDataRef = useRef([]);

  const timeRef = useRef(0);
  const frameCountRef = useRef(0);
  const currentMovementRef = useRef(0);
  const eyeOpacityRef = useRef(0);
  const targetRotYRef = useRef(0);
  const lastParticleTimeRef = useRef(0);

  const ghostGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(2, 40, 40);
    const pos = geo.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < -0.2) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const noise =
          Math.sin(x * 5) * 0.35 +
          Math.cos(z * 4) * 0.25 +
          Math.sin((x + z) * 3) * 0.15;
        pos.setY(i, -2.0 + noise);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const particleGeometries = useMemo(
    () => [
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.TetrahedronGeometry(0.04, 0),
      new THREE.OctahedronGeometry(0.045, 0),
    ],
    []
  );

  useEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
  }, [scene, gl]);

  useEffect(() => {
    fireflyDataRef.current = Array.from({ length: FIREFLY_COUNT }, () => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * PARAMS.fireflySpeed,
        (Math.random() - 0.5) * PARAMS.fireflySpeed,
        (Math.random() - 0.5) * PARAMS.fireflySpeed
      ),
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 2 + Math.random() * 3,
    }));
  }, []);

  useEffect(() => {
    particleDataRef.current = Array.from({ length: MAX_PARTICLES }, () => ({
      life: 0,
      decay: 0,
      velocity: { x: 0, y: 0, z: 0 },
      rotationSpeed: { x: 0, y: 0, z: 0 },
      active: false,
    }));
  }, []);

  const { composer, analogDecayPass } = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.3,
      1.25,
      0.0
    );
    c.addPass(bloom);

    const analog = new ShaderPass(AnalogDecayShader);
    c.addPass(analog);

    c.addPass(new OutputPass());

    return { composer: c, analogDecayPass: analog };
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    analogDecayPass.uniforms.uResolution.value.set(size.width, size.height);
  }, [composer, analogDecayPass, size.width, size.height]);

  useEffect(() => {
    return () => {
      composer.dispose();
    };
  }, [composer]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const timeInc = (dt / 0.01667) * 0.01;
    timeRef.current += timeInc;
    frameCountRef.current++;
    const time = timeRef.current;

    analogDecayPass.uniforms.uTime.value = time;

    const targetRotY = passwordFocusedRef.current ? Math.PI : 0;
    const peek = passwordFocusedRef.current ? Math.sin(time * 2) * 0.05 : 0;
    targetRotYRef.current +=
      (targetRotY + peek - targetRotYRef.current) * 0.05;
    if (ghostGroupRef.current) {
      ghostGroupRef.current.rotation.y = targetRotYRef.current;
    }

    const mouse = mouseRef.current;
    const targetX = mouse.x * 11;
    const targetY = mouse.y * 7;

    let movement = 0;
    if (ghostGroupRef.current) {
      const prev = ghostGroupRef.current.position.clone();
      ghostGroupRef.current.position.x +=
        (targetX - ghostGroupRef.current.position.x) * PARAMS.followSpeed;
      ghostGroupRef.current.position.y +=
        (targetY - ghostGroupRef.current.position.y) * PARAMS.followSpeed;

      const f1 = Math.sin(time * PARAMS.floatSpeed * 1.5) * 0.03;
      const f2 = Math.cos(time * PARAMS.floatSpeed * 0.7) * 0.018;
      const f3 = Math.sin(time * PARAMS.floatSpeed * 2.3) * 0.008;
      ghostGroupRef.current.position.y += f1 + f2 + f3;

      movement = prev.distanceTo(ghostGroupRef.current.position);
    }

    currentMovementRef.current =
      currentMovementRef.current * PARAMS.eyeGlowDecay +
      movement * (1 - PARAMS.eyeGlowDecay);

    const pulse1 =
      Math.sin(time * PARAMS.pulseSpeed) * PARAMS.pulseIntensity;
    const breathe = Math.sin(time * 0.6) * 0.12;
    if (ghostMaterialRef.current) {
      ghostMaterialRef.current.emissiveIntensity =
        PARAMS.emissiveIntensity + pulse1 + breathe;
    }

    const isMoving = currentMovementRef.current > PARAMS.movementThreshold;
    const targetEye = passwordFocusedRef.current
      ? 0
      : isMoving
        ? 1
        : 0;
    const glowSpeed = isMoving
      ? PARAMS.eyeGlowResponse * 2
      : PARAMS.eyeGlowResponse;
    eyeOpacityRef.current +=
      (targetEye - eyeOpacityRef.current) * glowSpeed;

    if (leftEyeMatRef.current)
      leftEyeMatRef.current.opacity = eyeOpacityRef.current;
    if (rightEyeMatRef.current)
      rightEyeMatRef.current.opacity = eyeOpacityRef.current;
    if (leftOuterMatRef.current)
      leftOuterMatRef.current.opacity = eyeOpacityRef.current * 0.3;
    if (rightOuterMatRef.current)
      rightOuterMatRef.current.opacity = eyeOpacityRef.current * 0.3;

    if (ghostBodyRef.current && ghostGroupRef.current) {
      const dir = new THREE.Vector2(
        targetX - ghostGroupRef.current.position.x,
        targetY - ghostGroupRef.current.position.y
      ).normalize();

      const tilt = 0.1 * PARAMS.wobbleAmount;
      ghostBodyRef.current.rotation.z =
        ghostBodyRef.current.rotation.z * 0.95 +
        -dir.x * tilt * 0.05;
      ghostBodyRef.current.rotation.x =
        ghostBodyRef.current.rotation.x * 0.95 +
        dir.y * tilt * 0.05;
      ghostBodyRef.current.rotation.y =
        Math.sin(time * 1.4) * 0.05 * PARAMS.wobbleAmount;

      const sv =
        1 +
        Math.sin(time * 2.1) * 0.025 * PARAMS.wobbleAmount +
        pulse1 * 0.015;
      const sb = 1 + Math.sin(time * 0.8) * 0.012;
      const s = sv * sb;
      ghostBodyRef.current.scale.set(s, s, s);
    }

    fireflyRefs.current.forEach((firefly, i) => {
      if (!firefly) return;
      const data = fireflyDataRef.current[i];
      if (!data) return;

      const pulse =
        Math.sin((time + data.phase) * data.pulseSpeed) * 0.4 + 0.6;
      const glowMesh = firefly.children[0];
      const light = firefly.children[1];

      if (glowMesh && glowMesh.material)
        glowMesh.material.opacity =
          PARAMS.fireflyGlowIntensity * 0.4 * pulse;
      if (firefly.material)
        firefly.material.opacity = PARAMS.fireflyGlowIntensity * 0.9 * pulse;
      if (light) light.intensity = PARAMS.fireflyGlowIntensity * 0.8 * pulse;

      data.velocity.x += (Math.random() - 0.5) * 0.001;
      data.velocity.y += (Math.random() - 0.5) * 0.001;
      data.velocity.z += (Math.random() - 0.5) * 0.001;
      data.velocity.clampLength(0, PARAMS.fireflySpeed);

      firefly.position.add(data.velocity);

      if (Math.abs(firefly.position.x) > 30) data.velocity.x *= -0.5;
      if (Math.abs(firefly.position.y) > 20) data.velocity.y *= -0.5;
      if (Math.abs(firefly.position.z) > 15) data.velocity.z *= -0.5;
    });

    const pData = particleDataRef.current;
    const pRefs = particleRefs.current;
    for (let i = 0; i < pData.length; i++) {
      const p = pData[i];
      const mesh = pRefs[i];
      if (!p.active || !mesh) continue;

      p.life -= p.decay;
      mesh.material.opacity = p.life * 0.85;

      mesh.position.x += p.velocity.x;
      mesh.position.y += p.velocity.y;
      mesh.position.z += p.velocity.z;

      const swirl = Math.cos(time * 1.8 + mesh.position.y) * 0.0008;
      mesh.position.x += swirl;

      mesh.rotation.x += p.rotationSpeed.x;
      mesh.rotation.y += p.rotationSpeed.y;
      mesh.rotation.z += p.rotationSpeed.z;

      if (p.life <= 0) {
        p.active = false;
        mesh.visible = false;
        mesh.material.opacity = 0;
      }
    }

    const now = performance.now();
    if (
      currentMovementRef.current > 0.005 &&
      now - lastParticleTimeRef.current > 100 &&
      ghostGroupRef.current
    ) {
      for (let j = 0; j < 3; j++) {
        const idx = pData.findIndex((pp) => !pp.active);
        if (idx === -1) break;
        const mesh = pRefs[idx];
        if (!mesh) break;

        const p = pData[idx];
        p.active = true;
        p.life = 1.0;
        p.decay =
          Math.random() * 0.003 + PARAMS.particleDecayRate;
        p.velocity = {
          x: (Math.random() - 0.5) * 0.012,
          y: (Math.random() - 0.5) * 0.012 - 0.002,
          z: (Math.random() - 0.5) * 0.012 - 0.006,
        };
        p.rotationSpeed = {
          x: (Math.random() - 0.5) * 0.015,
          y: (Math.random() - 0.5) * 0.015,
          z: (Math.random() - 0.5) * 0.015,
        };

        mesh.position.copy(ghostGroupRef.current.position);
        mesh.position.z -= 0.8 + Math.random() * 0.6;
        mesh.position.x += (Math.random() - 0.5) * 3.5;
        mesh.position.y += (Math.random() - 0.5) * 3.5 - 0.8;

        const sizeVar = 0.6 + Math.random() * 0.7;
        mesh.scale.set(sizeVar, sizeVar, sizeVar);
        mesh.visible = true;
        mesh.material.opacity = Math.random() * 0.9;
      }
      lastParticleTimeRef.current = now;
    }

    composer.render();
  }, 1);

  const fireflyPositions = useMemo(
    () =>
      Array.from({ length: FIREFLY_COUNT }, () => [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
      ]),
    []
  );

  return (
    <>
      <ambientLight intensity={0.08} color={0x0a0a2e} />
      <directionalLight
        position={[-8, 6, -4]}
        intensity={PARAMS.rimLightIntensity}
        color={0x4a90e2}
      />
      <directionalLight
        position={[8, -4, -6]}
        intensity={PARAMS.rimLightIntensity * 0.7}
        color={0x50e3c2}
      />

      <group ref={ghostGroupRef}>
        <mesh ref={ghostBodyRef} geometry={ghostGeometry}>
          <meshStandardMaterial
            ref={ghostMaterialRef}
            color={PARAMS.bodyColor}
            transparent
            opacity={PARAMS.ghostOpacity}
            emissive={FLUORESCENT.orange}
            emissiveIntensity={PARAMS.emissiveIntensity}
            roughness={0.02}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh position={[-0.7, 0.6, 1.9]} scale={[1.1, 1.0, 0.6]}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        <mesh position={[0.7, 0.6, 1.9]} scale={[1.1, 1.0, 0.6]}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>

        <mesh position={[-0.7, 0.6, 2.0]}>
          <sphereGeometry args={[0.3, 12, 12]} />
          <meshBasicMaterial
            ref={leftEyeMatRef}
            color={FLUORESCENT.green}
            transparent
            opacity={0}
          />
        </mesh>
        <mesh position={[0.7, 0.6, 2.0]}>
          <sphereGeometry args={[0.3, 12, 12]} />
          <meshBasicMaterial
            ref={rightEyeMatRef}
            color={FLUORESCENT.green}
            transparent
            opacity={0}
          />
        </mesh>

        <mesh position={[-0.7, 0.6, 1.95]}>
          <sphereGeometry args={[0.525, 12, 12]} />
          <meshBasicMaterial
            ref={leftOuterMatRef}
            color={FLUORESCENT.green}
            transparent
            opacity={0}
            side={THREE.BackSide}
          />
        </mesh>
        <mesh position={[0.7, 0.6, 1.95]}>
          <sphereGeometry args={[0.525, 12, 12]} />
          <meshBasicMaterial
            ref={rightOuterMatRef}
            color={FLUORESCENT.green}
            transparent
            opacity={0}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {fireflyPositions.map((pos, i) => (
        <mesh
          key={`ff-${i}`}
          ref={(el) => (fireflyRefs.current[i] = el)}
          position={pos}
        >
          <sphereGeometry args={[0.02, 2, 2]} />
          <meshBasicMaterial
            color={0xffff44}
            transparent
            opacity={0.9}
          />
          <mesh>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial
              color={0xffff88}
              transparent
              opacity={0.4}
              side={THREE.BackSide}
            />
          </mesh>
          <pointLight
            color={0xffff44}
            intensity={0.8}
            distance={3}
            decay={2}
          />
        </mesh>
      ))}

      <group>
        {Array.from({ length: MAX_PARTICLES }, (_, i) => (
          <mesh
            key={`p-${i}`}
            ref={(el) => (particleRefs.current[i] = el)}
            visible={false}
            geometry={particleGeometries[i % 3]}
          >
            <meshBasicMaterial
              color={FLUORESCENT.orange}
              transparent
              opacity={0}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function SpookyGhost({ passwordFocused = false }) {
  const passwordFocusedRef = useRef(false);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    passwordFocusedRef.current = passwordFocused;
  }, [passwordFocused]);

  useEffect(() => {
    const onMove = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      mouseRef.current.x = (cx / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(cy / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  return (
    <div
      className="spooky-ghost-canvas"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
          premultipliedAlpha: false,
          stencil: false,
        }}
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 20] }}
        style={{ background: "transparent" }}
      >
        <GhostScene
          mouseRef={mouseRef}
          passwordFocusedRef={passwordFocusedRef}
        />
      </Canvas>
    </div>
  );
}
