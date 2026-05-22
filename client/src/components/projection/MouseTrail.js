import * as THREE from "three";

export default class MouseTrail {
  constructor(width = 256, height = 144) {
    this.currentX = null;
    this.currentY = null;
    this.lastX = null;
    this.lastY = null;
    this.opacity = 0;
    this.lerpSpeed = 0.3;
    this.fadeSpeed = 0.05;
    this.growSpeed = 0.15;

    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");
    this.lineWidth = Math.max(width * 0.2, 50);

    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, width, height);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
  }

  update(mouseX, mouseY) {
    const targetX = mouseX * this.canvas.width;
    const targetY = mouseY * this.canvas.height;

    if (this.currentX === null) {
      this.currentX = targetX;
      this.currentY = targetY;
      this.lastX = targetX;
      this.lastY = targetY;
      return;
    }

    // Lerp toward target
    this.currentX += (targetX - this.currentX) * this.lerpSpeed;
    this.currentY += (targetY - this.currentY) * this.lerpSpeed;

    // Update opacity based on movement
    const dx = this.currentX - this.lastX;
    const dy = this.currentY - this.lastY;
    const moved = Math.sqrt(dx * dx + dy * dy) > 0.5;

    if (moved) {
      this.opacity = Math.min(1, this.opacity + this.growSpeed);
    } else {
      this.opacity = Math.max(0, this.opacity - this.fadeSpeed);
    }

    // Draw
    const { canvas, ctx, lineWidth } = this;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (this.opacity > 0.01) {
      ctx.beginPath();
      ctx.moveTo(this.lastX, this.lastY);
      ctx.lineTo(this.currentX, this.currentY);
      ctx.lineCap = "round";
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = `rgba(0, 0, 0, ${this.opacity})`;
      ctx.stroke();
    }

    this.lastX = this.currentX;
    this.lastY = this.currentY;
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}
