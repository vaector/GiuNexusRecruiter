import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const SECTION_VH = 400;

/* ─── Galaxy Cube Shaders ─────────────────────────────── */

const CUBE_VERT = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CUBE_FRAG = `
  uniform float iTime;
  uniform vec2 iResolution;
  uniform float scrollProgress;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void mainImage(out vec4 O, vec2 I) {
    vec2 r = iResolution.xy;
    vec2 z;
    vec2 i;
    vec2 f = I * (z += 4. - 4. * abs(.7 - dot(I = (I + I - r) / r.y, I)));
    f.x += sin(iTime * 0.2) * 0.1;
    f.y -= sin(iTime * 0.2) * 0.1;
    float iterations = mix(8.0, 12.0, scrollProgress);
    for (O *= 0.; i.y++ < iterations;)
      O += (sin(f += cos(f.yx * i.y + i + iTime) / i.y + .7) + 1.).xyyx * abs(f.x - f.y);
    O = tanh(7. * exp(z.x - 4. - I.y * vec4(-1, 1, 2, 0)) / O);
    float pulse = 1.0 + 0.2 * sin(iTime * 0.5);
    O.rgb *= pulse;
    float nebula = sin(I.x * 0.01 + iTime * 0.3) * sin(I.y * 0.01 - iTime * 0.2);
    nebula = abs(nebula) * 0.5;
    vec3 color1 = mix(vec3(0.0, 0.45, 0.8), vec3(0.0, 0.9, 0.8), scrollProgress);
    vec3 color2 = mix(vec3(0.8, 0.2, 0.7), vec3(0.0, 0.9, 0.7), scrollProgress);
    vec3 colorMix = mix(color1, color2, sin(iTime * 0.2) * 0.5 + 0.5);
    O.rgb = mix(O.rgb, colorMix, nebula * (1.0 - length(O.rgb)));
  }

  void main() {
    vec2 cubeUV = vUv * iResolution;
    vec4 fragColor;
    mainImage(fragColor, cubeUV);
    float depthFactor = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    fragColor.rgb *= 0.7 + 0.3 * depthFactor;
    float edge = 1.0 - max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0;
    edge = pow(edge, 4.0);
    fragColor.rgb += edge * vec3(0.0, 0.9, 0.8) * (0.5 + scrollProgress * 0.5);
    fragColor.rgb *= 1.8;
    gl_FragColor = fragColor;
  }
`;

/* ─── GalaxyCube ──────────────────────────────────────── */

function GalaxyCube({ scrollRef }) {
  const groupRef = useRef();
  const matRef = useRef();

  const geometry = useMemo(() => new THREE.BoxGeometry(2, 2, 2, 4, 4, 4), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 10), [geometry]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = scrollRef.current;
    if (matRef.current) {
      matRef.current.uniforms.iTime.value = t;
      matRef.current.uniforms.scrollProgress.value = p;
    }
    if (groupRef.current) {
      groupRef.current.rotation.x = t * 0.08 + p * Math.PI * 1.2;
      groupRef.current.rotation.y = t * 0.12 + p * Math.PI * 2;
      groupRef.current.rotation.z = p * Math.PI * 0.3;
      const s = 1 + p * 0.35;
      groupRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={CUBE_VERT}
          fragmentShader={CUBE_FRAG}
          uniforms={{
            iTime: { value: 0 },
            iResolution: { value: new THREE.Vector2(512, 512) },
            scrollProgress: { value: 0 },
          }}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={0x00e5cc} transparent opacity={0.08} />
      </lineSegments>
    </group>
  );
}

/* ─── Camera Controller ───────────────────────────────── */

