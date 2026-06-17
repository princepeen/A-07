/* ============================================================
   MUSIC.JS — Song data, list rendering, audio player engine
   Used on: music.html
   ============================================================ */

(function() {
  'use strict';

  /* ══ Song data ══════════════════════════════════════════ */
  // Column 1: numbered (1-16)  → files: audio/1.mp3 … audio/16.mp3
  // Column 2: lettered (a-p)   → files: audio/a.mp3 … audio/p.mp3
  // Top song: audio/top.mp3    → Goodnight (Heyt)

  const COL1 = [
    { file: '1.mp3',  name: 'Another Love',        note: 'I\'d choose you, in every lifetime.' },
    { file: '2.mp3',  name: 'Double Take',          note: 'you still give me butterflies.' },
    { file: '3.mp3',  name: 'Give Me Your Forever', note: 'you\'re my always.' },
    { file: '4.mp3',  name: 'Glimpse of Us',        note: 'even in another life, it\'s you.' },
    { file: '5.mp3',  name: 'Heat Wave',            note: 'distance means nothing to us.' },
    { file: '6.mp3',  name: 'Heather',              note: 'you make me feel enough.' },
    { file: '7.mp3',  name: 'I Wanna Be Yours',     note: 'I just wanna be yours.' },
    { file: '8.mp3',  name: 'It\'s You',            note: 'it\'s always been you.' },
    { file: '9.mp3',  name: 'Love Me Like You Do',  note: 'love me your way.' },
    { file: '10.mp3', name: 'Lovers Rock',          note: 'you feel like home.' },
    { file: '11.mp3', name: 'Past Lives',           note: 'maybe we\'ve loved before.' },
    { file: '12.mp3', name: 'Salvatore',            note: 'you\'re my beautiful chaos.' },
    { file: '13.mp3', name: 'Satisfaction',         note: 'nothing compares to you.' },
    { file: '14.mp3', name: 'Talking to the Moon',  note: 'if you can\'t hear me, moon can.' },
    { file: '15.mp3', name: 'Until I Found You',    note: 'finding you was worth it.' },
    { file: '16.mp3', name: 'Wildflower',           note: 'you bloom in your own way.' },
  ];

  const COL2 = [
    { file: 'a.mp3', name: 'Baby Don\'t Cut',     note: 'stay, because tomorrow can be better.' },
    { file: 'b.mp3', name: 'Back to Friends',     note: 'some goodbyes aren\'t meant to be forever.' },
    { file: 'c.mp3', name: 'Creep',               note: 'i just want to feel like I belong.' },
    { file: 'd.mp3', name: 'Dollhouse',           note: 'perfect outside, broken inside.' },
    { file: 'e.mp3', name: 'Everything I Wanted', note: 'dreams mean more when you have a reason.' },
    { file: 'f.mp3', name: 'Family Line',         note: 'healing isn\'t always linear.' },
    { file: 'g.mp3', name: 'Home',                note: 'home is a feeling, not a place.' },
    { file: 'h.mp3', name: 'Let Down',            note: 'it\'s okay to feel let down sometimes.' },
    { file: 'i.mp3', name: 'Limbo',               note: 'stuck for now, not forever.' },
    { file: 'j.mp3', name: 'Male Fantasy',        note: 'the truth sets you free.' },
    { file: 'k.mp3', name: 'Matilda',             note: 'you deserve better.' },
    { file: 'l.mp3', name: 'Memories',            note: 'some memories never fade.' },
    { file: 'm.mp3', name: 'My Mind and Me',      note: 'learning to be okay with me.' },
    { file: 'n.mp3', name: 'Older',               note: 'growing up hurts.' },
    { file: 'o.mp3', name: 'Playdate',            note: 'not every bond is real.' },
    { file: 'p.mp3', name: 'Ugly',                note: 'you\'re not ugly, just human.' },
  ];

  const TOP = { file: 'top.mp3', name: 'Goodnight', note: '— Heyt' };

  /* ══ Build grid ═════════════════════════════════════════ */
  function makeSongRow(song, idx) {
    const div = document.createElement('div');
    div.className = 'song-row';
    div.dataset.idx = idx;
    div.innerHTML = `
      <div class="song-name">${song.name}</div>
      <div class="song-note">${song.note}</div>
    `;
    div.addEventListener('click', () => playSong(song, div));
    return div;
  }

  let allSongs = [...COL1, ...COL2];

  function buildGrid() {
    const grid = document.getElementById('songGrid');
    if (!grid) return;
    const maxLen = Math.max(COL1.length, COL2.length);
    for (let i = 0; i < maxLen; i++) {
      if (COL1[i]) grid.appendChild(makeSongRow(COL1[i], i));
      else grid.appendChild(document.createElement('div'));

      if (COL2[i]) grid.appendChild(makeSongRow(COL2[i], COL1.length + i));
      else grid.appendChild(document.createElement('div'));
    }
  }

  /* ══ Audio engine ═══════════════════════════════════════ */
  const audio = new Audio();
  let curSong = null;
  let curEl   = null;
  let curIdx  = -1; // -1 = none, -2 = top song

  let pName, pNote, pTime, playIcon, pauseIcon, progFill, eqBars, topSong, grid;

  function setPlaying(playing) {
    playIcon.style.display  = playing ? 'none'  : 'block';
    pauseIcon.style.display = playing ? 'block' : 'none';
    eqBars.forEach(b => b.classList.toggle('active', playing));
  }

  function loadSong(song, el, idx) {
    if (curEl) curEl.classList.remove('playing');
    topSong.classList.remove('playing');

    curSong = song;
    curEl   = el;
    curIdx  = idx;

    audio.src = 'audio/' + song.file;
    audio.load();
    audio.play().catch(() => {});

    pName.textContent = song.name;
    pNote.textContent = song.note;
    setPlaying(true);
    if (el) el.classList.add('playing');
  }

  function playSong(song, el) {
    const idx = allSongs.indexOf(song);
    if (curSong === song && !audio.paused) { audio.pause(); setPlaying(false); return; }
    if (curSong === song && audio.paused)  { audio.play();  setPlaying(true);  return; }
    loadSong(song, el, idx);
  }

  function playTop() {
    if (curSong && curSong.name === 'Goodnight' && !audio.paused) {
      audio.pause(); setPlaying(false); topSong.classList.remove('playing'); return;
    }
    if (curSong && curSong.name === 'Goodnight' && audio.paused) {
      audio.play(); setPlaying(true); topSong.classList.add('playing'); return;
    }
    if (curEl) curEl.classList.remove('playing');
    curEl = null; curIdx = -2;
    curSong = { ...TOP };
    audio.src = 'audio/top.mp3';
    audio.load();
    audio.play().catch(() => {});
    pName.textContent = TOP.name;
    pNote.textContent = TOP.note;
    setPlaying(true);
    topSong.classList.add('playing');
  }

  /* ══ Init ═══════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    pName     = document.getElementById('pName');
    pNote     = document.getElementById('pNote');
    pTime     = document.getElementById('pTime');
    playIcon  = document.getElementById('playIcon');
    pauseIcon = document.getElementById('pauseIcon');
    progFill  = document.getElementById('progressFill');
    eqBars    = document.querySelectorAll('.eq-bar');
    topSong   = document.getElementById('topSong');
    grid      = document.getElementById('songGrid');

    buildGrid();

    topSong.addEventListener('click', playTop);

    document.getElementById('playBtn').addEventListener('click', () => {
      if (!curSong) return;
      if (audio.paused) {
        audio.play(); setPlaying(true);
        if (curEl) curEl.classList.add('playing');
        if (curIdx === -2) topSong.classList.add('playing');
      } else {
        audio.pause(); setPlaying(false);
        if (curEl) curEl.classList.remove('playing');
        topSong.classList.remove('playing');
      }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
      if (curIdx < 0) return;
      const next = (curIdx + 1) % allSongs.length;
      const el = grid.querySelectorAll('.song-row')[next];
      playSong(allSongs[next], el);
      el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
      if (curIdx < 0) return;
      const prev = (curIdx - 1 + allSongs.length) % allSongs.length;
      const el = grid.querySelectorAll('.song-row')[prev];
      playSong(allSongs[prev], el);
      el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    audio.addEventListener('ended', () => {
      if (curIdx >= 0) {
        const next = (curIdx + 1) % allSongs.length;
        const el = grid.querySelectorAll('.song-row')[next];
        playSong(allSongs[next], el);
      } else {
        setPlaying(false);
        topSong.classList.remove('playing');
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      progFill.style.width = pct + '%';
      const m = Math.floor(audio.currentTime / 60);
      const s = Math.floor(audio.currentTime % 60);
      pTime.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    });

    document.getElementById('progressWrap').addEventListener('click', e => {
      if (!audio.duration) return;
      const r = e.currentTarget.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
  });

})();
                                           
