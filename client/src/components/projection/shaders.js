import * as THREE from "three";

/* ==========================================================================
   Screen Shader — animated teal/blush gradient with FBM noise
   ========================================================================== */

export const SCREEN_VERT = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const SCREEN_FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uProjectionIntensity;
  uniform float uReflectionGain;
  uniform float uHighlightBoost;
  uniform float uLumaVisibilityThreshold;
  uniform float uInvertColor;
  uniform float uHalftone;
  uniform float uToneCut;
  uniform vec2 uMouse;
  uniform float uMouseActive;
  uniform float uZoomProgress;

  /* --- Noise utilities --- */

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x2 = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x2) - 0.5;
    vec3 ox = floor(x2 + 0.5);
    vec3 a0 = x2 - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * snoise(p);
      p = p * 2.0 + vec2(17.0, 31.0);
      a *= 0.5;
    }
    return v;
  }

  /* --- Main --- */

  void main() {
    vec2 uv = vUv;
    vec2 p  = uv * 2.0 - 1.0;
    float t = uTime;

    // Gentle mouse attraction - slight bulge toward cursor
    {
      vec2 mousePos = uMouse;
      vec2 diff = uv - mousePos;
      float dist = length(diff);
      float radius = 0.55;
      float influence = smoothstep(radius, 0.0, dist) * uMouseActive;
      uv -= diff * influence * 0.18;
      p = uv * 2.0 - 1.0;
    }

    // Flowing noise field
    vec2 flow = vec2(t * 0.19, t * 0.13);
    vec2 q = vec2(
      fbm(p * 1.05 + flow),
      fbm(p * 1.05 + vec2(-flow.y * 1.1, flow.x * 0.9))
    );
    vec2 w = p + q * 0.62;

    float nA    = 0.5 + 0.5 * fbm(w * 2.15 + flow * 0.8);
    float nB    = 0.5 + 0.5 * fbm(w * 4.8 + vec2(-flow.x * 0.5, flow.y * 0.35));
    float ridge = 1.0 - abs(2.0 * nB - 1.0);

    float mask     = clamp(0.18 + 1.12 * (0.58 * nA + 0.42 * ridge), 0.0, 1.0);
    float edgeFade = 1.0 - clamp(length(p) * 0.7, 0.0, 1.0);
    float intensity = pow(clamp(mask * (0.72 + edgeFade * 0.45), 0.0, 1.0), 1.05);

    // Teal-biased palette (pow-5 bias keeps teal ~80% of cycle)
    float base2    = nA * 0.82 + ridge * 0.18;
    float rawBlend = 0.5 - 0.5 * cos(t * 0.346);
    float tBias    = rawBlend * rawBlend * rawBlend * rawBlend * rawBlend;
    float sph      = base2 * 1.2;

    vec3 teal = vec3(
      0.05 + 0.06 * (0.5 + 0.5 * cos(sph * 5.0 + 0.8)),
      0.69 + 0.14 * (0.5 + 0.5 * cos(sph * 5.0 + 0.0)),
      0.64 + 0.12 * (0.5 + 0.5 * cos(sph * 5.0 + 2.0))
    );
    vec3 blush = vec3(
      0.46 + 0.07 * (0.5 + 0.5 * cos(sph * 5.0 + 2.4)),
      0.34 + 0.05 * (0.5 + 0.5 * cos(sph * 5.0 + 1.2)),
      0.44 + 0.05 * (0.5 + 0.5 * cos(sph * 5.0 + 3.6))
    );

    vec3 col = mix(teal, blush, tBias) * intensity;

    // Highlight
    float highlight = pow(clamp((nA * 1.1 + ridge * 0.75) - 1.1, 0.0, 1.0), 2.2);
    col = mix(col, vec3(0.85, 0.98, 1.0), highlight * vec3(0.25, 0.2, 0.15));

    vec3 tex = clamp(col, 0.0, 1.0);

    // Post-effects
    if (uInvertColor > 0.5) { tex = vec3(1.0) - tex; }
    if (uToneCut > 0.5) {
      float tl = 5.0;
      tex = floor(tex * (tl - 1.0) + 0.5) / (tl - 1.0);
    }

    float lum       = dot(tex, vec3(0.2126, 0.7152, 0.0722));
    float lumaStart = clamp(uLumaVisibilityThreshold, 0.0, 1.0);
    float lumaEnd   = min(1.0, lumaStart + 0.1);
    float darkMask  = 1.0;
    if (lumaStart > 1e-4) { darkMask = smoothstep(lumaStart, lumaEnd, lum); }

    // Halftone dots
    if (uHalftone > 0.5) {
      vec2  hUv       = vUv * vec2(180.0, 120.0);
      vec2  hCell     = fract(hUv) - 0.5;
      float dotRadius = mix(0.02, 0.45, clamp(lum, 0.0, 1.0));
      float dotMask2  = 1.0 - smoothstep(dotRadius, dotRadius + 0.035, length(hCell));
      tex *= dotMask2 * darkMask;
    }

    float hi = smoothstep(0.5, 1.0, lum);
    tex *= darkMask;
    tex *= mix(1.0, uHighlightBoost, hi);
    tex *= max(0.0, uProjectionIntensity) * max(0.0, uReflectionGain);

    // Zoom-driven translucency & desaturation
    float zp = uZoomProgress;
    float finalLum = dot(tex, vec3(0.2126, 0.7152, 0.0722));
    vec3 darkMono = vec3(0.012);
    tex = mix(tex, darkMono, zp * 0.88);
    float crest = smoothstep(0.12, 0.55, finalLum);
    tex *= mix(1.0, 0.25 + 0.75 * crest, zp);
    float maxAlpha = mix(1.0, 0.15, zp);

    gl_FragColor = vec4(tex, maxAlpha);
  }
