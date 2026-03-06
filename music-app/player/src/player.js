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
const playerSongName = document.getElementById("player-song-name");
const nowPlayingLabel = document.getElementById("now-playing-label");
const playlistEl = document.getElementById("playlist");
const playlistEmpty = document.getElementById("playlist-empty");
const playIcon = document.getElementById("play-icon");
const albumArt = document.getElementById("album-art");
const visualizer = document.getElementById("visualizer");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");

const API = "https://music-api.qazsamui004.workers.dev";

let playlist = [];
let names = [];
let currentIndex = 0;


// ---------- Time Formatting ----------
function formatTime(sec) {
  if (isNaN(sec) || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}


// ---------- Progress ----------
player.addEventListener("timeupdate", () => {

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

  player.volume = volumeSlider.value;
  volumeFill.style.width = (volumeSlider.value * 100) + "%";

});

volumeFill.style.width = "100%";


// ---------- Play / Pause ----------
window.togglePlay = function () {

  if (player.paused) {
    player.play();
  } else {
    player.pause();
  }

};

player.addEventListener("play", () => {

  playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  albumArt.classList.add("spinning");
  visualizer.classList.add("active");

});

player.addEventListener("pause", () => {

  playIcon.innerHTML = '<polygon points="8,5 19,12 8,19"/>';
  albumArt.classList.remove("spinning");
  visualizer.classList.remove("active");

});


// ---------- Navigation ----------
window.next = function () {

  if (playlist.length === 0) return;

  currentIndex = (currentIndex + 1) % playlist.length;
  player.src = playlist[currentIndex];

  player.play();

  updateSongDisplay();
  updateActivePlaylistItem();

};

window.prev = function () {

  if (playlist.length === 0) return;

  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  player.src = playlist[currentIndex];

  player.play();

  updateSongDisplay();
  updateActivePlaylistItem();

};

player.addEventListener("ended", () => {

  window.next();

});


// ---------- Song Display ----------
function updateSongDisplay() {

  const name = names[currentIndex] || "No song playing";

  songTitle.textContent = name;
  songSubtitle.textContent = `Track ${currentIndex + 1} of ${playlist.length}`;

  playerSongName.textContent = name;

}


// ---------- Playlist Rendering ----------
function renderPlaylist() {

  playlistEl.innerHTML = "";

  if (names.length === 0) {

    playlistEmpty.style.display = "flex";
    return;

  }

  playlistEmpty.style.display = "none";

  names.forEach((name, index) => {

    const li = document.createElement("li");

    const numSpan = document.createElement("span");
    numSpan.className = "song-number";
    numSpan.textContent = (index + 1).toString().padStart(2, "0");

    const nameSpan = document.createElement("span");
    nameSpan.className = "song-name-text";
    nameSpan.textContent = name;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "song-delete-btn";
    deleteBtn.innerHTML = "🗑";

    deleteBtn.onclick = async (e) => {

      e.stopPropagation();

      if (!confirm(`Delete "${name}" ?`)) return;

      try {

        const filename = playlist[index].split("/").pop();

        const res = await fetch(`${API}/delete`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: filename
          })
        });

        if (!res.ok) throw new Error("delete failed");

        names.splice(index, 1);
        playlist.splice(index, 1);

        renderPlaylist();

      } catch (err) {

        console.error(err);
        alert("Error deleting song");

      }

    };

    li.appendChild(numSpan);
    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);

    if (index === currentIndex) {

      li.classList.add("active");

    }

    li.onclick = () => {

      currentIndex = index;

      player.src = playlist[currentIndex];
      player.play();

      updateSongDisplay();
      updateActivePlaylistItem();

    };

    playlistEl.appendChild(li);

  });

}

function updateActivePlaylistItem() {

  const items = playlistEl.querySelectorAll("li");

  items.forEach((item, i) => {

    item.classList.toggle("active", i === currentIndex);

  });

}


// ---------- Load Songs from API ----------
async function loadSongsFromAPI() {

  try {

    const res = await fetch(API);
    const songs = await res.json();

    if (songs.length > 0) {

      playlist = songs.map(song => song.url);
      names = songs.map(song => song.name.replace(/\.[^/.]+$/, ""));

      currentIndex = 0;

      player.src = playlist[currentIndex];

      renderPlaylist();
      updateSongDisplay();

    }

  } catch (err) {

    console.error("Failed to load songs:", err);

  }

}

loadSongsFromAPI();


// ---------- Upload ----------
async function uploadFileToR2(file) {

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API + "/upload", {
    method: "POST",
    body: formData
  });

  if (res.ok) {

    console.log("Uploaded:", file.name);
    loadSongsFromAPI();

  }

}


// ---------- Drag & Drop ----------
document.addEventListener("drop", async (e) => {

  e.preventDefault();

  const files = e.dataTransfer.files;

  if (files.length > 0) {

    for (let file of files) {

      await uploadFileToR2(file);

    }

  }

});


// ---------- File Input ----------
fileInput.addEventListener("change", async (e) => {

  const files = e.target.files;

  if (files.length > 0) {

    for (let file of files) {

      await uploadFileToR2(file);

    }

  }

});


// ---------- Import Playlist ----------
async function importPlaylist() {

  const url = prompt("Paste playlist URL");

  if (!url) return;

  try {

    const res = await fetch(API + "/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {

      alert("Import failed");
      return;

    }

    alert("Playlist importing... please wait");

    setTimeout(() => {

      loadSongsFromAPI();

    }, 5000);

  } catch (err) {

    console.error(err);

  }

}
// Upload M4A Button
const uploadBtn = document.getElementById("upload-btn");
const uploadInput = document.getElementById("upload-m4a");

uploadBtn.onclick = () => {
  uploadInput.click();
};

uploadInput.onchange = async (e) => {

  const files = e.target.files;

  if (!files.length) return;

  for (let file of files) {

    if (!file.name.endsWith(".m4a")) {
      alert("Only M4A allowed");
      continue;
    }

    await uploadFileToR2(file);

  }

};