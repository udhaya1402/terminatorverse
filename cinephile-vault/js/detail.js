/* ============================================================
   THE CINEPHILE VAULT — Movie Detail Page
   ============================================================ */

function openMovieDetail(id) {
  const movie = getMovie(id);
  if (!movie) return;
  currentMovieId = id;

  showPage('detail');

  /* Poster & background */
  const posterEl  = document.getElementById('detail-poster-img');
  const bgEl      = document.getElementById('detail-bg-img');
  const src       = movie.poster || '';
  posterEl.src    = src;
  bgEl.src        = src;
  posterEl.alt    = movie.title;
  posterEl.onerror = () => { posterEl.style.background = 'var(--bg-elevated)'; };

  /* Title */
  document.getElementById('detail-title').textContent = movie.title;

  /* Meta row */
  const metaItems = [
    movie.year     ? `<span class="detail-meta-item">${movie.year}</span>` : '',
    movie.runtime  ? `<span class="detail-meta-item">${movie.runtime} min</span>` : '',
    movie.director ? `<span class="detail-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                        ${escHtml(movie.director)}
                      </span>` : '',
    `<span class="badge badge-gold">${movie.type === 'series' ? 'Web Series' : 'Film'}</span>`
  ].filter(Boolean).join('<div class="detail-meta-separator"></div>');
  document.getElementById('detail-meta').innerHTML = metaItems;

  /* Synopsis */
  document.getElementById('detail-synopsis').textContent = movie.synopsis || '';

  /* Genre tags */
  const tagsEl = document.getElementById('detail-genre-tags');
  tagsEl.innerHTML = (movie.genres||[]).map(g =>
    `<span class="wax-tag active">${g}</span>`).join('');

  /* Vault Score */
  renderVaultScore(movie);

  /* Reviews */
  renderReviewsList(movie);

  /* Cast */
  renderCastGrid(movie);

  /* Details panel */
  renderDetailsPanel(movie);

  /* Reset to first tab */
  const firstTabBtn = document.querySelector('.detail-tabs-inner .tab-btn');
  if (firstTabBtn) {
    document.querySelectorAll('.detail-tabs-inner .tab-btn').forEach(b => b.classList.remove('active'));
    firstTabBtn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const firstPanel = document.getElementById('tab-reviews');
    if (firstPanel) firstPanel.classList.add('active');
  }
}

function renderVaultScore(movie) {
  const block = document.getElementById('vault-score-block');
  if (!block) return;
  if (!movie.rating) {
    block.innerHTML = `
      <div style="font-family:var(--font-quill);font-style:italic;color:var(--text-dim);font-size:var(--fs-sm);">
        No score yet — be the first to review.
      </div>`;
    return;
  }
  const score = parseFloat(movie.rating).toFixed(1);
  const desc  = RATING_DESCRIPTORS[Math.round(parseFloat(score))] || '';
  block.innerHTML = `
    <div class="vault-score-number">${score}</div>
    <div class="vault-score-divider">/10</div>
    <div class="vault-score-meta">
      <div class="vault-score-label">Vault Score</div>
      <div class="vault-score-desc">${desc}</div>
    </div>`;
}

function renderReviewsList(movie) {
  const list = document.getElementById('reviews-list');
  if (!list) return;
  const reviews = movie.reviews || [];
  if (!reviews.length) {
    list.innerHTML = `
      <div style="padding:var(--sp-12) 0;text-align:center;">
        <p style="font-family:var(--font-quill);font-style:italic;color:var(--text-dim);font-size:var(--fs-lg);">
          No reviews yet. Open the studio and be the first to write one.</p>
        <button class="btn btn-secondary" style="margin-top:var(--sp-5);" onclick="openReviewStudio()">
          Write the First Review
        </button>
      </div>`;
    return;
  }

  list.innerHTML = reviews.map(r => buildReviewCard(r, movie)).join('');

  /* Velvet curtain interactivity */
  list.querySelectorAll('.velvet-curtain').forEach(vc => {
    vc.addEventListener('click', () => vc.classList.add('revealed'));
  });
}

