import React, { useEffect, useRef } from "react";

function genArtDeco(size) {
  let map = [];
  for (let i = 0; i < size; i++)
    for (let j = 0; j < size; j++) {
      let diag = (i + j) % (size * 2);
      let curve = Math.sin(i * 0.8) * Math.cos(j * 0.8);
      map.push(((diag / (size * 2) + curve * 0.2) % 1.0));
    }
  let min = Math.min(...map), max = Math.max(...map);
  return map.map((v) => (v - min) / (max - min));
}

const ditherMap = genArtDeco(8);
const mapSize = 8;

function applyDither(ctx, srcData, patternScale, brightness, contrast, invert, offset) {
  const width = srcData.width, height = srcData.height;
  const out = ctx.createImageData(width, height);
  const src = srcData.data, dst = out.data;
  const sf = Math.max(0.25, patternScale);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let lum = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
      let adj = (lum - 128) * contrast + brightness;
      adj = Math.min(255, Math.max(0, adj));
      let nl = adj / 255;
      if (invert) nl = 1 - nl;
      nl = Math.min(0.99, Math.max(0.01, nl + offset));
      const mx = Math.floor(x / sf) % mapSize;
      const my = Math.floor(y / sf) % mapSize;
      const v = nl > ditherMap[my * mapSize + mx] ? 255 : 0;
      dst[idx] = dst[idx + 1] = dst[idx + 2] = v;
      dst[idx + 3] = 255;
    }
  }
  return out;
}

export default function GlitchLoader({ onComplete }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let w, h, raf;
    let imgBitmap = null, imgData = null;
    let glitchIntensity = 0, glitching = false;

    function resize() {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
      if (imgBitmap) {
        const scale = 0.5;
        const tw = Math.round(w * scale);
        const th = Math.round((imgBitmap.height / imgBitmap.width) * tw);
        const tempC = document.createElement("canvas");
        tempC.width = tw; tempC.height = th;
        const tCtx = tempC.getContext("2d");
        tCtx.drawImage(imgBitmap, 0, 0, tw, th);
        imgData = tCtx.getImageData(0, 0, tw, th);
      }
    }
    resize();
    window.addEventListener("resize", resize);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = async () => { imgBitmap = await createImageBitmap(img); resize(); };
    img.onerror = () => {
      const fc = document.createElement("canvas"); fc.width = 800; fc.height = 500;
      const fctx = fc.getContext("2d");
      const grad = fctx.createLinearGradient(0, 0, 800, 500);
      grad.addColorStop(0, "#1a3a4a"); grad.addColorStop(1, "#0a1520");
      fctx.fillStyle = grad; fctx.fillRect(0, 0, 800, 500);
      fctx.fillStyle = "#4af";
      for (let i = 0; i < 80; i++) { fctx.beginPath(); fctx.arc(Math.random() * 800, Math.random() * 500, Math.random() * 6 + 1, 0, Math.PI * 2); fctx.fill(); }
      fc.toBlob(async (blob) => { imgBitmap = await createImageBitmap(blob); resize(); });
    };
    img.src = "/mygoat.jpg";

    function triggerGlitchOut() { glitching = true; }

    function draw() {
      const t = performance.now() * 0.001;
      ctx.fillStyle = "#040408"; ctx.fillRect(0, 0, w, h);

      if (imgData) {
        const scale = 1.0 + Math.sin(t * 0.5) * 0.4;
        const brightness = 128 + Math.sin(t * 0.8) * 30;
        const contrast = 1.0 + Math.sin(t * 0.3) * 0.3;
        const offset = Math.sin(t * 0.6) * 0.1;
        const dithered = applyDither(ctx, imgData, scale, brightness, contrast, false, offset);
        const dx = Math.floor((w - imgData.width) / 2);
        const dy = Math.floor((h - imgData.height) / 2);
        ctx.putImageData(dithered, dx, dy);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.shadowColor = "rgba(80,200,220,0.2)";
        ctx.shadowBlur = 600;
        ctx.drawImage(c, dx, dy, imgData.width, imgData.height, dx, dy, imgData.width, imgData.height);
        ctx.restore();
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "rgba(20,180,200,0.15)"; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }

      if (glitching) {
        glitchIntensity = Math.min(glitchIntensity + 0.05, 1);
        const gi = glitchIntensity;
        const slices = Math.floor(3 + gi * 15);
        for (let s = 0; s < slices; s++) {
          const sy = Math.floor(Math.random() * h);
          const sh = Math.floor(2 + Math.random() * 25 * gi);
          const dx = Math.floor((Math.random() - 0.5) * w * gi * 0.6);
          try { ctx.putImageData(ctx.getImageData(Math.max(0, -dx), sy, w - Math.abs(dx), sh), Math.max(0, dx), sy); } catch (e) {}
        }
        const shift = Math.floor(gi * 20);
        if (shift > 0) {
          const id = ctx.getImageData(0, 0, w, h);
          const shifted = ctx.createImageData(w, h);
          for (let i = 0; i < id.data.length; i += 4) {
            shifted.data[i] = id.data[Math.min(i + shift * 4, id.data.length - 4)] || 0;
            shifted.data[i + 1] = id.data[i + 1];
            shifted.data[i + 2] = id.data[Math.max(i - shift * 4, 0) + 2] || 0;
            shifted.data[i + 3] = 255;
          }
          ctx.putImageData(shifted, 0, 0);
        }
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
        if (gi >= 1) {
          cancelAnimationFrame(raf);
          if (!doneRef.current) { doneRef.current = true; onComplete?.(); }
          return;
        }
      } else {
        if (Math.random() < 0.04) {
          const sy = Math.floor(Math.random() * h);
          const sh = 1 + Math.floor(Math.random() * 3);
          const dx = Math.floor((Math.random() - 0.5) * 8);
          try { ctx.putImageData(ctx.getImageData(0, sy, w, sh), dx, sy); } catch (e) {}
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    // Auto-trigger glitch-out after short delay
    const timer = setTimeout(triggerGlitchOut, 300);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 999, background: "#040408", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
