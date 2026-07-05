/* ============================================================
   THE CINEPHILE VAULT — Core App, Navigation & Utilities
   ============================================================ */

/* ─── Current Context ─── */
let currentMovieId  = null;
let activeTab       = 'reviews';
let currentGenreFilter = 'all';
let ambientMuted    = false;
let ambientCtx      = null;
let ambientNodes    = null;

/* ─── Bootstrap ─── */
document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  renderGallery();
  renderProfileStats();
  initNavbarScroll();
  initMoodboardSlots();
  initParallelTilt();
  updateFabVisibility();
});

/* ─── Page Router ─── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  /* Update nav links */
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const map = { home:'The Vault', rankings:'Rankings', timeline:'Timeline',
                dashboard:'Dashboard', profile:'My Archive' };
  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.textContent.trim() === (map[name]||'')) l.classList.add('active');
  });

  /* Lazy-render pages */
  if (name === 'dashboard') renderDashboard();
  if (name === 'rankings')  renderRankings();
  if (name === 'timeline')  renderTimeline();
  if (name === 'profile')   { renderProfileStats(); renderHighlights(); renderProfileCollection(); }
}

/* ─── Navbar Scroll Effect ─── */
function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

/* ─── FAB Visibility ─── */
function updateFabVisibility() {
  const fab = document.getElementById('fab-add');
  if (!fab) return;
  window.addEventListener('scroll', () => {
    fab.style.transform = window.scrollY > 100
      ? 'translateY(0)'
      : 'translateY(0)';
  }, { passive: true });
}

/* ─── Mobile Menu ─── */
function toggleMobileMenu() {
  const nav = document.querySelector('.navbar-nav');
  if (!nav) return;
  const isOpen = nav.style.display === 'flex';
  nav.style.cssText = isOpen
    ? ''
    : 'display:flex;flex-direction:column;position:fixed;top:72px;left:0;right:0;' +
      'background:rgba(10,10,10,0.98);padding:var(--sp-4);border-bottom:1px solid rgba(201,168,76,0.15);z-index:var(--z-sticky);';
}

/* ─── Search ─── */
function toggleSearch() {
  const overlay = document.getElementById('search-overlay');
  const isOpen  = overlay.classList.toggle('open');
  if (isOpen) {
    setTimeout(() => document.getElementById('global-search').focus(), 100);
  } else {
    document.getElementById('global-search').value = '';
    document.getElementById('global-search-results').innerHTML = '';
  }
}

function handleGlobalSearch(q) {
  const container = document.getElementById('global-search-results');
  if (!q.trim()) { container.innerHTML = ''; return; }
  const results = State.vault.filter(m =>
    m.title.toLowerCase().includes(q.toLowerCase()) ||
    (m.director||'').toLowerCase().includes(q.toLowerCase())
  ).slice(0, 8);

  if (!results.length) {
    container.innerHTML = `<p style="color:var(--text-dim);padding:var(--sp-4);font-style:italic;">No titles found in your vault.</p>`;
    return;
  }
  container.innerHTML = results.map(m => `
    <div class="search-result-item" onclick="openMovieDetail('${m.id}');toggleSearch();">
      <img class="search-result-poster" src="${m.poster||''}"
           onerror="this.style.background='var(--bg-surface)';this.removeAttribute('src')" alt="${m.title}" />
      <div class="search-result-info">
        <div class="search-result-title">${m.title}</div>
        <div class="search-result-meta">${m.year||''} · ${m.director||''}</div>
      </div>
      <span class="search-result-type">${m.type||'film'}</span>
    </div>`).join('');
}

/* ─── Modal Helpers ─── */
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAllModals();
    closeProjectionChamber();
    closeReviewStudio();
    if (document.getElementById('search-overlay').classList.contains('open')) toggleSearch();
  }
});
function closeAllModals() {
  document.querySelectorAll('.modal-backdrop.open').forEach(m => {
    m.classList.remove('open');
  });
  document.body.style.overflow = '';
}

