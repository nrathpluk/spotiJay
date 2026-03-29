// ==========================================
// SpotiJay — Enhanced Player Logic
// ==========================================

const player = document.getElementById("player");
const progress = document.getElementById("progress");
const progressFill = document.getElementById("progress-fill");
const volumeSlider = document.getElementById("volume");
const volumeFill = document.getElementById("volume-fill");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const songTitle = document.getElementById("song-title");
const songSubtitle = document.getElementById("song-subtitle");
const playlistEl = document.getElementById("playlist");
const playlistEmpty = document.getElementById("playlist-empty");
const playIcon = document.getElementById("play-icon");
const albumArt = document.getElementById("album-art");

const API = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

player.preload = "none";

let playlist = [];
let names = [];
let currentIndex = 0;

const isAdmin = () => localStorage.getItem("spotijay_is_admin") === "true";


// ---------- Volume Persistence ----------
const VOLUME_KEY = "spotijay_volume";

function getSavedVolume() {
  try {
    const saved = localStorage.getItem(VOLUME_KEY);
    if (saved !== null) {
      const vol = parseFloat(saved);
      if (!isNaN(vol) && vol >= 0 && vol <= 1) return vol;
    }
  } catch (e) {}
  return 1;
}

function saveVolume(vol) {
  try { localStorage.setItem(VOLUME_KEY, String(vol)); } catch (e) {}
}

// Apply saved volume
const savedVol = getSavedVolume();
player.volume = savedVol;
volumeSlider.value = savedVol;
volumeFill.style.width = (savedVol * 100) + "%";
let lastVolume = savedVol > 0 ? savedVol : 1;


// ---------- Time Formatting ----------
function formatTime(sec) {
  if (isNaN(sec) || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}


// ---------- Progress ----------
let _lastProgressUpdate = 0;
player.addEventListener("timeupdate", () => {
  const now = Date.now();
  if (now - _lastProgressUpdate < 250) return;
  _lastProgressUpdate = now;
  if (player.duration) {
    progress.max = player.duration;
    progress.value = player.currentTime;
    const pct = (player.currentTime / player.duration) * 100;
    progressFill.style.width = pct + "%";
    currentTimeEl.textContent = formatTime(player.currentTime);
  }
});

player.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(player.duration);
  progress.max = player.duration;
});

progress.addEventListener("input", () => {
  player.currentTime = progress.value;
  const pct = (progress.value / progress.max) * 100;
  progressFill.style.width = pct + "%";
});


// ---------- Volume ----------
volumeSlider.addEventListener("input", () => {
  const vol = parseFloat(volumeSlider.value);
  player.volume = vol;
  volumeFill.style.width = (vol * 100) + "%";
  saveVolume(vol);
  updateVolumeIcon(vol);
});

function updateVolumeIcon(vol) {
  const btn = document.getElementById("volume-btn");
  if (!btn) return;
  if (vol === 0) {
    btn.querySelector("svg").innerHTML = `<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`;
  } else if (vol < 0.5) {
    btn.querySelector("svg").innerHTML = `<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>`;
  } else {
    btn.querySelector("svg").innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
  }
}
updateVolumeIcon(savedVol);

window.toggleMute = function () {
  if (player.volume > 0) {
    lastVolume = player.volume;
    player.volume = 0;
    volumeSlider.value = 0;
    volumeFill.style.width = "0%";
    updateVolumeIcon(0);
  } else {
    player.volume = lastVolume;
    volumeSlider.value = lastVolume;
    volumeFill.style.width = (lastVolume * 100) + "%";
    saveVolume(lastVolume);
    updateVolumeIcon(lastVolume);
  }
};


// ---------- Keyboard Shortcuts ----------
document.addEventListener("keydown", (e) => {
  const tag = document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.code === "Space") { e.preventDefault(); window.togglePlay(); }
  else if (e.code === "ArrowRight") { e.preventDefault(); window.next(); }
  else if (e.code === "ArrowLeft") { e.preventDefault(); window.prev(); }
});


// ---------- Play / Pause — FIXED ----------
window.togglePlay = function () {
  // If no track is loaded, load the first one
  if (!player.src || player.src === window.location.href) {
    if (playlist.length > 0) loadTrack(currentIndex, true);
    return;
  }
  if (player.paused) {
    player.play().catch(console.error);
  } else {
    player.pause();
  }
};

// Wire buttons via addEventListener so module scope doesn't matter
function wireButtons() {
  const playBtn = document.getElementById("btn-play");
  const prevBtn = document.getElementById("btn-prev");
  const nextBtn = document.getElementById("btn-next");
  const volBtn  = document.getElementById("volume-btn");

  // Remove any inline onclick to prevent double-firing
  if (playBtn) { playBtn.removeAttribute("onclick"); playBtn.addEventListener("click", window.togglePlay); }
  if (prevBtn) { prevBtn.removeAttribute("onclick"); prevBtn.addEventListener("click", window.prev); }
  if (nextBtn) { nextBtn.removeAttribute("onclick"); nextBtn.addEventListener("click", window.next); }
  if (volBtn)  { volBtn.removeAttribute("onclick");  volBtn.addEventListener("click", window.toggleMute); }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireButtons);
} else {
  wireButtons();
}

