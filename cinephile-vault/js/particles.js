/* ============================================================
   THE CINEPHILE VAULT — Gold Particle Engine
   ============================================================ */

const ParticleEngine = (() => {
  const canvas  = document.getElementById('seal-canvas');
  const ctx     = canvas ? canvas.getContext('2d') : null;
  let   particles = [];
  let   animId    = null;
  let   running   = false;

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  class Particle {
    constructor(x, y) {
      this.x   = x || window.innerWidth  / 2;
      this.y   = y || window.innerHeight / 2;
      this.vx  = (Math.random() - 0.5) * 8;
      this.vy  = (Math.random() - 2.5) * 6;
      this.ax  = (Math.random() - 0.5) * 0.2;
      this.ay  = 0.12 + Math.random() * 0.1;
      this.r   = 1.5 + Math.random() * 3;
      this.life= 1.0;
      this.decay = 0.012 + Math.random() * 0.01;
      this.rot = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.18;
      /* Colour variation: gold, amber, platinum */
      const palette = [
        'rgba(201,168,76,',
        'rgba(212,137,10,',
        'rgba(232,201,106,',
        'rgba(232,232,232,',
        'rgba(240,208,128,'
      ];
      this.colour = palette[Math.floor(Math.random() * palette.length)];
    }

    update() {
      this.vx   += this.ax;
      this.vy   += this.ay;
      this.x    += this.vx;
      this.y    += this.vy;
      this.rot  += this.rotSpeed;
      this.life -= this.decay;
    }

    draw() {
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);

      /* Sparkle: 4-pointed star */
      const s = this.r;
      ctx.fillStyle = this.colour + Math.min(1, this.life) + ')';
      ctx.shadowColor = this.colour + '0.8)';
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      ctx.moveTo(0, -s * 2);
      ctx.lineTo(s * 0.5, -s * 0.5);
      ctx.lineTo(s * 2, 0);
      ctx.lineTo(s * 0.5, s * 0.5);
      ctx.lineTo(0, s * 2);
      ctx.lineTo(-s * 0.5, s * 0.5);
      ctx.lineTo(-s * 2, 0);
      ctx.lineTo(-s * 0.5, -s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function burst(x, y, count = 120) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y));
    }
  }

  function loop() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    if (particles.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return {
    burst(x, y, count) {
      burst(x, y, count);
      if (!running) {
        running = true;
        loop();
      }
    }
  };
})();
