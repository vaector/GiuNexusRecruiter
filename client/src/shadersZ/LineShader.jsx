import { useEffect, useRef } from "react";

export default function LineShader({ style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const vertSrc = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
      }
    `;

    const fragSrc = `#version 300 es
      precision mediump float;
      uniform float iTime;
      uniform vec2 iResolution;
      out vec4 fragColor;

      #define res iResolution.xy

      mat2 rotMat(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

      float sdSegment(in vec2 p, in vec2 a, in vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }

      const vec2 s = vec2(1, 1.7320508);

      vec4 getHex(vec2 p) {
        vec4 h = vec4(p, p - s / 2.);
        vec4 iC = floor(h / s.xyxy) + .5;
        h -= iC * s.xyxy;
        return dot(h.xy, h.xy) < dot(h.zw, h.zw)
          ? vec4(h.xy, iC.xy)
          : vec4(h.zw, iC.zw + .5);
      }

      const float r = 1. / 1.7320508;

      vec2 hex[6] = vec2[](
        vec2( 0.0,  r),
        vec2( 0.5,  r * .5),
        vec2( 0.5, -r * .5),
        vec2( 0.0, -r),
        vec2(-0.5, -r * .5),
        vec2(-0.5,  r * .5)
      );

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * .1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float stripes(vec2 p) {
        float s = 50.0 / res.y;
        p.y = mod(p.y, s) - 0.5 * s;
        float d = abs(p.y) - s * 0.25;
        return smoothstep(0.0, 6.0 / res.y, d);
      }

      float hatch(vec2 p, float b) {
        float k = 1.0 - b;
        k = tanh(k * k * k * k * 5.0);
        float f = 1.0;
        p *= rotMat(radians(45.0));
        f = mix(f, f * stripes(p), k);
        return f;
      }

      float map(vec2 p) {
        vec4 he = getHex(p);
        p = he.xy;
        float h = hash12(he.zw);
        int si = 0;
        if (h > 0.5) si = 1;
        float d = 1e20;
        for (int i = 0; i < 3; i++) {
          float d1 = sdSegment(p, 0.95 * hex[2 * i + si], vec2(0)) - 0.02;
          d = min(d, d1);
        }
        return d;
      }

      void main() {
        vec2 p = 5.0 * (gl_FragCoord.xy - 0.5 * res) / res.y;
        p += 1.0 * iTime;

        float d   = map(p);
        float ds  = map(p + 25.0 / res.y);
        float ds2 = map(p + 40.0 / res.y);

        vec3 col;

        float t  = 1.0 - smoothstep(0.0, 5.0 * 2.0 / res.y, d);
        float t2 = 1.0 - smoothstep(0.0, 5.0 * 2.0 / res.y, ds);
        float t3 = 1.0 - smoothstep(0.0, 5.0 * 2.0 / res.y, ds2);
        t2 = max(0.0, t2 - t);
        t3 = max(0.0, t3 - t);
        t2 = max(t2, t3);
        col = vec3(0.9, 0.65, 0.55) * hatch(p, 1.0 - (0.5 + 0.5 * t)) * (1.0 - t) * 0.3 + (t - 0.1 * t2);

        col = pow(col, vec3(1.0) / 2.2);
        fragColor = vec4(col, 1.0);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error("Shader error:", gl.getShaderInfoLog(s));
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1,  1,-1,  -1, 1,
      -1, 1,  1,-1,   1, 1,
    ]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "iTime");
    const uRes  = gl.getUniformLocation(prog, "iResolution");

    let frame;
    const start = performance.now();
    function render() {
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: 0,
        ...style,
      }}
    />
  );
}