player.addEventListener("play", () => {
  playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  if (albumArt) albumArt.classList.add("spinning");
  document.getElementById("btn-play").classList.add("playing");
  setActiveEQ(true);
});

player.addEventListener("pause", () => {
  playIcon.innerHTML = '<polygon points="8,5 19,12 8,19"/>';
  if (albumArt) albumArt.classList.remove("spinning");
  document.getElementById("btn-play").classList.remove("playing");
  setActiveEQ(false);
});

function setActiveEQ(playing) {
  const active = playlistEl.querySelector("li.active");
  if (active) active.classList.toggle("eq-playing", playing);
}


// ---------- Load Track ----------
function loadTrack(index, autoplay = true) {
  player.pause();
  if (player._blobUrl) { URL.revokeObjectURL(player._blobUrl); player._blobUrl = null; }
  player.removeAttribute("src");
  player.load();
  player.preload = autoplay ? "auto" : "none";
  player.src = playlist[index];
  if (autoplay) player.play().catch(console.error);
}


// ---------- Navigation ----------
window.next = function () {
  if (playlist.length === 0) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  loadTrack(currentIndex);
  updateSongDisplay();
  updateActivePlaylistItem();
};

window.prev = function () {
  if (playlist.length === 0) return;
  if (player.currentTime > 3) { player.currentTime = 0; return; }
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentIndex);
  updateSongDisplay();
  updateActivePlaylistItem();
};

player.addEventListener("ended", () => window.next());


// ---------- Song Display ----------
function updateSongDisplay() {
  const name = names[currentIndex] || "No song playing";
  songTitle.textContent = name;
  songSubtitle.textContent = playlist.length > 0 ? `Track ${currentIndex + 1} of ${playlist.length}` : "Select a track to play";
  document.title = playlist.length > 0 ? `${name} — SpotiJay` : "SpotiJay — Music Player";
}


// ---------- Playlist Rendering ----------
const MAX_RENDERED = 50;

function renderPlaylist() {
  playlistEl.innerHTML = "";

  if (names.length === 0) {
    playlistEmpty.style.display = "flex";
    return;
  }
  playlistEmpty.style.display = "none";

  const fragment = document.createDocumentFragment();
  const renderCount = Math.min(names.length, MAX_RENDERED);

  for (let index = 0; index < renderCount; index++) {
    const name = names[index];
    const li = document.createElement("li");

    if (index === currentIndex) {
      li.classList.add("active");
      if (!player.paused) li.classList.add("eq-playing");
    }

    const numSpan = document.createElement("span");
    numSpan.className = "song-number";
    numSpan.innerHTML = `<span class="num-text">${(index + 1).toString().padStart(2, "0")}</span><span class="eq-bars"><i></i><i></i><i></i></span>`;

    const nameSpan = document.createElement("span");
    nameSpan.className = "song-name-text";
    nameSpan.textContent = name;

    let deleteBtn = null;
    if (isAdmin()) {
      deleteBtn = document.createElement("button");
      deleteBtn.className = "song-delete-btn";
      deleteBtn.setAttribute("aria-label", "Delete track");
      deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

      deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm(`Delete "${name}"?`)) return;

        deleteBtn.disabled = true;
        deleteBtn.style.opacity = "0.5";
        deleteBtn.style.pointerEvents = "none";

        try {
          const filename = decodeURIComponent(playlist[index].split("/").pop());
          const token = localStorage.getItem("spotijay_token");
          const res = await fetch(`${API}/delete`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name: filename })
          });
          if (!res.ok) throw new Error("delete failed");

          const wasPlaying = index === currentIndex;
          const wasActive = !player.paused;
          names.splice(index, 1);
          playlist.splice(index, 1);

          if (playlist.length === 0) {
            currentIndex = 0;
            player.pause();
            player.src = "";
          } else if (wasPlaying) {
            currentIndex = Math.min(index, playlist.length - 1);
            loadTrack(currentIndex, wasActive);
          } else if (index < currentIndex) {
            currentIndex--;
          }
          updateSongDisplay();
          renderPlaylist();
        } catch (err) {
          console.error(err);
          alert("Error deleting song");

          deleteBtn.disabled = false;
          deleteBtn.style.opacity = "";
          deleteBtn.style.pointerEvents = "";
        }
      };
    }

    li.appendChild(numSpan);
    li.appendChild(nameSpan);
    if (deleteBtn) li.appendChild(deleteBtn);

    li.onclick = () => {
      currentIndex = index;
      loadTrack(currentIndex);
      updateSongDisplay();
      updateActivePlaylistItem();
    };

    fragment.appendChild(li);
  }

  playlistEl.appendChild(fragment);

  if (names.length > MAX_RENDERED) {
    const notice = document.createElement("li");
    notice.className = "playlist-overflow-notice";
    notice.textContent = `Showing ${MAX_RENDERED} of ${names.length} tracks`;
    playlistEl.appendChild(notice);
  }
}