function CameraRig({ scrollRef }) {
  const { camera } = useThree();
  const progressRef = useRef(0);

  useFrame((_, delta) => {
    const target = scrollRef.current;
    const lerpSpeed = 1 - Math.pow(0.05, delta);
    progressRef.current += (target - progressRef.current) * lerpSpeed;
    const p = progressRef.current;

    let zoomCurve;
    if (p < 0.5) {
      zoomCurve = Math.min(p * 2, 1);
    } else {
      zoomCurve = Math.min(2 - p * 2, 1);
    }
    zoomCurve = zoomCurve * zoomCurve * (3 - 2 * zoomCurve);

    const baseZ = 5;
    const minZ = 1.5;
    camera.position.z = baseZ - (baseZ - minZ) * zoomCurve;
    camera.position.y = 0.2 * zoomCurve;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─── Star Field ─────────────────────────────────────── */

function PitchStars({ count = 500 }) {
  const ref = useRef();
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 4 + Math.random() * 16;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const b = 0.3 + Math.random() * 0.7;
      col[i * 3] = 0.3 * b;
      col[i * 3 + 1] = 0.7 * b;
      col[i * 3 + 2] = b;
    }
    return { positions: pos, colors: col };
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.008;
      ref.current.rotation.x = clock.elapsedTime * 0.003;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Constellation Lines ────────────────────────────── */

function ConstellationLines({ scrollRef }) {
  const ref = useRef();
  const lines = useMemo(() => {
    const pts = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 4;
      const r = 3 + Math.sin(i * 0.7) * 1.5;
      const y = Math.cos(i * 0.5) * 2;
      pts.push(
        Math.cos(theta) * r,
        y,
        Math.sin(theta) * r,
        Math.cos(theta + 0.3) * (r + 0.5),
        y + Math.sin(i * 0.3) * 0.5,
        Math.sin(theta + 0.3) * (r + 0.5)
      );
    }
    return new Float32Array(pts);
  }, []);

  useFrame(() => {
    if (ref.current) {
      ref.current.material.opacity = Math.max(0, scrollRef.current - 0.3) * 0.12;
    }
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={lines.length / 3} array={lines} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={0x00e5cc} transparent opacity={0} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
}

/* ─── Slide Data ─────────────────────────────────────── */

const SLIDES = [
  {
    num: "01",
    title: "BEYOND\nTRADITION",
    desc: "The hiring landscape is evolving. AI sees patterns that traditional methods miss entirely.",
    stat: 1247,
    suffix: "+",
    label: "PROFESSIONALS",
  },
  {
    num: "02",
    title: "DEEP\nAWARENESS",
    desc: "Our engine understands skills beyond keywords, mapping potential across dimensions you didn\u2019t know existed.",
    stat: 94,
    suffix: "",
    label: "HIRING PARTNERS",
  },
  {
    num: "03",
    title: "INFINITE\nMATCH",
    desc: "Complexity becomes clarity when viewed through the right lens. Our AI reveals patterns invisible to the human eye.",
    stat: 89,
    suffix: "%",
    label: "MATCH ACCURACY",
  },
  {
    num: "04",
    title: "INSTANT\nCONNECTION",
    desc: "The right opportunity doesn\u2019t wait. Our AI connects talent to destiny in milliseconds.",
    stat: 2.4,
    suffix: "\u00d7",
    label: "FASTER PLACEMENT",
    isDecimal: true,
  },
];

/* ─── Main PitchSection ──────────────────────────────── */

export default function PitchSection() {
  const sectionRef = useRef(null);
  const scrollRef = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const animatedRef = useRef(new Set());

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const sectionH = section.offsetHeight;
      const progress = Math.min(Math.max(-rect.top / (sectionH - vh), 0), 1);
      scrollRef.current = progress;
      const slide = Math.min(Math.floor(progress * 4), 3);
      if (slide !== activeSlide) setActiveSlide(slide);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeSlide]);

  useEffect(() => {
    if (animatedRef.current.has(activeSlide)) return;
    animatedRef.current.add(activeSlide);

    const slide = SLIDES[activeSlide];
    const target = slide.stat;
    const duration = 1600;
    const start = performance.now();
    const idx = activeSlide;

    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const val = slide.isDecimal
        ? parseFloat((ease * target).toFixed(1))
        : Math.round(ease * target);
      setCounts((prev) => {
        const next = [...prev];
        next[idx] = val;
        return next;
      });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [activeSlide]);

  const formatStat = (slide, count) => {
    if (slide.isDecimal) {
      return count === 0 ? "0.0" : count.toFixed(1) + slide.suffix;
    }
    return count.toLocaleString() + slide.suffix;
  };

  return (
    <section
      ref={sectionRef}
      style={{ height: SECTION_VH + "vh", position: "relative", background: "rgba(3,3,3,0.75)", zIndex: 1 }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          cursor: "crosshair",
        }}
      >
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Canvas
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ fov: 60, near: 0.1, far: 100, position: [0, 0, 5] }}
            style={{ width: "100%", height: "100%" }}
          >
            <GalaxyCube scrollRef={scrollRef} />
            <PitchStars />
            <ConstellationLines scrollRef={scrollRef} />
            <CameraRig scrollRef={scrollRef} />
            <ambientLight intensity={0.6} />
            <pointLight position={[5, 5, 5]} intensity={0.8} color={0x00e5cc} />
          </Canvas>
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.03) 50%)",
            backgroundSize: "100% 4px",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)",
            pointerEvents: "none",
            zIndex: 4,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            pointerEvents: "none",
            zIndex: 6,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <CornerBrackets />

        <div
          style={{
            position: "absolute",
            top: "2rem",
            left: "2.5rem",
            zIndex: 20,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
            }}
          >
            SYS.READY
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.15)",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                right: 0,
                top: "-2px",
                width: "5px",
                height: "5px",
                background: "#00e5cc",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              color: "rgba(0,229,204,0.7)",
              textTransform: "uppercase",
            }}
          >
            SECTOR_{String(activeSlide + 1).padStart(2, "0")}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "2.5rem",
            right: "2.5rem",
            zIndex: 20,
            pointerEvents: "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
            }}
          >
            COORD: <strong style={{ color: "#00e5cc" }}>{String(Math.floor(scrollRef.current * 1000)).padStart(6, "0")}</strong>
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === activeSlide ? "24px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i === activeSlide ? "#00e5cc" : "rgba(255,255,255,0.2)",
                  transition: "all 0.4s ease",
                }}
              />
            ))}
          </div>
        </div>

        {SLIDES.map((slide, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              paddingLeft: "8%",
              paddingRight: "8%",
              opacity: i === activeSlide ? 1 : 0,
              transform:
                i === activeSlide
                  ? "translateY(0)"
                  : i < activeSlide
                  ? "translateY(-30px)"
                  : "translateY(30px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
              pointerEvents: i === activeSlide ? "auto" : "none",
            }}
          >
            <div style={{ maxWidth: "560px" }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "10px",
                  letterSpacing: "3px",
                  color: "#00e5cc",
                  marginBottom: "1rem",
                  textTransform: "uppercase",
                }}
              >
                [{slide.num}]
              </div>

              <h2
                style={{
                  fontFamily: "'Syncopate',sans-serif",
                  fontSize: "clamp(3rem,8vw,6rem)",
                  lineHeight: 1,
                  fontWeight: 700,
                  color: "#fff",
                  whiteSpace: "pre-line",
                  marginBottom: "1.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {slide.title}
              </h2>

              <p
                style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: "1.1rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.55)",
                  maxWidth: "440px",
                  marginBottom: "2.5rem",
                }}
              >
                {slide.desc}
              </p>

              <div
                style={{
                  border: "1px solid rgba(0,229,204,0.25)",
                  padding: "24px 32px",
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "6px",
                  background: "rgba(0,229,204,0.03)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: -1,
                    width: 10,
                    height: 10,
                    borderTop: "1px solid rgba(0,229,204,0.5)",
                    borderLeft: "1px solid rgba(0,229,204,0.5)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 10,
                    height: 10,
                    borderBottom: "1px solid rgba(0,229,204,0.5)",
                    borderRight: "1px solid rgba(0,229,204,0.5)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: "10px",
                    letterSpacing: "3px",
                    color: "#00e5cc",
                    textTransform: "uppercase",
                  }}
                >
                  {slide.label}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: "52px",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {formatStat(slide, counts[i])}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Corner Brackets ────────────────────────────────── */

