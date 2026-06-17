// Simple localStorage helpers
const storage = {
  get(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return []}},
  set(key,val){localStorage.setItem(key,JSON.stringify(val))}
}

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

/* POSTS */
const postForm = document.getElementById('postForm');
const postsKey = 'my_corner_posts_v1';
function renderPosts(){
  const list = document.getElementById('postsList'); list.innerHTML='';
  const posts = storage.get(postsKey).slice().reverse();
  posts.forEach(p=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<strong>${escapeHtml(p.title)}</strong><div class="meta">${p.date}</div><div>${escapeHtml(p.content)}</div>`;
    if(p.image) { const img=document.createElement('img'); img.src=p.image; img.className='thumb'; el.appendChild(img)}
    list.appendChild(el);
  })
}

postForm.addEventListener('submit',e=>{
  e.preventDefault();
  const title=document.getElementById('postTitle').value.trim();
  const content=document.getElementById('postContent').value.trim();
  const file = document.getElementById('postImage').files[0];
  const save = (imgData)=>{
    const posts = storage.get(postsKey);
    posts.push({id:uid(),title,content,image:imgData,date:new Date().toLocaleString()});
    storage.set(postsKey,posts);
    postForm.reset(); renderPosts();
  }
  if(file){
    const r=new FileReader(); r.onload=()=>save(r.result); r.readAsDataURL(file);
  } else save(null);
});

/* GAMES & MOVIES */
function makeStars(container, initial=0, interactive=true, onChange){
  container.innerHTML=''; container.dataset.rating = initial||0;
  for(let i=1;i<=5;i++){
    const s=document.createElement('span'); s.className='star'; s.dataset.value=i; s.innerText='★';
    const fill = document.createElement('span'); fill.className='fill'; fill.innerHTML = '<span>★</span>';
    s.appendChild(fill);
    if(interactive){
      s.addEventListener('click',(e)=>{
        const rect = s.getBoundingClientRect();
        const isHalf = (e.clientX - rect.left) < rect.width/2;
        const val = isHalf ? (i - 0.5) : i;
        container.dataset.rating = String(val);
        updateStars();
        if(onChange) onChange(val);
      });
    }
    container.appendChild(s);
  }
  function updateStars(){
    const rating = Number(container.dataset.rating || 0);
    [...container.children].forEach(ch=>{
      const i = Number(ch.dataset.value);
      const fillEl = ch.querySelector('.fill');
      let pct = 0;
      if(rating >= i) pct = 100;
      else if(rating >= i - 0.5) pct = 50;
      else pct = 0;
      fillEl.style.width = pct + '%';
    })
  }
  updateStars();
  return {set(v){container.dataset.rating=v; updateStars()},update:updateStars}
}

const gamesKey='my_corner_games_v1';
const moviesKey='my_corner_movies_v1';
const gameForm=document.getElementById('gameForm');
const movieForm=document.getElementById('movieForm');
const gameStars = makeStars(document.getElementById('gameRating'),0,true);
const movieStars = makeStars(document.getElementById('movieRating'),0,true);
let editingGameId = null;
let editingMovieId = null;

function renderList(key, containerId){
  const list = document.getElementById(containerId); list.innerHTML='';
  const items = storage.get(key).slice().reverse();
  items.forEach(it=>{
    const el=document.createElement('div'); el.className='card';
    const starsHtml = Array.from({length:5}).map((_,idx)=>{
      const i = idx+1;
      let pct = 0;
      if(it.rating >= i) pct = 100;
      else if(it.rating >= i - 0.5) pct = 50;
      const span = `<span class="star">★<span class="fill" style="width:${pct}%"><span>★</span></span></span>`;
      return span;
    }).join('');
    const stars = '<span class="meta">'+starsHtml+'</span>';
    const controls = `<div class="controls"><button class="btn small" data-key="${key}" data-id="${it.id}" data-action="edit">Edit</button><button class="btn small" data-key="${key}" data-id="${it.id}" data-action="delete">Delete</button></div>`;
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(it.name)}</strong><div class="meta">${it.year} ${stars}</div></div>${controls}</div>`;
    list.appendChild(el);
  })
}

