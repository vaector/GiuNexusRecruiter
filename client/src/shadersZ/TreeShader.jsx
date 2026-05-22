import { useEffect, useRef } from "react";

export default function TreeShader({ style }) {
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
      void main() { gl_Position = vec4(a_position, 0, 1); }
    `;

    const fragSrc = `#version 300 es
      precision mediump float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec2 iMouse;
      out vec4 fragColor;

      float hash(float n) { return fract(sin(n) * 43758.5453123); }

      vec2 udSegment(in vec2 p, in vec2 a, in vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return vec2(length(pa - ba * h), h);
      }

      struct Segment {
        vec2 p;
        float a;
        float l;
        float wa;
        float wb;
        int level;
      };

      void main() {
        vec2 p = (-iResolution.xy + 2.0 * gl_FragCoord.xy) / iResolution.y;
        vec2 m = vec2(0.0);
        if (iMouse.x > 0.0) m = -1.0 + 2.0 * iMouse.xy / iResolution.xy;

        Segment stack[16];
        stack[0] = Segment(vec2(0.0, -0.85), 0.0, 0.6, 0.13, 0.08, 0);
        int s = 0;

        float id = 0.0;
        float f = 100.0;
        float g = 100.0;

        for (int i = 0; i < 63; i++) {
          Segment x = stack[s--];
          vec2 a = x.p;
          vec2 b = x.p + x.l * vec2(sin(x.a), cos(x.a));
          vec2 h = udSegment(p, a, b);
          float d = h.x - mix(x.wa, x.wb, h.y);
          f = min(f, d);
          g = min(g, abs(d));
          id += 1.0;
          if (x.level < 5) {
            float an = m.x + 0.5 * sin(8.0 * x.l + iTime) * x.l;
            float a1 = 0.2 + 0.8 * hash(3313.115 * id) + an;
            float a2 = 0.2 + 0.8 * hash(1241.506 * id) - an;
            float l1 = 0.5 + 0.3 * hash(5241.343 * id);
            float l2 = 0.5 + 0.3 * hash(9741.241 * id);
            stack[++s] = Segment(b, x.a + a1, x.l * l1, x.wb, x.wb * 0.65, x.level + 1);
            stack[++s] = Segment(b, x.a - a2, x.l * l2, x.wb, x.wb * 0.65, x.level + 1);
          }
        }

        vec3 col = 0.2 + 0.6 * vec3(sqrt(abs(f)));
        col += 0.03 * sin(180.0 * f);
        col = mix(vec3(1.0, 0.7, 0.3), col, smoothstep(0.0, 0.005, f));
        col *= smoothstep(0.0, 0.01, g);

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

    const uTime  = gl.getUniformLocation(prog, "iTime");
    const uRes   = gl.getUniformLocation(prog, "iResolution");
    const uMouse = gl.getUniformLocation(prog, "iMouse");

    let mouseX = 0, mouseY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = canvas.height - e.clientY;
    });

    let frame;
    const start = performance.now();
    function render() {
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseX, mouseY);
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