/* ============================================================
   THE CINEPHILE VAULT — Data Store & Persistence
   ============================================================ */

const STORAGE_KEY = 'cinephile_vault_data';

const RATING_DESCRIPTORS = {
  0:  '',
  1:  '"A relic best forgotten in the vaults of time."',
  2:  '"A dim flicker that could not sustain its own light."',
  3:  '"Some beauty, buried under too much wreckage."',
  4:  '"A flawed gem — close to something, yet far from it."',
  5:  '"A middle chapter in a story worth more."',
  6:  '"Solid craft in service of an imperfect vision."',
  7:  '"A worthy entry in the canon of the compelling."',
  8:  '"Rare and radiant — cinema at near full power."',
  9:  '"A film that changes the room it enters."',
  10: '"A masterwork. Sealed forever in gold."'
};

const GENRE_COLOURS = {
  action:    '#c0392b',
  romance:   '#e84393',
  drama:     '#8e44ad',
  thriller:  '#2c3e50',
  horror:    '#1a0a0a',
  romcom:    '#e91e8c',
  sad:       '#34495e',
  '18plus':  '#6d2c2c',
  kids:      '#27ae60',
  animation: '#f39c12'
};

const DECADE_LABELS = ['1920s','1930s','1940s','1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'];

/* ─── Default State ─── */
const DEFAULT_STATE = {
  profile: {
    username: 'The Cinephile',
    tagline:  '"Cinema is a matter of what\'s in the frame and what\'s out."',
    bio:      'A devoted cinephile archiving every frame that moved, haunted, or transformed me.',
    avatar:   null,
    cover:    null
  },
  vault: []
};

/* ─── Load / Save ─── */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) { console.warn('Vault load error', e); }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(State));
  } catch(e) { console.warn('Vault save error', e); }
}

/* ─── Global State ─── */
let State = loadState();

/* ─── Movie CRUD ─── */
function addMovie(movie) {
  movie.id       = Date.now().toString(36) + Math.random().toString(36).slice(2);
  movie.addedAt  = new Date().toISOString();
  movie.reviews  = movie.reviews  || [];
  movie.cast     = movie.cast     || [];
  movie.genres   = movie.genres   || [];
  movie.rating   = null;
  State.vault.unshift(movie);
  saveState();
  return movie;
}

function updateMovie(id, patch) {
  const idx = State.vault.findIndex(m => m.id === id);
  if (idx === -1) return null;
  State.vault[idx] = { ...State.vault[idx], ...patch };
  saveState();
  return State.vault[idx];
}

function getMovie(id) {
  return State.vault.find(m => m.id === id) || null;
}

function addReview(movieId, review) {
  const movie = getMovie(movieId);
  if (!movie) return null;
  review.id        = Date.now().toString(36);
  review.createdAt = new Date().toISOString();
  movie.reviews.unshift(review);
  /* Update movie's aggregate rating */
  const scores = movie.reviews.filter(r => r.rating > 0).map(r => r.rating);
  movie.rating = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length) : null;
  saveState();
  return review;
}

function deleteMovie(id) {
  const idx = State.vault.findIndex(m => m.id === id);
  if (idx === -1) return false;
  State.vault.splice(idx, 1);
  saveState();
  return true;
}

function addCastMember(movieId, member) {
  const movie = getMovie(movieId);
  if (!movie) return null;
  member.id = Date.now().toString(36);
  movie.cast.push(member);
  saveState();
  return member;
}

/* ─── Analytics ─── */
function computeStats() {
  const vault   = State.vault;
  const reviews = vault.flatMap(m => m.reviews || []);
  const ratings = reviews.filter(r => r.rating > 0).map(r => r.rating);

  const totalFilms   = vault.length;
  const totalHours   = Math.round(vault.reduce((s,m) => s + (parseInt(m.runtime)||0), 0) / 60);
  const avgRating    = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : null;
  const totalReviews = reviews.length;

  /* Director frequency */
  const directorMap = {};
  vault.forEach(m => {
    if (m.director) directorMap[m.director] = (directorMap[m.director]||0)+1;
  });
  const favDirector = Object.entries(directorMap).sort((a,b)=>b[1]-a[1])[0] || null;

  /* Genre frequency */
  const genreMap = {};
  vault.forEach(m => (m.genres||[]).forEach(g => { genreMap[g]=(genreMap[g]||0)+1; }));

  /* Rating distribution */
  const ratingDist = {};
  for (let i=1;i<=10;i++) ratingDist[i]=0;
  ratings.forEach(r => { const k=Math.round(r); if(ratingDist[k]!==undefined) ratingDist[k]++; });

  /* Decade heatmap */
  const decadeMap = {};
  DECADE_LABELS.forEach(d => decadeMap[d]=0);
  vault.forEach(m => {
    const y = parseInt(m.year);
    if (!isNaN(y)) {
      const decade = Math.floor(y/10)*10;
      const label  = decade + 's';
      if (decadeMap[label] !== undefined) decadeMap[label]++;
    }
  });

  return { totalFilms, totalHours, avgRating, totalReviews, favDirector, genreMap, ratingDist, decadeMap };
}

/* ─── Seed Data (first load) ─── */
function seedIfEmpty() {
  if (State.vault.length > 0) return;
  const seeds = [
    {
      title:'Mulholland Drive', year:2001, director:'David Lynch', runtime:147,
      type:'film', synopsis:'A woman stumbles upon a dark mystery in Hollywood after surviving an accident.',
      genres:['thriller','drama'],
      poster:'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&q=80',
      trailer:'',
      isCuratorsChoice: true
    },
    {
      title:'Portrait of a Lady on Fire', year:2019, director:'Céline Sciamma', runtime:121,
      type:'film', synopsis:'On an isolated island in Brittany, a female painter falls for her reluctant subject.',
      genres:['romance','drama'],
      poster:'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
      trailer:''
    },
    {
      title:'Parasite', year:2019, director:'Bong Joon-ho', runtime:132,
      type:'film', synopsis:'Greed and class discrimination threaten the symbiotic relationship between two families.',
      genres:['thriller','drama'],
      poster:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
      trailer:''
    },
    {
      title:'Succession', year:2018, director:'Jesse Armstrong', runtime:60,
      type:'series', synopsis:'The Roy family controls one of the biggest media and entertainment conglomerates.',
      genres:['drama','thriller'],
      poster:'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&q=80',
      trailer:''
    },
    {
      title:'Amélie', year:2001, director:'Jean-Pierre Jeunet', runtime:122,
      type:'film', synopsis:'A shy waitress decides to change the destiny of those around her for the better.',
      genres:['romance','drama'],
      poster:'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80',
      trailer:''
    },
    {
      title:'Spirited Away', year:2001, director:'Hayao Miyazaki', runtime:125,
      type:'film', synopsis:'A young girl enters a supernatural world when her parents are transformed into pigs.',
      genres:['animation','kids'],
      poster:'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=400&q=80',
      trailer:''
    }
  ];
  seeds.forEach(s => addMovie(s));

  /* Add a sample review */
  const first = State.vault[0];
  if (first) {
    addReview(first.id, {
      author:  'The Cinephile',
      rating:  9,
      text:    '<p>Lynch constructs a dream that refuses to wake up. Every corridor of this film opens onto another mystery, and the beauty of it is that the mystery is the point.</p><blockquote>There is no director alive who makes dread feel this much like desire.</blockquote>',
      moodboard: [],
      reaction: null,
      reactionCaption: ''
    });
  }
}