gameForm.addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.getElementById('gameName').value.trim();
  const year=document.getElementById('gameYear').value||'2026';
  const rating = Number(document.getElementById('gameRating').dataset.rating || 0);
  const games = storage.get(gamesKey);
  if(editingGameId){
    const idx = games.findIndex(item=>item.id===editingGameId);
    if(idx !== -1){ games[idx] = { ...games[idx], name, year, rating } }
    editingGameId = null;
    gameForm.querySelector('button[type="submit"]').textContent = 'Add Game';
  } else {
    games.push({id:uid(),name,year,rating});
  }
  storage.set(gamesKey,games);
  gameForm.reset(); gameStars.set(0); renderList(gamesKey,'gamesList');
});

movieForm.addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.getElementById('movieName').value.trim();
  const year=document.getElementById('movieYear').value||'2026';
  const rating = Number(document.getElementById('movieRating').dataset.rating || 0);
  const movies = storage.get(moviesKey);
  if(editingMovieId){
    const idx = movies.findIndex(item=>item.id===editingMovieId);
    if(idx !== -1){ movies[idx] = { ...movies[idx], name, year, rating } }
    editingMovieId = null;
    movieForm.querySelector('button[type="submit"]').textContent = 'Add Movie';
  } else {
    movies.push({id:uid(),name,year,rating});
  }
  storage.set(moviesKey,movies);
  movieForm.reset(); movieStars.set(0); renderList(moviesKey,'moviesList');
});

const gamesList = document.getElementById('gamesList');
const moviesList = document.getElementById('moviesList');

gamesList.addEventListener('click',e=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const key = btn.dataset.key; const id = btn.dataset.id; const action = btn.dataset.action;
  if(key !== gamesKey) return;
  const games = storage.get(gamesKey);
  const idx = games.findIndex(item=>item.id===id);
  if(action==='edit' && idx !== -1){
    const item = games[idx];
    document.getElementById('gameName').value = item.name;
    document.getElementById('gameYear').value = item.year;
    gameStars.set(item.rating);
    editingGameId = id;
    gameForm.querySelector('button[type="submit"]').textContent = 'Update Game';
  } else if(action==='delete'){
    if(!confirm('Delete this game entry?')) return;
    const updated = games.filter(item=>item.id!==id);
    storage.set(gamesKey,updated); renderList(gamesKey,'gamesList');
    if(editingGameId===id){ editingGameId=null; gameForm.reset(); gameStars.set(0); gameForm.querySelector('button[type="submit"]').textContent='Add Game' }
  }
});

moviesList.addEventListener('click',e=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const key = btn.dataset.key; const id = btn.dataset.id; const action = btn.dataset.action;
  if(key !== moviesKey) return;
  const movies = storage.get(moviesKey);
  const idx = movies.findIndex(item=>item.id===id);
  if(action==='edit' && idx !== -1){
    const item = movies[idx];
    document.getElementById('movieName').value = item.name;
    document.getElementById('movieYear').value = item.year;
    movieStars.set(item.rating);
    editingMovieId = id;
    movieForm.querySelector('button[type="submit"]').textContent = 'Update Movie';
  } else if(action==='delete'){
    if(!confirm('Delete this movie entry?')) return;
    const updated = movies.filter(item=>item.id!==id);
    storage.set(moviesKey,updated); renderList(moviesKey,'moviesList');
    if(editingMovieId===id){ editingMovieId=null; movieForm.reset(); movieStars.set(0); movieForm.querySelector('button[type="submit"]').textContent='Add Movie' }
  }
});