/* ─── Acquisition Desk ─── */
function openAcquisitionDesk() {
  clearAcquisitionForm();
  openModal('acquisition-modal');
}
function clearAcquisitionForm() {
  ['acq-title','acq-year','acq-director','acq-runtime','acq-synopsis','acq-trailer']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('trailer-preview-box').innerHTML = `
    <div class="trailer-preview-placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <span>Paste a YouTube URL to preview</span>
    </div>`;
  document.getElementById('poster-preview-box').innerHTML = `
    <div class="upload-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <span>Upload</span>
    </div>`;
  window._acquiredPosterDataUrl = null;
  document.querySelectorAll('#acq-genre-grid .wax-tag').forEach(t => t.classList.remove('active'));
  document.querySelector('input[name="acq-type"][value="film"]').checked = true;
}

function toggleGenreTag(el) {
  el.classList.toggle('active');
}

/* YouTube embed helper */
function youtubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0` : null;
}
function youtubeVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function previewTrailer(url) {
  const box    = document.getElementById('trailer-preview-box');
  const embedUrl = youtubeEmbedUrl(url);
  if (embedUrl) {
    box.innerHTML = `<iframe src="${embedUrl}" allowfullscreen title="Trailer preview"></iframe>`;
  } else {
    box.innerHTML = `
      <div class="trailer-preview-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Paste a YouTube URL to preview</span>
      </div>`;
  }
}

function triggerPosterFileInput() {
  document.getElementById('poster-file-input').click();
}
function handlePosterUpload(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    window._acquiredPosterDataUrl = e.target.result;
    const box = document.getElementById('poster-preview-box');
    box.innerHTML = `<img src="${e.target.result}" alt="Poster preview" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" />`;
  };
  reader.readAsDataURL(input.files[0]);
}

