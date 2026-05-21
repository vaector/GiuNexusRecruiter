import * as THREE from "three";

const FLUID_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FLUID_FRAG = /* glsl */ `
  precision highp float;

  uniform sampler2D uPrev;
  uniform sampler2D uInput;
  uniform float uAspect;

  // Simple hash-based noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.0 + vec2(17.0, 31.0);
      a *= 0.5;
    }
    return v;
  }

  varying vec2 vUv;

  void main() {
    vec2 aspectVec = uAspect > 1.0 ? vec2(1.0, 1.0 / uAspect) : vec2(uAspect, 1.0);
    vec2 disp = fbm(vUv * 20.0) * aspectVec * 0.01;

    // Sample previous frame at offset positions (darken blend = min)
    vec3 texel  = texture2D(uPrev, vUv).rgb;
    vec3 texel2 = texture2D(uPrev, vec2(vUv.x + disp.x, vUv.y)).rgb;
    vec3 texel3 = texture2D(uPrev, vec2(vUv.x - disp.x, vUv.y)).rgb;
    vec3 texel4 = texture2D(uPrev, vec2(vUv.x, vUv.y + disp.y)).rgb;
    vec3 texel5 = texture2D(uPrev, vec2(vUv.x, vUv.y - disp.y)).rgb;

    vec3 flood = min(texel, texel2);
    flood = min(flood, texel3);
    flood = min(flood, texel4);
    flood = min(flood, texel5);

    // Blend in new mouse trail input (darken)
    vec2 flippedUV = vec2(vUv.x, 1.0 - vUv.y);
    vec3 input = texture2D(uInput, flippedUV).rgb;
    vec3 combined = min(flood, input);

    // Fade back to white
    gl_FragColor = vec4(min(vec3(1.0), combined + vec3(0.015)), 1.0);
  }
`;

export default class FluidSim {
  constructor(width = 256, height = 144) {
    this.width = width;
    this.height = height;

    const opts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.targetA = new THREE.WebGLRenderTarget(width, height, opts);
    this.targetB = new THREE.WebGLRenderTarget(width, height, opts);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader: FLUID_VERT,
      fragmentShader: FLUID_FRAG,
      uniforms: {
        uPrev: { value: null },
        uInput: { value: null },
        uAspect: { value: height / width },
      },
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(quad);

    // The mask texture that downstream consumers read
    this.maskTexture = this.targetB.texture;
  }

  update(renderer, trailTexture) {
    this.material.uniforms.uPrev.value = this.targetA.texture;
    this.material.uniforms.uInput.value = trailTexture;

    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.targetB);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(prev);

    this.maskTexture = this.targetB.texture;

    // Swap
    const temp = this.targetA;
    this.targetA = this.targetB;
    this.targetB = temp;
  }

  dispose() {
    this.targetA.dispose();
    this.targetB.dispose();
    this.material.dispose();
  }
}