`;

/* ==========================================================================
   Light Beam Shader — the beam coming from the left hitting the screen
   ========================================================================== */

export const BEAM_VERT = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const BEAM_FRAG = /* glsl */ `
  precision highp float;

  uniform float time;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;

    // --- WIDTH CONTROL ---
    // widthT: 0 at left edge, 1 at right edge (screen end)
    float widthT = smoothstep(0.0, 1.0, vUv.x);
    // ► WIDTH_START (0.25) = how narrow the beam is at the source (left)
    // ► WIDTH_END   (1.8)  = how wide the beam is at the screen (right)
    float widthScale = mix(1.5, 4.8, widthT);
    float py = p.y / widthScale;

    // Chromatic distortion
    float d  = length(p) * 0.3;
    float rx = p.x * (1.0 + d);
    float bx = p.x * (1.0 - d);

    // Beam color channels (wave-based)
    float r = 0.06 / max(abs(py + sin((rx - time) * 9.0) * 0.008), 0.025);
    float g = 0.06 / max(abs(py + sin((p.x - time) * 9.0) * 0.008), 0.025);
    float b = 0.06 / max(abs(py + sin((bx - time) * 9.0) * 0.008), 0.025);

    // ► BEAM_COLOR tint: (R, G, B) multiplier — currently cool white/cyan
    vec3 col = clamp(vec3(r, g, b) * 1.8, 0.0, 4.0) * vec3(0.6, 0.92, 1.0);

    // Core + halo shape
    // ► CORE_TIGHTNESS (14.0) — higher = thinner bright center
    // ► HALO_TIGHTNESS (2.5)  — higher = less glow spread
    float core = exp(-abs(py) * 14.0);
    float halo = exp(-abs(py) * 2.5);
    float shape = clamp(core * 0.8 + halo * 0.3, 0.0, 1.0);

    // Head/tail fade
    // ► FADE_IN  start (0.05) — how quickly beam appears at left
    // ► FADE_OUT end   (0.85) — where beam starts fading before right edge
    float fade = smoothstep(0.0, 0.05, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));

    // ► OVERALL_OPACITY (0.7) — master alpha multiplier
    float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0) * shape * fade * 0.7;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ==========================================================================
   Enhanced Parametric Beam Fragment Shader
   — parametric: xScale/yScale control wave freq/amplitude, distortion
     drives chromatic RGB separation, intensity/amplitude tune brightness.
   ========================================================================== */

