/* ============================================================
   THE CINEPHILE VAULT — Animations & Luxury UX
   ============================================================ */

/* ─── Seal the Vault Ceremony ─── */
function triggerSealCeremony() {
  const ceremony = document.getElementById('seal-ceremony');
  if (!ceremony) return;

  ceremony.classList.add('active');

  /* Gold particle burst from centre */
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  ParticleEngine.burst(cx, cy, 140);

  /* Mobile haptic (where available) */
  if (navigator.vibrate) {
    navigator.vibrate([30, 50, 80, 50, 150]);
  }

  /* Dismiss after 3.2s */
  setTimeout(() => {
    ceremony.classList.remove('active');
    showToast('Your review has been sealed in the Vault.');
  }, 3200);
}

/* ─── Intersection Observer: fade-in on scroll ─── */
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

function observeFadeElements() {
  document.querySelectorAll('.movie-card, .stat-card, .cast-card, .review-card, .timeline-node-card')
    .forEach(el => {
      if (el.style.opacity !== '1') {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        fadeObserver.observe(el);
      }
    });
}

/* Observe after any render */
const _origRenderGallery = typeof renderGallery !== 'undefined' ? renderGallery : null;
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(observeFadeElements, 200);
  setInterval(observeFadeElements, 800);
});

/* ─── Hero background auto-rotate ─── */
function initHeroBgRotation() {
  const heroImg = document.getElementById('hero-bg-img');
  if (!heroImg) return;

  const posters = State.vault
    .filter(m => m.poster)
    .map(m => m.poster)
    .slice(0, 6);

  if (posters.length < 2) return;

  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % posters.length;
    heroImg.style.opacity   = '0';
    heroImg.style.transform = 'scale(1.12)';
    heroImg.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
    setTimeout(() => {
      heroImg.src = posters[idx];
      heroImg.style.opacity   = '0.18';
      heroImg.style.transform = 'scale(1.08)';
    }, 1200);
  }, 6000);
}

/* ─── Gold dust on hover over section titles ─── */
document.addEventListener('mouseover', e => {
  const title = e.target.closest('.section-title');
  if (!title) return;
  const rect = title.getBoundingClientRect();
  ParticleEngine.burst(
    rect.left + rect.width  / 2,
    rect.top  + rect.height / 2,
    14
  );
}, { passive: true });

/* ─── Spoiler curtain swipe support ─── */
(function initVelvetSwipe() {
  let startX = 0;
  document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 60) {
      const vc = e.target.closest('.velvet-curtain');
      if (vc) vc.classList.add('revealed');
    }
  }, { passive: true });
})();

/* ─── Poster slide-in animation helper ─── */
function animatePosterSwap(imgEl, newSrc) {
  imgEl.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
  imgEl.style.transform  = 'translateX(-100%)';
  imgEl.style.opacity    = '0';
  setTimeout(() => {
    imgEl.src = newSrc;
    imgEl.style.transform = 'translateX(0)';
    imgEl.style.opacity   = '1';
  }, 420);
}

/* ─── Init on load ─── */
window.addEventListener('load', () => {
  initHeroBgRotation();
  observeFadeElements();
});
