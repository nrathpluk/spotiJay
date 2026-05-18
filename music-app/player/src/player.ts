import { deleteSong, listSongs, uploadSong } from "./api/songs";
import { byId, optionalById, svgById } from "./hooks/dom";
import { playerState } from "./stores/playerStore";
import { getToken, isAdmin } from "./stores/session";
import { logger } from "./utils/logger";

declare global {
  interface Window {
    togglePlay: () => void;
    toggleMute: () => void;
    next: () => void;
    prev: () => void;
  }
}

const player = byId<HTMLAudioElement>("player");
const progress = byId<HTMLInputElement>("progress");
const progressFill = byId<HTMLElement>("progress-fill");
const volumeSlider = byId<HTMLInputElement>("volume");
const volumeFill = byId<HTMLElement>("volume-fill");
const currentTimeEl = byId<HTMLElement>("current-time");
const durationEl = byId<HTMLElement>("duration");
const songTitle = byId<HTMLElement>("song-title");
const songSubtitle = byId<HTMLElement>("song-subtitle");
const playlistEl = byId<HTMLUListElement>("playlist");
const playlistEmpty = byId<HTMLElement>("playlist-empty");
const playIcon = svgById("play-icon");
const albumArt = optionalById<HTMLElement>("album-art");

const VOLUME_KEY = "spotijay_volume";
const MAX_RENDERED = 50;
const ALLOWED_EXTENSIONS = /\.(m4a|mp3|wav|ogg|flac|aac)$/i;
const ALLOWED_MIME_TYPES = [
  "audio/mp4",
  "audio/x-m4a",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
  "audio/x-aac",
];

player.preload = "none";

