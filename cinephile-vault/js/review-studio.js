/* ============================================================
   THE CINEPHILE VAULT — Grand Review Studio
   ============================================================ */

let studioRating        = 0;
let studioMoodboard     = [];        // array of data URLs (max 5)
let studioReaction      = null;      // data URL
let studioReactionCaption = '';
let studioSpoiler       = null;      // data URL
let activeMoodboardSlot = null;      // slot index being filled
let ambientOscillator   = null;
let ambientGain         = null;

/* ─── Open Studio ─── */
function openReviewStudio() {
  if (!currentMovieId) { showToast('Open a film first.'); return; }
  openReviewStudioFor(currentMovieId);
}

function openReviewStudioFor(id) {
  const movie = getMovie(id);
  if (!movie) return;
  currentMovieId = id;

  /* Reset state */
  studioRating     = 0;
  studioMoodboard  = [];
  studioReaction   = null;
  studioSpoiler    = null;
  studioReactionCaption = '';

  /* Fill header */
  const posterEl = document.getElementById('studio-movie-poster');
  const titleEl  = document.getElementById('studio-movie-title');
  const yearEl   = document.getElementById('studio-movie-year');
  const bgEl     = document.getElementById('studio-backdrop-img');

  if (posterEl) { posterEl.src = movie.poster || ''; posterEl.alt = movie.title; }
  if (titleEl)  titleEl.textContent = movie.title;
  if (yearEl)   yearEl.textContent  = movie.year || '';
  if (bgEl)     bgEl.src = movie.poster || '';

  /* Clear editor */
  const editor = document.getElementById('studio-editor');
  if (editor) editor.innerHTML = '';
  updateWordCount();

  /* Render rating records */
  renderPlatinumRecords();

  /* Reset rating descriptor */
  const desc = document.getElementById('rating-descriptor');
  if (desc) { desc.textContent = 'Select a score to begin'; desc.classList.remove('has-value'); }

  /* Reset reaction */
  const reactionPrev = document.getElementById('reaction-preview');
  if (reactionPrev) reactionPrev.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>`;
  const captionInput = document.getElementById('reaction-caption');
  if (captionInput) captionInput.value = '';

  /* Reset moodboard */
  initMoodboardSlots();

  /* Reset spoiler */
  const spoilerWrap = document.getElementById('spoiler-preview-wrap');
  if (spoilerWrap) spoilerWrap.classList.add('hidden');
  const spoilerDrop = document.getElementById('spoiler-drop-area');
  if (spoilerDrop) spoilerDrop.querySelector && (spoilerDrop.querySelector('span') || {}).textContent;

  /* Open */
  const studio = document.getElementById('review-studio');
  studio.classList.add('open');
  document.body.style.overflow = 'hidden';

  /* Start ambient sound */
  if (!ambientMuted) startAmbientSound();
}

function closeReviewStudio() {
  const studio = document.getElementById('review-studio');
  studio.classList.remove('open');
  document.body.style.overflow = '';
  stopAmbientSound();
}

/* ─── Platinum Rating Records ─── */
function renderPlatinumRecords() {
  const container = document.getElementById('platinum-records');
  if (!container) return;
  container.innerHTML = Array.from({length:10}, (_,i) => `
    <div class="platinum-record ${i < studioRating ? 'active' : ''}"
         data-value="${i+1}"
         onmouseenter="hoverRecord(${i+1})"
         onmouseleave="unhoverRecord()"
         onclick="setRating(${i+1})">
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" stroke-width="2" fill="currentColor" stroke="none"/>
        <circle cx="24" cy="24" r="8" fill="var(--bg-void)" opacity="0.7"/>
        <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.6"/>
        <line x1="24" y1="4" x2="24" y2="10" stroke="var(--bg-void)" stroke-width="1.5" opacity="0.4"/>
        <line x1="24" y1="38" x2="24" y2="44" stroke="var(--bg-void)" stroke-width="1.5" opacity="0.4"/>
        <line x1="4" y1="24" x2="10" y2="24" stroke="var(--bg-void)" stroke-width="1.5" opacity="0.4"/>
        <line x1="38" y1="24" x2="44" y2="24" stroke="var(--bg-void)" stroke-width="1.5" opacity="0.4"/>
      </svg>
    </div>`).join('');
}

function setRating(val) {
  studioRating = val;
  playNeedleDrop(val);
  renderPlatinumRecords();
  const desc = document.getElementById('rating-descriptor');
  if (desc) {
    desc.textContent = RATING_DESCRIPTORS[val] || '';
    desc.classList.toggle('has-value', val > 0);
  }
}

function hoverRecord(val) {
  document.querySelectorAll('.platinum-record').forEach((el, i) => {
    el.classList.toggle('hover', i < val);
  });
}

function unhoverRecord() {
  document.querySelectorAll('.platinum-record').forEach(el => el.classList.remove('hover'));
}

/* ─── Needle-drop Sound ─── */
function playNeedleDrop(rating) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = 200 + (rating * 60);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type      = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    setTimeout(() => ctx.close(), 350);
  } catch(e) { /* Web Audio not available */ }
}

/* ─── Ambient Cinematic Hum ─── */
function startAmbientSound() {
  if (ambientMuted) return;
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
    gain.connect(ctx.destination);

    /* Low drone */
    [55, 110, 220].forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type  = 'sine';
      osc.frequency.value = freq;
      const g2 = ctx.createGain();
      g2.gain.value = freq === 55 ? 1 : (freq === 110 ? 0.4 : 0.15);
      osc.connect(g2);
      g2.connect(gain);
      osc.start();
    });

    ambientGain = gain;
    ambientCtx  = ctx;
  } catch(e) { /* silent fail */ }
}

function stopAmbientSound() {
  if (!ambientCtx) return;
  try {
    ambientGain.gain.linearRampToValueAtTime(0, ambientCtx.currentTime + 1.5);
    setTimeout(() => { try { ambientCtx.close(); } catch(e){} ambientCtx = null; ambientGain = null; }, 2000);
  } catch(e) {}
}

function toggleAmbientSound() {
  ambientMuted = !ambientMuted;
  const btn = document.getElementById('ambient-toggle');
  if (btn) btn.classList.toggle('muted', ambientMuted);
  if (ambientMuted) {
    stopAmbientSound();
  } else {
    startAmbientSound();
  }
}

/* ─── Rich Text Editor ─── */
function execCmd(cmd, val) {
  document.getElementById('studio-editor').focus();
  document.execCommand(cmd, false, val || null);
}

function insertGoldDivider() {
  document.getElementById('studio-editor').focus();
  document.execCommand('insertHTML', false,
    '<hr style="border:none;border-top:1px solid rgba(201,168,76,0.4);margin:1.5em 0;" />');
}

function changeEditorFont(font) {
  const editor = document.getElementById('studio-editor');
  if (editor) editor.style.fontFamily = font;
}

function updateWordCount() {
  const editor = document.getElementById('studio-editor');
  const wc     = document.getElementById('word-count');
  if (!editor || !wc) return;
  const words = editor.innerText.trim().split(/\s+/).filter(Boolean).length;
  wc.textContent = words + (words === 1 ? ' word' : ' words');
}

/* ─── Reaction Shot ─── */
function triggerReactionUpload() {
  document.getElementById('reaction-input').click();
}

function handleReactionUpload(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    studioReaction = e.target.result;
    const preview  = document.getElementById('reaction-preview');
    if (preview) {
      preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" alt="reaction" />`;
    }
  };
  reader.readAsDataURL(input.files[0]);
}

