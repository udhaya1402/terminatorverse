/* ============================================================
   THE CINEPHILE VAULT — Gallery & Rankings Rendering
   ============================================================ */

function filterByGenre(btn, genre) {
  currentGenreFilter = genre;
  document.querySelectorAll('#genre-filter-bar .wax-tag').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderGallery();
}

function renderGallery() {
  const grid = document.getElementById('movie-grid');
  if (!grid) return;

  let movies = [...State.vault];
  if (currentGenreFilter && currentGenreFilter !== 'all') {
    movies = movies.filter(m => (m.genres||[]).includes(currentGenreFilter));
  }

  if (!movies.length) {
    grid.innerHTML = `
      <div class="empty-vault">
        <svg class="empty-vault-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1">
          <rect x="2" y="2" width="20" height="20" rx="2"/>
          <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <h3>The Vault Awaits</h3>
        <p>No titles in this category yet. Add your first film to begin the archive.</p>
        <button class="btn btn-secondary" onclick="openAcquisitionDesk()">Acquire a Title</button>
      </div>`;
    return;
  }

  grid.innerHTML = movies.map(m => buildMovieCard(m)).join('');
}

function buildMovieCard(m) {
  const ratingHtml = m.rating
    ? `<div class="movie-card-rating">
        <span class="rating-icon">◆</span>
        <span class="rating-value">${parseFloat(m.rating).toFixed(1)}</span>
       </div>`
    : '';

  const ribbon = m.isCuratorsChoice
    ? `<div class="curators-choice-ribbon">Curator's Choice</div>`
    : '';

  const posterHtml = m.poster
    ? `<img class="movie-card-poster" src="${m.poster}"
            alt="${escHtml(m.title)}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />`
    : '';

  const placeholderHtml = `
    <div class="movie-card-placeholder" style="${m.poster?'display:none':''}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1">
        <rect x="2" y="2" width="20" height="20" rx="2"/>
        <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
      <span>No Poster</span>
    </div>`;

  return `
    <div class="movie-card fade-in" data-id="${m.id}"
         onclick="openMovieDetail('${m.id}')">
      ${ribbon}
      ${posterHtml}
      ${placeholderHtml}
      <div class="movie-card-overlay"></div>
      <div class="movie-card-info">
        <div class="movie-card-title">${escHtml(m.title)}</div>
        <div class="movie-card-year">${m.year||''}</div>
        ${ratingHtml}
      </div>
      <div class="movie-card-actions" onclick="event.stopPropagation()">
        <button class="card-action-btn" title="Play Trailer"
                onclick="openProjectionChamberFor('${m.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
        <button class="card-action-btn" title="Write Review"
                onclick="openReviewStudioFor('${m.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
        <button class="card-action-btn card-action-btn--delete" title="Remove from Vault"
                onclick="confirmDeleteMovie('${m.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>`;
}

/* ─── Rankings Page ─── */
function renderRankings() {
  const list = document.getElementById('rankings-list');
  if (!list) return;

  const sorted = [...State.vault]
    .filter(m => m.rating)
    .sort((a, b) => b.rating - a.rating);

  if (!sorted.length) {
    list.innerHTML = `<p style="color:var(--text-dim);font-style:italic;padding:var(--sp-8) 0;">
      No rated titles yet. Write some reviews to build the consensus.</p>`;
    return;
  }

  list.innerHTML = sorted.map((m, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
    return `
      <div style="display:flex;align-items:center;gap:var(--sp-5);padding:var(--sp-4) var(--sp-5);
                  background:var(--bg-elevated);border:var(--border-dark);border-radius:var(--radius-md);
                  cursor:pointer;transition:var(--transition-base);"
           onclick="openMovieDetail('${m.id}')"
           onmouseenter="this.style.borderColor='rgba(201,168,76,0.25)';this.style.background='var(--bg-overlay)'"
           onmouseleave="this.style.borderColor='';this.style.background='var(--bg-elevated)'">
        <div style="font-family:var(--font-decorative);font-size:var(--fs-lg);
                    color:var(--gold-muted);width:36px;text-align:center;">${medal}</div>
        <img src="${m.poster||''}" alt="${escHtml(m.title)}"
             style="width:46px;height:68px;object-fit:cover;border-radius:var(--radius-sm);
                    border:var(--border-gold-soft);background:var(--bg-surface);"
             onerror="this.style.background='var(--bg-surface)'" />
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--font-serif);font-size:var(--fs-base);color:var(--text-ivory);">
            ${escHtml(m.title)}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:2px;">
            ${m.year||''} · ${m.director||'—'}</div>
        </div>
        <div style="font-family:var(--font-decorative);font-size:var(--fs-xl);
                    color:var(--gold-pure);text-shadow:0 0 12px rgba(201,168,76,0.4);">
          ${parseFloat(m.rating).toFixed(1)}</div>
        <div style="font-size:var(--fs-xs);color:var(--text-dim)">/10</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;max-width:140px;justify-content:flex-end;">
          ${(m.genres||[]).slice(0,2).map(g => `<span class="wax-tag active" style="font-size:9px;padding:2px 7px;">${g}</span>`).join('')}
        </div>
      </div>`;
  }).join('');
}

