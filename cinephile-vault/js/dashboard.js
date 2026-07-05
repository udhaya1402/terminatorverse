/* ============================================================
   THE CINEPHILE VAULT — Dashboard & Analytics
   ============================================================ */

function renderDashboard() {
  const stats = computeStats();

  /* Stat Cards */
  setStatVal('stat-val-films',   stats.totalFilms);
  setStatVal('stat-val-hours',   stats.totalHours + 'h');
  setStatVal('stat-val-rating',  stats.avgRating !== null ? stats.avgRating : '—');
  setStatVal('stat-val-reviews', stats.totalReviews);

  /* Genre Chart */
  renderGenreChart(stats.genreMap);

  /* Rating Distribution */
  renderRatingBars(stats.ratingDist);

  /* Favourite Director */
  renderDirectorSpotlight(stats.favDirector);

  /* Decade Heatmap */
  renderDecadeHeatmap(stats.decadeMap);
}

function setStatVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ─── Genre Donut Chart ─── */
function renderGenreChart(genreMap) {
  const canvas = document.getElementById('genre-chart');
  const legend = document.getElementById('genre-legend');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  const W = canvas.width = 200;
  const H = canvas.height = 200;
  const cx = W / 2, cy = H / 2, r = 80, innerR = 44;

  const entries = Object.entries(genreMap).filter(([,v]) => v > 0);
  if (!entries.length) {
    ctx.clearRect(0,0,W,H);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(201,168,76,0.15)';
    ctx.lineWidth = 20;
    ctx.stroke();
    if (legend) legend.innerHTML = '<p style="color:var(--text-dim);font-size:var(--fs-xs);font-style:italic;">No data yet</p>';
    return;
  }

  const total   = entries.reduce((s,[,v])=>s+v, 0);
  const colours = [
    '#c9a84c','#d4890a','#8e44ad','#c0392b','#27ae60',
    '#2980b9','#e84393','#f39c12','#16a085','#8B6914'
  ];

  ctx.clearRect(0, 0, W, H);
  let angle = -Math.PI / 2;

  entries.forEach(([genre, count], i) => {
    const slice = (count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle   = colours[i % colours.length];
    ctx.shadowColor = colours[i % colours.length];
    ctx.shadowBlur  = 4;
    ctx.fill();
    angle += slice;
  });

  /* Inner hole */
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI*2);
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-elevated').trim() || '#1e1e1e';
  ctx.shadowBlur = 0;
  ctx.fill();

  /* Legend */
  if (legend) {
    legend.innerHTML = entries.slice(0,6).map(([genre, count], i) => `
      <div class="genre-legend-item">
        <div class="genre-legend-dot" style="background:${colours[i % colours.length]}"></div>
        <span>${genre}</span>
        <span style="margin-left:auto;color:var(--text-dim);">${count}</span>
      </div>`).join('');
  }
}

/* ─── Rating Distribution Bars ─── */
function renderRatingBars(ratingDist) {
  const container = document.getElementById('rating-bars');
  if (!container) return;
  const maxCount  = Math.max(...Object.values(ratingDist), 1);

  container.innerHTML = Object.entries(ratingDist).reverse().map(([score, count]) => {
    const pct = Math.round((count / maxCount) * 100);
    return `
      <div class="rating-bar-row">
        <div class="rating-bar-label">${score}</div>
        <div class="rating-bar-track">
          <div class="rating-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="rating-bar-count">${count}</div>
      </div>`;
  }).join('');

  /* Animate bars in */
  requestAnimationFrame(() => {
    container.querySelectorAll('.rating-bar-fill').forEach(bar => {
      bar.style.transition = 'width 1s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });
}

/* ─── Director Spotlight ─── */
function renderDirectorSpotlight(favDirector) {
  const nameEl  = document.getElementById('director-name');
  const countEl = document.getElementById('director-count');
  if (!nameEl || !countEl) return;

  if (!favDirector) {
    nameEl.textContent  = '—';
    countEl.textContent = '—';
    return;
  }

  nameEl.textContent  = favDirector[0];
  countEl.textContent = favDirector[1];
}

/* ─── Decade Heatmap ─── */
function renderDecadeHeatmap(decadeMap) {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  const maxCount = Math.max(...Object.values(decadeMap), 1);

  grid.innerHTML = Object.entries(decadeMap).map(([decade, count]) => {
    const intensity = count / maxCount;
    const cls = count === 0 ? '' : intensity > 0.65 ? 'has-data-high' : 'has-data';
    return `
      <div class="heatmap-cell ${cls}" title="${decade}: ${count} title${count!==1?'s':''}">
        <div class="heatmap-decade">${decade}</div>
        <div class="heatmap-count">${count || '—'}</div>
      </div>`;
  }).join('');
}