/* ─── Mood Board Slots ─── */
function initMoodboardSlots() {
  studioMoodboard = [];
  const container = document.getElementById('moodboard-slots');
  if (!container) return;
  container.innerHTML = Array.from({length:5}, (_,i) => `
    <div class="moodboard-slot" id="mb-slot-${i}"
         onclick="triggerMoodboardUpload(${i})" title="Upload image ${i+1}">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>`).join('');
}

function triggerMoodboardUpload(slotIndex) {
  activeMoodboardSlot = slotIndex;
  document.getElementById('moodboard-input').click();
}

function handleMoodboardUpload(input) {
  if (!input.files[0] || activeMoodboardSlot === null) return;
  const reader = new FileReader();
  reader.onload = e => {
    studioMoodboard[activeMoodboardSlot] = e.target.result;
    const slot = document.getElementById(`mb-slot-${activeMoodboardSlot}`);
    if (slot) {
      slot.innerHTML = `
        <img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" alt="mood ${activeMoodboardSlot+1}" />
        <div class="slot-remove" onclick="removeMoodboardSlot(event, ${activeMoodboardSlot})">✕</div>`;
    }
    activeMoodboardSlot = null;
    input.value = '';
  };
  reader.readAsDataURL(input.files[0]);
}

function removeMoodboardSlot(e, idx) {
  e.stopPropagation();
  studioMoodboard[idx] = null;
  const slot = document.getElementById(`mb-slot-${idx}`);
  if (slot) {
    slot.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>`;
  }
}

/* ─── Spoiler / Velvet Curtain ─── */
function triggerSpoilerUpload() {
  document.getElementById('spoiler-input').click();
}

function handleSpoilerUpload(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    studioSpoiler = e.target.result;
    const wrap    = document.getElementById('spoiler-preview-wrap');
    const img     = document.getElementById('spoiler-preview-img');
    if (wrap) wrap.classList.remove('hidden');
    if (img)  img.src = e.target.result;

    /* Velvet curtain toggle */
    const vc = document.getElementById('velvet-curtain-preview');
    if (vc) {
      vc.classList.remove('revealed');
      vc.onclick = () => vc.classList.add('revealed');
    }
    input.value = '';
  };
  reader.readAsDataURL(input.files[0]);
}

/* ─── Seal the Vault ─── */
function sealTheVault() {
  const editor = document.getElementById('studio-editor');
  const text   = editor ? editor.innerHTML.trim() : '';

  if (!studioRating && !text) {
    showToast('Add a rating or write something before sealing.');
    return;
  }

  /* Save review to state */
  const captionInput = document.getElementById('reaction-caption');
  const review = {
    author:           State.profile.username,
    rating:           studioRating,
    text,
    reaction:         studioReaction,
    reactionCaption:  captionInput ? captionInput.value.trim() : '',
    moodboard:        studioMoodboard.filter(Boolean),
    spoiler:          studioSpoiler
  };

  addReview(currentMovieId, review);
  closeReviewStudio();

  /* Trigger ceremony */
  triggerSealCeremony();

  /* Update UI */
  renderGallery();
  renderProfileStats();

  /* If on detail page, refresh */
  const detailPage = document.getElementById('page-detail');
  if (detailPage && detailPage.classList.contains('active')) {
    const movie = getMovie(currentMovieId);
    if (movie) {
      renderVaultScore(movie);
      renderReviewsList(movie);
    }
  }
}