export const BEAM_FRAG_ENHANCED = /* glsl */ `
  precision highp float;

  uniform float time;
  uniform float xScale;
  uniform float yScale;
  uniform float distortion;
  uniform float intensity;
  uniform float amplitude;
  uniform vec3  beamColor;
  uniform float widthGrowStart;
  uniform float widthGrowEnd;

  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;

    float widthT     = smoothstep(widthGrowStart, widthGrowEnd, vUv.x);
    float widthScale = mix(0.3, 2.2, widthT);
    float py         = p.y / widthScale;

    float d  = length(p) * distortion;
    float rx = p.x * (1.0 + d);
    float gx = p.x;
    float bx = p.x * (1.0 - d);

    float r = 0.06 / max(abs(py + sin((rx - time) * xScale) * yScale), 0.03);
    float g = 0.06 / max(abs(py + sin((gx - time) * xScale) * yScale), 0.03);
    float b = 0.06 / max(abs(py + sin((bx - time) * xScale) * yScale), 0.03);

    vec3 spectrum  = clamp(vec3(r, g, b) * intensity, 0.0, 5.0);
    vec3 col       = spectrum * beamColor;

    float core      = exp(-abs(py) * 12.0);
    float halo      = exp(-abs(py) * 2.2);
    float beamShape = clamp(core * 0.8 + halo * 0.35, 0.0, 1.0);
    float fadeEnds  = smoothstep(0.0, 0.02, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));

    float alpha = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0)
                * beamShape * fadeEnds * amplitude;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ==========================================================================
   Glass Monitor Diffraction Overlay Fragment Shader
   — shows chromatic rainbow rings emanating from beam impact UV,
     plus surface shimmer and edge fresnel glow.
   ========================================================================== */

export const GLASS_FRAG = /* glsl */ `
  precision highp float;

  uniform float time;
  uniform vec2  impactUv;

  varying vec2 vUv;

  void main() {
    vec2  dir      = vUv - impactUv;
    float dist     = length(dir);

    // Expanding chromatic rings from impact point
    float ringPhase = dist * 16.0 - time * 0.38;
    float rings     = 0.5 + 0.5 * sin(ringPhase);
    float ringFade  = exp(-dist * 3.8);

    vec3 rainbow = vec3(
      0.5 + 0.5 * sin(rings * 6.283),
      0.5 + 0.5 * sin(rings * 6.283 + 2.094),
      0.5 + 0.5 * sin(rings * 6.283 + 4.188)
    ) * ringFade * 0.65;

    // Subtle surface shimmer
    float shimmer  = sin(vUv.x * 55.0 + time * 0.12) * cos(vUv.y * 38.0 - time * 0.09) * 0.01;

    // Horizontal scanlines, brightest near impact
    float scanline = 0.5 + 0.5 * sin(vUv.y * 120.0);
    float scanMix  = scanline * 0.012 * ringFade;

    // Fresnel edge glow
    vec2  edgeCoord = abs(vUv * 2.0 - 1.0);
    float fresnel   = pow(max(edgeCoord.x, edgeCoord.y), 5.0);

    vec3 glassTint = vec3(0.55, 0.82, 0.98) * (0.025 + shimmer + scanMix);
    vec3 col = glassTint + rainbow + vec3(fresnel * 0.06, fresnel * 0.12, fresnel * 0.18);

    float alpha = 0.04 + ringFade * 0.28 + fresnel * 0.10;
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ==========================================================================
   Offscreen Gradient Render Source (for screen + floor projection textures)
   ========================================================================== */

/** Creates an offscreen render source for the animated gradient texture */
export function createGradientRenderSource(renderer, width = 1024, height = 576) {
  const w = Math.max(2, Math.floor(width));
  const h = Math.max(2, Math.floor(height));

  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const material = new THREE.ShaderMaterial({
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
    uniforms: {
      uTime:                    { value: 0 },
      uProjectionIntensity:     { value: 0.5 },
      uReflectionGain:          { value: 1.0 },
      uHighlightBoost:          { value: 1.65 },
      uLumaVisibilityThreshold: { value: 0.3 },
      uInvertColor:             { value: 0 },
      uHalftone:                { value: 0 },
      uToneCut:                 { value: 0 },
      uMouse:                   { value: new THREE.Vector2(0.5, 0.5) },
      uMouseActive:             { value: 0 },
      uZoomProgress:            { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  const target = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.SRGBColorSpace,
    depthBuffer: false,
    stencilBuffer: false,
  });

  return {
    texture: target.texture,

    setMouse(x, y, strength) {
      material.uniforms.uMouse.value.set(x, y);
      material.uniforms.uMouseActive.value = strength;
    },

    setZoomProgress(p) {
      material.uniforms.uZoomProgress.value = p;
    },

    render(gl, t) {
      const prev = gl.getRenderTarget();
      const xr = gl.xr.enabled;
      gl.xr.enabled = false;
      material.uniforms.uTime.value = t;
      gl.setRenderTarget(target);
      gl.clear();
      gl.render(scene, camera);
      gl.setRenderTarget(prev);
      gl.xr.enabled = xr;
    },

    setEffects(e) {
      material.uniforms.uProjectionIntensity.value     = e.projectionIntensity;
      material.uniforms.uReflectionGain.value          = e.reflectionGain;
      material.uniforms.uHighlightBoost.value          = e.highlightBoost;
      material.uniforms.uLumaVisibilityThreshold.value = e.lumaVisibilityThreshold;
      material.uniforms.uInvertColor.value             = e.invertColor ? 1 : 0;
      material.uniforms.uHalftone.value                = e.halftone ? 1 : 0;
      material.uniforms.uToneCut.value                 = e.toneCut ? 1 : 0;
    },

    dispose() {
      quad.geometry.dispose();
      material.dispose();
      target.dispose();
    },
  };
}