/* MOODS */
const moodsKey='my_corner_moods_v1';
const moodForm = document.getElementById('moodForm');
function renderMoods(){
  const history = document.getElementById('moodHistory'); history.innerHTML='';
  const moods = storage.get(moodsKey).slice().reverse();
  moods.forEach(m=>{
    const el=document.createElement('div'); el.className='card'; el.innerHTML=`<div class="meta">${m.date}</div><strong>${escapeHtml(m.mood)}</strong>`;
    history.appendChild(el);
  });
  // today's mood (most recent date equal to today)
  const todayEl = document.getElementById('todayMood');
  const todayStr = new Date().toISOString().slice(0,10);
  const todays = storage.get(moodsKey).filter(x=>x.dateISO===todayStr);
  if(todays.length){ const last = todays[todays.length-1]; todayEl.innerHTML=`<div class="card">Today: <strong>${escapeHtml(last.mood)}</strong> <div class="meta">${last.date}</div></div>` } else todayEl.innerHTML='';
}

moodForm.addEventListener('submit',e=>{
  e.preventDefault();
  const dateInput=document.getElementById('moodDate').value;
  const mood = document.getElementById('moodSelect').value;
  const dateISO = dateInput;
  const moods = storage.get(moodsKey);
  moods.push({id:uid(),mood,date:new Date().toLocaleString(),dateISO}); storage.set(moodsKey,moods);
  moodForm.reset(); document.getElementById('moodDate').value = new Date().toISOString().slice(0,10);
  renderMoods();
});

/* ANIMALS */
const animalsKey='my_corner_animals_v1';
const animalForm=document.getElementById('animalForm');
function renderAnimals(){
  const list=document.getElementById('animalsList'); list.innerHTML='';
  const animals = storage.get(animalsKey).slice().reverse();
  animals.forEach(a=>{
    const el=document.createElement('div'); el.className='card';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>${escapeHtml(a.name)}</strong><div class="controls"><button class="btn small" data-id="${a.id}" data-action="edit">Edit</button><button class="btn small" data-id="${a.id}" data-action="delete">Delete</button></div></div>`;
    list.appendChild(el);
  });
}

function editAnimal(id){
  const arr = storage.get(animalsKey);
  const idx = arr.findIndex(x=>x.id===id);
  if(idx===-1) return;
  const newName = prompt('Edit animal name:', arr[idx].name);
  if(newName==null) return;
  arr[idx].name = newName.trim() || arr[idx].name;
  storage.set(animalsKey,arr);
  renderAnimals();
}

function deleteAnimal(id){
  if(!confirm('Delete this animal?')) return;
  const arr = storage.get(animalsKey).filter(x=>x.id!==id);
  storage.set(animalsKey,arr);
  renderAnimals();
}

document.getElementById('animalsList').addEventListener('click',e=>{
  const btn = e.target.closest('button'); if(!btn) return; const id = btn.dataset.id; const action = btn.dataset.action;
  if(action==='edit') editAnimal(id); else if(action==='delete') deleteAnimal(id);
});

animalForm.addEventListener('submit',e=>{e.preventDefault(); const name=document.getElementById('animalName').value.trim(); if(!name) return; const arr=storage.get(animalsKey); arr.push({id:uid(),name}); storage.set(animalsKey,arr); animalForm.reset(); renderAnimals();});

/* FAVORITES TOP 5 */
const favGamesKey = 'my_corner_fav_games_v1';
const favMoviesKey = 'my_corner_fav_movies_v1';
const favShowsKey = 'my_corner_fav_shows_v1';

const favGameForm = document.getElementById('favGameForm');
const favMovieForm = document.getElementById('favMovieForm');
const favShowForm = document.getElementById('favShowForm');

function renderFavList(key, containerId){
  const list = document.getElementById(containerId); list.innerHTML='';
  const items = storage.get(key);
  for(let i=0;i<5;i++){
    const it = items[i];
    const el = document.createElement('div'); el.className='card';
    if(it){
      el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(it.name)}</strong><div class="meta">slot ${i+1}</div></div><div class="controls"><button class="btn small" data-key="${key}" data-index="${i}" data-action="edit">Edit</button><button class="btn small" data-key="${key}" data-index="${i}" data-action="delete">Delete</button></div></div>`;
    } else {
      el.innerHTML = `<div class="meta">Empty slot ${i+1}</div>`;
    }
    list.appendChild(el);
  }
}