function CornerBrackets() {
  const ref = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      const s = smoothRef.current;
      const m = mouseRef.current;
      s.x += (m.x - s.x) * 0.03;
      s.y += (m.y - s.y) * 0.03;
      if (ref.current) {
        ref.current.style.transform = `translate(${s.x * 10}px,${-s.y * 8}px)`;

        const t = performance.now() * 0.001;
        const rawBlend = 0.5 - 0.5 * Math.cos(t * 0.346);
        const tBias = Math.pow(rawBlend, 5);
        const sph = 0.6;
        const r =
          (0.05 + 0.06 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 0.8))) * (1 - tBias) +
          (0.46 + 0.07 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 2.4))) * tBias;
        const g =
          (0.69 + 0.14 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 0.0))) * (1 - tBias) +
          (0.34 + 0.05 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 1.2))) * tBias;
        const b =
          (0.64 + 0.12 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 2.0))) * (1 - tBias) +
          (0.44 + 0.05 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 3.6))) * tBias;
        ref.current.style.borderColor = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},0.6)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "5%",
        left: "5%",
        right: "5%",
        bottom: "20%",
        pointerEvents: "none",
        zIndex: 3,
        border: "2px solid rgba(100,200,220,0.6)",
        borderRadius: "2px",
        maskImage:
          "linear-gradient(#fff,#fff) top left,linear-gradient(#fff,#fff) top right,linear-gradient(#fff,#fff) bottom left,linear-gradient(#fff,#fff) bottom right",
        maskSize: "80px 80px",
        maskRepeat: "no-repeat",
        maskPosition: "top left,top right,bottom left,bottom right",
        WebkitMaskImage:
          "linear-gradient(#fff,#fff),linear-gradient(#fff,#fff),linear-gradient(#fff,#fff),linear-gradient(#fff,#fff)",
        WebkitMaskSize: "80px 80px",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "top left,top right,bottom left,bottom right",
      }}
    />
  );
}