/* ─── Timeline Page ─── */
function renderTimeline() {
  const container = document.getElementById('timeline-nodes');
  if (!container) return;

  const sorted = [...State.vault].sort((a,b) => new Date(b.addedAt) - new Date(a.addedAt));

  if (!sorted.length) {
    container.innerHTML = `<p style="color:var(--text-dim);font-style:italic;text-align:center;padding:var(--sp-12) 0;">
      Your timeline is empty. Add films to begin the chronicle.</p>`;
    return;
  }

  container.innerHTML = sorted.map((m, i) => {
    const date    = new Date(m.addedAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    const review  = (m.reviews||[])[0];
    const isRight = i % 2 === 0;
    const personal = review?.reaction || '';

    const cardHtml = `
      <div class="timeline-node-card" onclick="openMovieDetail('${m.id}')" style="position:relative;">
        ${m.poster ? `<img class="timeline-node-poster" src="${m.poster}" alt="${escHtml(m.title)}" />` : ''}
        <div class="timeline-node-info">
          <div class="timeline-node-title">${escHtml(m.title)} <span style="color:var(--text-dim)">${m.year||''}</span></div>
          <div class="timeline-node-date">Added ${date}</div>
          ${m.rating ? `<div style="color:var(--gold-pure);font-family:var(--font-display);font-size:var(--fs-sm);margin-top:4px;">◆ ${parseFloat(m.rating).toFixed(1)}/10</div>` : ''}
        </div>
        ${personal ? `<img class="timeline-node-personal-image" src="${personal}" alt="reaction" />` : ''}
      </div>`;

    return `
      <div class="timeline-node">
        ${isRight ? cardHtml : '<div></div>'}
        <div class="timeline-node-dot"></div>
        ${isRight ? '<div></div>' : cardHtml}
      </div>`;
  }).join('');
}

/* ─── Profile Collection Grid ─── */
function renderProfileCollection() {
  const grid = document.getElementById('profile-collection-grid');
  if (!grid) return;
  if (!State.vault.length) {
    grid.innerHTML = `<div class="empty-vault" style="grid-column:1/-1;">
      <h3>Your collection is empty</h3>
      <button class="btn btn-secondary" onclick="openAcquisitionDesk()">Acquire a Title</button>
    </div>`;
    return;
  }
  grid.innerHTML = State.vault.map(m => buildMovieCard(m)).join('');
}

/* ─── Profile Highlights ─── */
function renderHighlights() {
  const grid = document.getElementById('highlights-grid');
  if (!grid) return;

  const highlights = [...State.vault]
    .filter(m => m.reviews && m.reviews.length > 0)
    .slice(0, 3);

  if (!highlights.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;color:var(--text-dim);font-style:italic;">
      Write some reviews to build your vault highlights.</div>`;
    return;
  }

  grid.innerHTML = highlights.map(m => {
    const review  = m.reviews[0];
    const excerpt = stripHtml(review.text || '').slice(0, 100) + '…';
    return `
      <div class="highlight-card" onclick="openMovieDetail('${m.id}')">
        ${m.poster ? `<img class="highlight-card-poster" src="${m.poster}" alt="${escHtml(m.title)}" />` : ''}
        <div class="highlight-card-overlay"></div>
        <div class="highlight-card-info">
          <div class="highlight-card-title">${escHtml(m.title)}</div>
          <div class="highlight-card-excerpt">${escHtml(excerpt)}</div>
          ${review.rating ? `<div style="color:var(--gold-pure);font-family:var(--font-display);font-size:var(--fs-sm);margin-top:var(--sp-2);">◆ ${review.rating}/10</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

/* ─── Profile Stats ─── */
function renderProfileStats() {
  const stats = computeStats();
  const set   = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  set('ps-films',   stats.totalFilms);
  set('ps-reviews', stats.totalReviews);
  set('ps-rating',  stats.avgRating !== null ? stats.avgRating : '—');
  set('ps-hours',   stats.totalHours + 'h');
}

/* ─── Utilities ─── */
function escHtml(str) {
  return String(str||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/* ─── Delete Confirmation ─── */
function confirmDeleteMovie(id) {
  const movie = getMovie(id);
  if (!movie) return;

  window._pendingDeleteId = id;

  const posterEl = document.getElementById('delete-confirm-poster');
  const titleEl  = document.getElementById('delete-confirm-title');
  const metaEl   = document.getElementById('delete-confirm-meta');

  if (posterEl) {
    posterEl.src   = movie.poster || '';
    posterEl.style.display = movie.poster ? 'block' : 'none';
  }
  if (titleEl) titleEl.textContent = movie.title;
  if (metaEl)  metaEl.textContent  = [movie.year, movie.director].filter(Boolean).join(' · ');

  openModal('delete-confirm-modal');
}

function executeDelete() {
  const id    = window._pendingDeleteId;
  const movie = getMovie(id);
  if (!id || !movie) return;

  const title = movie.title;
  deleteMovie(id);
  closeModal('delete-confirm-modal');
  window._pendingDeleteId = null;

  /* If on that movie's detail page, return to home */
  if (currentMovieId === id) {
    currentMovieId = null;
    showPage('home');
  }

  renderGallery();
  renderProfileStats();
  showToast(`"${title}" has been removed from the vault.`);
}