function buildReviewCard(r, movie) {
  /* Rating records */
  const rating = r.rating || 0;
  const recordsHtml = Array.from({length:10}, (_,i) => `
    <span class="rating-record ${i < rating ? 'filled' : 'empty'}">◈</span>`).join('');

  /* Mood board strip */
  const moodboardHtml = r.moodboard && r.moodboard.length
    ? `<div class="moodboard-strip">
        ${r.moodboard.map(src =>
          `<img class="moodboard-strip-image" src="${src}" alt="mood"
               onclick="openLightbox('${src}')" />`).join('')}
       </div>`
    : '';

  /* Reaction shot */
  const reactionHtml = r.reaction
    ? `<div class="reaction-shot">
        <img class="reaction-shot-img" src="${r.reaction}" alt="reaction"
             onclick="openLightbox('${r.reaction}')" />
        ${r.reactionCaption ? `<span class="reaction-shot-caption">${escHtml(r.reactionCaption)}</span>` : ''}
       </div>`
    : '';

  /* Spoiler / velvet curtain */
  const spoilerHtml = r.spoiler
    ? `<div style="margin:var(--sp-4) 0;">
        <div class="velvet-curtain">
          <img src="${r.spoiler}" alt="spoiler"
               style="width:100%;border-radius:var(--radius-sm);" />
          <div class="velvet-curtain-cover">
            <span class="velvet-warning">⚠ Spoiler Ahead</span>
            <span class="velvet-hint">Click to reveal</span>
          </div>
        </div>
       </div>`
    : '';

  const date = r.createdAt
    ? new Date(r.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : '';

  return `
    <div class="review-card fade-in">
      <div class="review-card-bg">
        <img class="review-card-bg-image" src="${movie.poster||''}" alt="" />
      </div>
      <div class="review-card-content">
        <div class="review-card-header">
          <div class="review-author-avatar" style="background:var(--bg-surface);display:flex;
               align-items:center;justify-content:center;font-size:1.2rem;">
            ${r.reaction ? `<img src="${r.reaction}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="" />` : '👁'}
          </div>
          <div class="review-author-info">
            <div class="review-author-name">${escHtml(r.author || State.profile.username)}</div>
            <div class="review-author-date">${date}</div>
          </div>
          <div class="review-rating-display">
            ${recordsHtml}
            <span class="review-rating-value">${rating}/10</span>
          </div>
        </div>
        ${reactionHtml}
        <div class="review-text">${r.text || ''}</div>
        ${moodboardHtml}
        ${spoilerHtml}
      </div>
    </div>`;
}

/* ─── Cast Grid ─── */
function renderCastGrid(movie) {
  const grid = document.getElementById('cast-grid');
  if (!grid) return;
  const cast = movie.cast || [];

  const castHtml = cast.map(c => {
    const igLink  = c.instagram ? `https://instagram.com/${c.instagram.replace('@','')}` : null;
    return `
      <div class="cast-card ${c.isLead ? 'lead' : ''}">
        <div class="cast-card-photo-wrap">
          ${c.photo
            ? `<img class="cast-card-photo" src="${c.photo}" alt="${escHtml(c.name)}" />`
            : `<div style="width:100%;height:100%;background:var(--bg-surface);display:flex;
                    align-items:center;justify-content:center;color:var(--text-ghost);font-size:2rem;">👤</div>`}
          ${igLink ? `<a href="${igLink}" target="_blank" rel="noopener" class="cast-card-instagram"
                         onclick="event.stopPropagation()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>` : ''}
        </div>
        <div class="cast-card-name">${escHtml(c.name)}</div>
        <div class="cast-card-character">${escHtml(c.character||'')}</div>
      </div>`;
  }).join('');

  grid.innerHTML = castHtml + `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div class="cast-add-btn" onclick="openCastModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add
      </div>
      <div style="height:var(--sp-3)"></div>
    </div>`;
}

/* ─── Details Panel ─── */
function renderDetailsPanel(movie) {
  const panel = document.getElementById('details-panel-content');
  if (!panel) return;
  const rows = [
    ['Title',    movie.title],
    ['Year',     movie.year],
    ['Director', movie.director],
    ['Runtime',  movie.runtime ? movie.runtime + ' min' : null],
    ['Type',     movie.type === 'series' ? 'Web Series' : 'Film'],
    ['Genres',   (movie.genres||[]).join(', ')],
    ['Added',    movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : null]
  ].filter(r => r[1]);

  panel.innerHTML = `
    <div style="max-width:600px;">
      <table style="width:100%;border-collapse:collapse;">
        ${rows.map(([label, value]) => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
            <td style="padding:var(--sp-4) var(--sp-5) var(--sp-4) 0;
                       font-family:var(--font-display);font-size:var(--fs-xs);
                       letter-spacing:0.15em;text-transform:uppercase;
                       color:var(--gold-muted);width:140px;vertical-align:top;">${label}</td>
            <td style="padding:var(--sp-4) 0;color:var(--text-warm);
                       font-family:var(--font-body);font-size:var(--fs-base);">${escHtml(String(value))}</td>
          </tr>`).join('')}
      </table>
      ${movie.trailer ? `
        <div style="margin-top:var(--sp-8);">
          <div class="studio-section-label">Trailer</div>
          <div class="trailer-preview" style="margin-top:var(--sp-3);">
            <iframe src="${youtubeEmbedUrl(movie.trailer)||''}" allowfullscreen title="Trailer"></iframe>
          </div>
        </div>` : ''}
    </div>`;
}

/* ─── Cast Modal ─── */
function openCastModal() {
  if (!currentMovieId) return;
  document.getElementById('cast-name').value      = '';
  document.getElementById('cast-character').value = '';
  document.getElementById('cast-instagram').value = '';
  document.getElementById('cast-is-lead').checked = false;
  const preview = document.getElementById('cast-photo-preview');
  preview.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
         fill="none" stroke="var(--gold-dim)" stroke-width="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`;
  window._castPhotoDataUrl = null;
  openModal('cast-modal');
}

function triggerCastPhotoInput() {
  document.getElementById('cast-photo-input').click();
}

function handleCastPhoto(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    window._castPhotoDataUrl = e.target.result;
    const preview = document.getElementById('cast-photo-preview');
    preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" alt="cast photo" />`;
  };
  reader.readAsDataURL(input.files[0]);
}

function submitCastMember() {
  const name = document.getElementById('cast-name').value.trim();
  if (!name) { showToast('Please enter a name.'); return; }
  addCastMember(currentMovieId, {
    name,
    character: document.getElementById('cast-character').value.trim(),
    instagram: document.getElementById('cast-instagram').value.trim(),
    isLead:    document.getElementById('cast-is-lead').checked,
    photo:     window._castPhotoDataUrl || null
  });
  closeModal('cast-modal');
  renderCastGrid(getMovie(currentMovieId));
  showToast(`${name} added to the cast ensemble.`);
}

/* ─── Projection Chamber ─── */
function openProjectionChamber() {
  if (!currentMovieId) return;
  const movie = getMovie(currentMovieId);
  if (!movie) return;
  openProjectionChamberFor(movie.id);
}

function openProjectionChamberFor(id) {
  const movie = getMovie(id);
  if (!movie) return;
  const chamber = document.getElementById('projection-chamber');
  const content = document.getElementById('projection-content');

  if (movie.trailer) {
    const embedUrl = youtubeEmbedUrl(movie.trailer);
    if (embedUrl) {
      content.innerHTML = `<iframe src="${embedUrl}?autoplay=1&rel=0" allowfullscreen
                              allow="autoplay;fullscreen"
                              style="width:100%;height:100%;border:none;display:block;" title="${escHtml(movie.title)}"></iframe>`;
    } else {
      content.innerHTML = buildNoTrailerFallback(movie);
    }
  } else {
    content.innerHTML = buildNoTrailerFallback(movie);
  }

  chamber.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function buildNoTrailerFallback(movie) {
  const vidId = movie.trailer ? youtubeVideoId(movie.trailer) : null;
  const thumb  = vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : (movie.poster || '');
  return `
    <div style="width:100%;height:100%;background:#000;display:flex;flex-direction:column;
                align-items:center;justify-content:center;gap:var(--sp-5);position:relative;">
      ${thumb ? `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover;opacity:0.4;position:absolute;inset:0;" alt="" />` : ''}
      <div style="position:relative;text-align:center;padding:var(--sp-8);">
        <div style="font-family:var(--font-decorative);font-size:var(--fs-xl);color:var(--text-ivory);margin-bottom:var(--sp-3);">
          ${escHtml(movie.title)}
        </div>
        <p style="font-family:var(--font-quill);font-style:italic;color:var(--text-muted);">
          No trailer URL has been added for this title yet.
        </p>
        <button class="btn btn-secondary" style="margin-top:var(--sp-5);" onclick="closeProjectionChamber()">
          Close Chamber
        </button>
      </div>
    </div>`;
}

function closeProjectionChamber() {
  const chamber = document.getElementById('projection-chamber');
  const content = document.getElementById('projection-content');
  chamber.classList.remove('open');
  content.innerHTML = '';
  document.body.style.overflow = '';
}