function getSavedVolume(): number {
  try {
    const saved = localStorage.getItem(VOLUME_KEY);
    if (saved !== null) {
      const volume = Number.parseFloat(saved);
      if (!Number.isNaN(volume) && volume >= 0 && volume <= 1) return volume;
    }
  } catch (error) {
    logger.warn("Unable to read saved volume", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
  return 1;
}

function saveVolume(volume: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch (error) {
    logger.warn("Unable to save volume", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const savedVolume = getSavedVolume();
player.volume = savedVolume;
volumeSlider.value = String(savedVolume);
volumeFill.style.width = `${savedVolume * 100}%`;
let lastVolume = savedVolume > 0 ? savedVolume : 1;

function formatTime(seconds: number): string {
  if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

let lastProgressUpdate = 0;
player.addEventListener("timeupdate", () => {
  const now = Date.now();
  if (now - lastProgressUpdate < 250) return;
  lastProgressUpdate = now;
  if (!player.duration) return;
  progress.max = String(player.duration);
  progress.value = String(player.currentTime);
  const pct = (player.currentTime / player.duration) * 100;
  progressFill.style.width = `${pct}%`;
  currentTimeEl.textContent = formatTime(player.currentTime);
});

player.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(player.duration);
  progress.max = String(player.duration);
});

progress.addEventListener("input", () => {
  player.currentTime = Number.parseFloat(progress.value);
  const max = Number.parseFloat(progress.max);
  const value = Number.parseFloat(progress.value);
  progressFill.style.width = max > 0 ? `${(value / max) * 100}%` : "0%";
});

function updateVolumeIcon(volume: number): void {
  const button = optionalById<HTMLButtonElement>("volume-btn");
  const svg = button?.querySelector("svg");
  if (!svg) return;
  if (volume === 0) {
    svg.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  } else if (volume < 0.5) {
    svg.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
  } else {
    svg.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }
}

volumeSlider.addEventListener("input", () => {
  const volume = Number.parseFloat(volumeSlider.value);
  player.volume = volume;
  volumeFill.style.width = `${volume * 100}%`;
  saveVolume(volume);
  updateVolumeIcon(volume);
});
updateVolumeIcon(savedVolume);

window.toggleMute = () => {
  if (player.volume > 0) {
    lastVolume = player.volume;
    player.volume = 0;
    volumeSlider.value = "0";
    volumeFill.style.width = "0%";
    updateVolumeIcon(0);
  } else {
    player.volume = lastVolume;
    volumeSlider.value = String(lastVolume);
    volumeFill.style.width = `${lastVolume * 100}%`;
    saveVolume(lastVolume);
    updateVolumeIcon(lastVolume);
  }
};

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (event.code === "Space") {
    event.preventDefault();
    window.togglePlay();
  } else if (event.code === "ArrowRight") {
    event.preventDefault();
    window.next();
  } else if (event.code === "ArrowLeft") {
    event.preventDefault();
    window.prev();
  }
});

window.togglePlay = () => {
  if (!player.src || player.src === window.location.href) {
    if (playerState.playlist.length > 0) loadTrack(playerState.currentIndex, true);
    return;
  }
  if (player.paused) {
    void playCurrentTrack();
  } else {
    player.pause();
  }
};

async function playCurrentTrack(): Promise<void> {
  try {
    await player.play();
  } catch (error) {
    logger.error("Audio playback failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function wireButtons(): void {
  const playBtn = optionalById<HTMLButtonElement>("btn-play");
  const prevBtn = optionalById<HTMLButtonElement>("btn-prev");
  const nextBtn = optionalById<HTMLButtonElement>("btn-next");
  const volBtn = optionalById<HTMLButtonElement>("volume-btn");

  if (playBtn) {
    playBtn.removeAttribute("onclick");
    playBtn.addEventListener("click", window.togglePlay);
  }
  if (prevBtn) {
    prevBtn.removeAttribute("onclick");
    prevBtn.addEventListener("click", window.prev);
  }
  if (nextBtn) {
    nextBtn.removeAttribute("onclick");
    nextBtn.addEventListener("click", window.next);
  }
  if (volBtn) {
    volBtn.removeAttribute("onclick");
    volBtn.addEventListener("click", window.toggleMute);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireButtons);
} else {
  wireButtons();
}

player.addEventListener("play", () => {
  playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  albumArt?.classList.add("spinning");
  optionalById<HTMLButtonElement>("btn-play")?.classList.add("playing");
  setActiveEQ(true);
});

player.addEventListener("pause", () => {
  playIcon.innerHTML = '<polygon points="8,5 19,12 8,19"/>';
  albumArt?.classList.remove("spinning");
  optionalById<HTMLButtonElement>("btn-play")?.classList.remove("playing");
  setActiveEQ(false);
});

function setActiveEQ(playing: boolean): void {
  const active = playlistEl.querySelector("li.active");
  if (active) active.classList.toggle("eq-playing", playing);
}

function loadTrack(index: number, autoplay = true): void {
  player.pause();
  player.removeAttribute("src");
  player.load();
  player.preload = autoplay ? "auto" : "none";
  player.src = playerState.playlist[index] ?? "";
  if (autoplay) void playCurrentTrack();
}

window.next = () => {
  if (playerState.playlist.length === 0) return;
  playerState.currentIndex = (playerState.currentIndex + 1) % playerState.playlist.length;
  loadTrack(playerState.currentIndex);
  updateSongDisplay();
  updateActivePlaylistItem();
};

window.prev = () => {
  if (playerState.playlist.length === 0) return;
  if (player.currentTime > 3) {
    player.currentTime = 0;
    return;
  }
  playerState.currentIndex =
    (playerState.currentIndex - 1 + playerState.playlist.length) % playerState.playlist.length;
  loadTrack(playerState.currentIndex);
  updateSongDisplay();
  updateActivePlaylistItem();
};

player.addEventListener("ended", () => window.next());

function updateSongDisplay(): void {
  const name = playerState.names[playerState.currentIndex] ?? "No song playing";
  songTitle.textContent = name;
  songSubtitle.textContent = playerState.playlist.length > 0
    ? `Track ${playerState.currentIndex + 1} of ${playerState.playlist.length}`
    : "Select a track to play";
  document.title = playerState.playlist.length > 0
    ? `${name} - SpotiJay`
    : "SpotiJay - Music Player";
}

function renderPlaylist(): void {
  playlistEl.innerHTML = "";

  if (playerState.names.length === 0) {
    playlistEmpty.style.display = "flex";
    return;
  }
  playlistEmpty.style.display = "none";

  const fragment = document.createDocumentFragment();
  const renderCount = Math.min(playerState.names.length, MAX_RENDERED);

  for (let index = 0; index < renderCount; index += 1) {
    const name = playerState.names[index];
    if (!name) continue;

    const item = document.createElement("li");
    if (index === playerState.currentIndex) {
      item.classList.add("active");
      if (!player.paused) item.classList.add("eq-playing");
    }

    const numSpan = document.createElement("span");
    numSpan.className = "song-number";
    numSpan.innerHTML = `<span class="num-text">${(index + 1).toString().padStart(2, "0")}</span><span class="eq-bars"><i></i><i></i><i></i></span>`;

    const nameSpan = document.createElement("span");
    nameSpan.className = "song-name-text";
    nameSpan.textContent = name;

    const deleteButton = isAdmin() ? createDeleteButton(name, index) : null;
    item.appendChild(numSpan);
    item.appendChild(nameSpan);
    if (deleteButton) item.appendChild(deleteButton);

    item.addEventListener("click", () => {
      playerState.currentIndex = index;
      loadTrack(playerState.currentIndex);
      updateSongDisplay();
      updateActivePlaylistItem();
    });

    fragment.appendChild(item);
  }

  playlistEl.appendChild(fragment);

  if (playerState.names.length > MAX_RENDERED) {
    const notice = document.createElement("li");
    notice.className = "playlist-overflow-notice";
    notice.textContent = `Showing ${MAX_RENDERED} of ${playerState.names.length} tracks`;
    playlistEl.appendChild(notice);
  }
}

function createDeleteButton(name: string, index: number): HTMLButtonElement {
  const deleteButton = document.createElement("button");
  deleteButton.className = "song-delete-btn";
  deleteButton.setAttribute("aria-label", "Delete track");
  deleteButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>';

  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void handleDeleteSong(deleteButton, name, index);
  });

  return deleteButton;
}

async function handleDeleteSong(
  deleteButton: HTMLButtonElement,
  name: string,
  index: number
): Promise<void> {
  if (!confirm(`Delete "${name}"?`)) return;
  deleteButton.disabled = true;
  deleteButton.style.opacity = "0.5";
  deleteButton.style.pointerEvents = "none";

  try {
    const sourceUrl = playerState.playlist[index];
    const filename = sourceUrl ? decodeURIComponent(new URL(sourceUrl).pathname.split("/").pop() ?? name) : name;
    await deleteSong(filename, getToken());

    const wasPlaying = index === playerState.currentIndex;
    const wasActive = !player.paused;
    playerState.names.splice(index, 1);
    playerState.playlist.splice(index, 1);

    if (playerState.playlist.length === 0) {
      playerState.currentIndex = 0;
      player.pause();
      player.removeAttribute("src");
    } else if (wasPlaying) {
      playerState.currentIndex = Math.min(index, playerState.playlist.length - 1);
      loadTrack(playerState.currentIndex, wasActive);
    } else if (index < playerState.currentIndex) {
      playerState.currentIndex -= 1;
    }
    updateSongDisplay();
    renderPlaylist();
  } catch (error) {
    logger.error("Error deleting song", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    alert("Error deleting song");
    deleteButton.disabled = false;
    deleteButton.style.opacity = "";
    deleteButton.style.pointerEvents = "";
  }
}

function updateActivePlaylistItem(): void {
  const items = playlistEl.querySelectorAll("li:not(.playlist-overflow-notice)");
  items.forEach((item, index) => {
    const active = index === playerState.currentIndex;
    item.classList.toggle("active", active);
    item.classList.toggle("eq-playing", active && !player.paused);
  });
}

async function loadSongsFromAPI(): Promise<void> {
  try {
    const songs = await listSongs();
    const validSongs = songs.filter(
      (song) => typeof song.url === "string" && typeof song.name === "string"
    );

    if (validSongs.length === 0) {
      playerState.playlist = [];
      playerState.names = [];
      renderPlaylist();
      updateSongDisplay();
      return;
    }

    const previousName = playerState.names[playerState.currentIndex];
    playerState.playlist = validSongs.map((song) => song.url);
    playerState.names = validSongs.map((song) => song.name.replace(/\.[^/.]+$/, ""));
    const restoredIndex = previousName ? playerState.names.indexOf(previousName) : -1;
    playerState.currentIndex = restoredIndex >= 0 ? restoredIndex : 0;

    if (!player.src || player.src === window.location.href) {
      loadTrack(playerState.currentIndex, false);
    }
    renderPlaylist();
    updateSongDisplay();
  } catch (error) {
    logger.error("Failed to load songs", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

void loadSongsFromAPI();

function isValidAudioFile(file: File): boolean {
  const extensionOk = ALLOWED_EXTENSIONS.test(file.name);
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.type) || file.type.startsWith("audio/");
  return extensionOk && mimeOk;
}

async function uploadFileToR2(file: File): Promise<void> {
  try {
    await uploadSong(file, getToken());
    logger.info("Uploaded song", { fileName: file.name });
    await loadSongsFromAPI();
  } catch (error) {
    logger.error("Upload failed", {
      fileName: file.name,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    alert("Error uploading song");
  }
}

document.addEventListener("dragover", (event) => {
  event.preventDefault();
  optionalById<HTMLElement>("drop-zone")?.classList.add("drag-over");
});

document.addEventListener("dragleave", (event) => {
  if (!event.relatedTarget) optionalById<HTMLElement>("drop-zone")?.classList.remove("drag-over");
});

document.addEventListener("drop", (event) => {
  event.preventDefault();
  optionalById<HTMLElement>("drop-zone")?.classList.remove("drag-over");
  const files = event.dataTransfer?.files;
  if (!files) return;
  void handleFiles(files);
});

async function handleFiles(files: FileList): Promise<void> {
  for (const file of Array.from(files)) {
    if (!isValidAudioFile(file)) {
      alert(`"${file.name}" is not a supported audio file`);
      continue;
    }
    await uploadFileToR2(file);
  }
}

const uploadBtn = byId<HTMLButtonElement>("upload-btn");
const uploadInput = byId<HTMLInputElement>("upload-m4a");
uploadBtn.addEventListener("click", () => uploadInput.click());

function updateAdminUI(): void {
  const section = optionalById<HTMLElement>("upload-section") ?? document.querySelector<HTMLElement>(".upload-section");
  if (!section) return;
  section.style.display = isAdmin() ? "block" : "none";
}

updateAdminUI();

window.addEventListener("auth-success", () => {
  updateAdminUI();
  renderPlaylist();
});

uploadInput.setAttribute("accept", ".m4a,.mp3,.wav,.ogg,.flac,.aac,audio/*");
uploadInput.addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  void handleFiles(input.files);
});

function setGreeting(): void {
  const element = document.querySelector<HTMLElement>(".greeting");
  if (!element) return;
  const hour = new Date().getHours();
  element.textContent = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
}

setGreeting();