function updateActivePlaylistItem() {
  const items = playlistEl.querySelectorAll("li:not(.playlist-overflow-notice)");
  items.forEach((item, i) => {
    const isActive = i === currentIndex;
    item.classList.toggle("active", isActive);
    item.classList.toggle("eq-playing", isActive && !player.paused);
  });
}


// ---------- Load Songs from API ----------
async function loadSongsFromAPI() {
  try {
    const res = await fetch(API);

    //  เช็คว่า request สำเร็จไหม
    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const songs = await res.json();

    //  เช็คว่าเป็น array
    if (!Array.isArray(songs)) throw new Error("API response is not an array");

    //  กรองเฉพาะ object ที่มี url และ name ครบ
    const validSongs = songs.filter(
      s => s && typeof s.url === "string" && typeof s.name === "string"
    );

    if (validSongs.length > 0) {
      const prevName = names[currentIndex];
      playlist = validSongs.map(s => s.url);                          
      names = validSongs.map(s => s.name.replace(/\.[^/.]+$/, ""));  
      const restoredIndex = names.indexOf(prevName);
      currentIndex = restoredIndex >= 0 ? restoredIndex : 0;
      if (!player.src || player.src === window.location.href) {
        loadTrack(currentIndex, false);
      }
      renderPlaylist();
      updateSongDisplay();
    }
  } catch (err) {
    console.error("Failed to load songs:", err);
  }
}
loadSongsFromAPI();


// ---------- Upload ----------
//  กำหนด allowed types ไว้ที่เดียว
const ALLOWED_EXTENSIONS = /\.(m4a|mp3|wav|ogg|flac|aac)$/i;
const ALLOWED_MIME_TYPES = [
  "audio/mp4", "audio/x-m4a", "audio/mpeg", "audio/wav",
  "audio/ogg", "audio/flac", "audio/aac", "audio/x-aac"
];

function isValidAudioFile(file) {
  const extOk = ALLOWED_EXTENSIONS.test(file.name);
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type) || file.type.startsWith("audio/");
  return extOk && mimeOk;
}

async function uploadFileToR2(file) {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("spotijay_token");
  const res = await fetch(API + "/upload", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });
  if (res.ok) { console.log("Uploaded:", file.name); loadSongsFromAPI(); }
}

document.addEventListener("dragover", (e) => {
  e.preventDefault();
  document.getElementById("drop-zone").classList.add("drag-over");
});
document.addEventListener("dragleave", (e) => {
  if (!e.relatedTarget) document.getElementById("drop-zone").classList.remove("drag-over");
});
document.addEventListener("drop", async (e) => {
  e.preventDefault();
  document.getElementById("drop-zone").classList.remove("drag-over");
  const files = e.dataTransfer.files;
  for (let file of files) {
    //  ใช้ isValidAudioFile แทน (เช็คทั้ง extension + MIME)
    if (!isValidAudioFile(file)) {
      alert(`"${file.name}" is not a supported audio file`);
      continue;
    }
    await uploadFileToR2(file);
  }
});

const uploadBtn = document.getElementById("upload-btn");
const uploadInput = document.getElementById("upload-m4a");
uploadBtn.onclick = () => uploadInput.click();

function updateAdminUI() {
  if (isAdmin()) {
    document.querySelector(".upload-section").style.display = "block";
  } else {
    document.querySelector(".upload-section").style.display = "none";
  }
}

// Check admin UI on init
updateAdminUI();

// Update on login success
window.addEventListener("auth-success", () => {
  updateAdminUI();
  // re-render the playlist to show/hide delete buttons
  renderPlaylist();
});

//  ให้ file picker รับไฟล์เดียวกับ drag & drop
uploadInput.setAttribute("accept", ".m4a,.mp3,.wav,.ogg,.flac,.aac,audio/*");
uploadInput.onchange = async (e) => {
  for (let file of e.target.files) {
    //  ใช้ isValidAudioFile แทน (เช็คทั้ง extension + MIME)
    if (!isValidAudioFile(file)) {
      alert(`"${file.name}" is not a supported audio file`);
      continue;
    }
    await uploadFileToR2(file);
  }
};

// ---------- Dynamic Greeting ----------
(function setGreeting() {
  const el = document.querySelector(".greeting");
  if (!el) return;
  const h = new Date().getHours();
  el.textContent = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
})();