function addToFav(key,name){
  const arr = storage.get(key);
  if(arr.length>=5){ alert('Top 5 is full — edit or delete an existing slot first.'); return false }
  arr.push({id:uid(),name}); storage.set(key,arr); return true
}

favGameForm.addEventListener('submit',e=>{e.preventDefault(); const name=document.getElementById('favGameName').value.trim(); if(!name) return; if(addToFav(favGamesKey,name)){ favGameForm.reset(); renderFavList(favGamesKey,'favGamesList') } });
favMovieForm.addEventListener('submit',e=>{e.preventDefault(); const name=document.getElementById('favMovieName').value.trim(); if(!name) return; if(addToFav(favMoviesKey,name)){ favMovieForm.reset(); renderFavList(favMoviesKey,'favMoviesList') } });
favShowForm.addEventListener('submit',e=>{e.preventDefault(); const name=document.getElementById('favShowName').value.trim(); if(!name) return; if(addToFav(favShowsKey,name)){ favShowForm.reset(); renderFavList(favShowsKey,'favShowsList') } });

document.getElementById('favGamesList').addEventListener('click',e=>{
  const btn = e.target.closest('button'); if(!btn) return; const key = btn.dataset.key; const idx = Number(btn.dataset.index); const action = btn.dataset.action;
  const arr = storage.get(key);
  if(action==='edit'){
    const newName = prompt('Edit favorite:', arr[idx].name);
    if(newName==null) return; arr[idx].name = newName.trim() || arr[idx].name; storage.set(key,arr); renderFavList(key, 'favGamesList');
  } else if(action==='delete'){
    if(!confirm('Delete this favorite?')) return; arr.splice(idx,1); storage.set(key,arr); renderFavList(key,'favGamesList');
  }
});

document.getElementById('favMoviesList').addEventListener('click',e=>{
  const btn = e.target.closest('button'); if(!btn) return; const key = btn.dataset.key; const idx = Number(btn.dataset.index); const action = btn.dataset.action;
  const arr = storage.get(key);
  if(action==='edit'){
    const newName = prompt('Edit favorite:', arr[idx].name);
    if(newName==null) return; arr[idx].name = newName.trim() || arr[idx].name; storage.set(key,arr); renderFavList(key,'favMoviesList');
  } else if(action==='delete'){
    if(!confirm('Delete this favorite?')) return; arr.splice(idx,1); storage.set(key,arr); renderFavList(key,'favMoviesList');
  }
});

document.getElementById('favShowsList').addEventListener('click',e=>{
  const btn = e.target.closest('button'); if(!btn) return; const key = btn.dataset.key; const idx = Number(btn.dataset.index); const action = btn.dataset.action;
  const arr = storage.get(key);
  if(action==='edit'){
    const newName = prompt('Edit favorite:', arr[idx].name);
    if(newName==null) return; arr[idx].name = newName.trim() || arr[idx].name; storage.set(key,arr); renderFavList(key,'favShowsList');
  } else if(action==='delete'){
    if(!confirm('Delete this favorite?')) return; arr.splice(idx,1); storage.set(key,arr); renderFavList(key,'favShowsList');
  }
});

/* Utilities & init */
function escapeHtml(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}

function init(){
  document.getElementById('moodDate').value = new Date().toISOString().slice(0,10);
  renderPosts(); renderList(gamesKey,'gamesList'); renderList(moviesKey,'moviesList'); renderMoods(); renderAnimals();
  renderFavList(favGamesKey,'favGamesList'); renderFavList(favMoviesKey,'favMoviesList'); renderFavList(favShowsKey,'favShowsList');
  // sidebar toggle
  const toggle = document.getElementById('toggleSidebar'); if(toggle){ toggle.addEventListener('click',()=>{document.getElementById('sidebar').classList.toggle('collapsed')}) }
}

init();