/* TMDB-style search simulation (uses open TMDB API if key provided, else uses local data) */
const TMDB_KEY = ''; // Optionally add your TMDB API key here
async function handleAcqSearch(q) {
  const dropdown = document.getElementById('acq-suggestions');
  if (!q.trim() || q.length < 2) { dropdown.classList.remove('open'); return; }

  /* Try TMDB */
  if (TMDB_KEY) {
    try {
      const res  = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&page=1`);
      const data = await res.json();
      renderSuggestions(data.results.slice(0,7).map(r => ({
        title:     r.title || r.name,
        year:      (r.release_date||r.first_air_date||'').slice(0,4),
        type:      r.media_type === 'tv' ? 'series' : 'film',
        poster:    r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : '',
        synopsis:  r.overview || '',
        tmdb_id:   r.id
      })));
      return;
    } catch(e) { /* fall through */ }
  }

  /* Fallback: search local vault */
  const local = State.vault.filter(m =>
    m.title.toLowerCase().includes(q.toLowerCase())
  ).slice(0,5).map(m => ({ ...m, fromVault: true }));
  renderSuggestions(local);
}

function renderSuggestions(items) {
  const dropdown = document.getElementById('acq-suggestions');
  if (!items.length) { dropdown.classList.remove('open'); return; }
  dropdown.innerHTML = items.map(item => `
    <div class="suggest-item" onclick="fillAcqForm(${JSON.stringify(item).replace(/"/g,'&quot;')})">
      <img class="suggest-item-poster" src="${item.poster||''}"
           onerror="this.style.visibility='hidden'" alt="${item.title}" />
      <div>
        <div class="suggest-item-title">${item.title}</div>
        <div class="suggest-item-meta">${item.year||''}</div>
      </div>
      <span class="suggest-item-type">${item.type||'film'}</span>
    </div>`).join('');
  dropdown.classList.add('open');
}

function fillAcqForm(item) {
  document.getElementById('acq-title').value    = item.title  || '';
  document.getElementById('acq-year').value     = item.year   || '';
  document.getElementById('acq-synopsis').value = item.synopsis || '';
  if (item.poster) {
    window._acquiredPosterDataUrl = item.poster;
    document.getElementById('poster-preview-box').innerHTML =
      `<img src="${item.poster}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" alt="Poster" />`;
  }
  const typeVal = item.type === 'series' ? 'series' : 'film';
  const radio   = document.querySelector(`input[name="acq-type"][value="${typeVal}"]`);
  if (radio) radio.checked = true;
  document.getElementById('acq-suggestions').classList.remove('open');
  document.getElementById('acq-search').value = item.title;
}

function submitAcquisition() {
  const title = document.getElementById('acq-title').value.trim();
  const year  = document.getElementById('acq-year').value.trim();
  if (!title) { showToast('Please enter a title.'); return; }

  const genres = [...document.querySelectorAll('#acq-genre-grid .wax-tag.active')]
                   .map(t => t.dataset.genre);
  const type   = document.querySelector('input[name="acq-type"]:checked').value;

  const movie = addMovie({
    title,
    year:      year || '',
    director:  document.getElementById('acq-director').value.trim(),
    runtime:   document.getElementById('acq-runtime').value.trim(),
    synopsis:  document.getElementById('acq-synopsis').value.trim(),
    trailer:   document.getElementById('acq-trailer').value.trim(),
    poster:    window._acquiredPosterDataUrl || '',
    genres,
    type
  });

  closeModal('acquisition-modal');
  renderGallery();
  renderProfileStats();
  showToast(`"${title}" has been added to your vault.`);
  openMovieDetail(movie.id);
}

/* ─── Tab Switcher ─── */
function switchTab(btn, panel) {
  btn.closest('.detail-tabs-inner').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('tab-' + panel);
  if (target) target.classList.add('active');
  activeTab = panel;
}

function switchProfileTab(btn, panel) {
  document.querySelectorAll('#profile-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['highlights','collection','about'].forEach(t => {
    const el = document.getElementById('profile-tab-' + t);
    if (el) el.classList.toggle('active', t === panel);
  });
}

/* ─── Toast ─── */
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  msgEl.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ─── Profile Bio Edit ─── */
function editProfileBio() {
  const el = document.getElementById('profile-bio');
  const current = el.textContent.trim();
  el.contentEditable = 'true';
  el.style.outline   = '1px solid rgba(201,168,76,0.3)';
  el.style.padding    = 'var(--sp-3)';
  el.style.borderRadius = 'var(--radius-sm)';
  el.focus();
  el.onblur = () => {
    el.contentEditable = 'false';
    el.style.outline = '';
    el.style.padding = '';
    State.profile.bio = el.textContent.trim();
    saveState();
    showToast('Archive notes updated.');
  };
}

/* ─── Lightbox ─── */
function openLightbox(src) {
  const box = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  box.classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

/* ─── Poster Update (Re-Hang the Portrait) ─── */
function triggerPosterUpdate() {
  document.getElementById('poster-update-input').click();
}
function handlePosterUpdate(input) {
  if (!input.files[0] || !currentMovieId) return;
  const reader = new FileReader();
  reader.onload = e => {
    updateMovie(currentMovieId, { poster: e.target.result });
    document.getElementById('detail-poster-img').src = e.target.result;
    document.getElementById('detail-bg-img').src     = e.target.result;
    renderGallery();
    showToast('Portrait updated — the vault reflects the change.');

    /* Swap animation */
    const img = document.getElementById('detail-poster-img');
    img.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
    img.style.transform  = 'translateX(-100%)';
    img.style.opacity    = '0';
    setTimeout(() => {
      img.src = e.target.result;
      img.style.transform = 'translateX(0)';
      img.style.opacity   = '1';
    }, 400);
  };
  reader.readAsDataURL(input.files[0]);
}

/* ─── 3D Parallax Tilt ─── */
function initParallelTilt() {
  document.addEventListener('mousemove', handleTilt, { passive: true });
}

function handleTilt(e) {
  document.querySelectorAll('.movie-card').forEach(card => {
    const rect  = card.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    const cx    = rect.left + rect.width  / 2;
    const cy    = rect.top  + rect.height / 2;
    const dx    = (e.clientX - cx) / (rect.width  / 2);
    const dy    = (e.clientY - cy) / (rect.height / 2);
    const dist  = Math.sqrt(dx*dx + dy*dy);
    if (dist > 2) {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
      return;
    }
    const rotX  = -dy * 8;
    const rotY  =  dx * 8;
    const shine = Math.max(0, 1 - dist);
    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    card.style.setProperty('--shine', shine);
  });
}

/* ─── Gyroscope tilt on mobile ─── */
window.addEventListener('deviceorientation', e => {
  if (e.beta === null) return;
  const rotX = Math.max(-10, Math.min(10, (e.beta  - 45) / 5));
  const rotY = Math.max(-10, Math.min(10,  e.gamma       / 5));
  document.querySelectorAll('.movie-card').forEach(card => {
    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
}, { passive: true });

/* Remove tilt when mouse leaves viewport */
document.addEventListener('mouseleave', () => {
  document.querySelectorAll('.movie-card').forEach(card => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
});
