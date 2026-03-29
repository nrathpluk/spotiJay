// =====================================================
// SpotiJay — Auth Module
// =====================================================

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "spotijay_token";

// ─── Token Helpers ────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Screen Helpers ───────────────────────────────

function showAuthScreen() {
  document.getElementById("auth-screen").style.display = "flex";
  document.getElementById("app").style.display = "none";
}

function hideAuthScreen(username) {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app").style.display = "grid";
  const badge = document.getElementById("user-badge");
  if (badge) badge.textContent = username;
  window.dispatchEvent(new Event("auth-success"));
}

function showError(msg) {
  const el = document.getElementById("auth-error");
  if (el) { el.textContent = msg; el.style.display = msg ? "block" : "none"; }
}

function clearError() {
  showError("");
}

// ─── Tab Switching ────────────────────────────────

function showLoginTab() {
  document.getElementById("login-form").style.display = "flex";
  document.getElementById("register-form").style.display = "none";
  document.getElementById("tab-login").classList.add("active");
  document.getElementById("tab-register").classList.remove("active");
  clearError();
}

function showRegisterTab() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "flex";
  document.getElementById("tab-login").classList.remove("active");
  document.getElementById("tab-register").classList.add("active");
  clearError();
}

// ─── Check existing session ───────────────────────

async function checkAuth() {
  const token = getToken();
  if (!token) { showAuthScreen(); return; }

  try {
    const res = await fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("spotijay_is_admin", data.isAdmin ? "true" : "false");
      hideAuthScreen(data.username);
    } else {
      clearToken();
      showAuthScreen();
    }
  } catch {
    // Network error — ไม่มั่นใจ token ให้ login ใหม่
    clearToken();
    showAuthScreen();
  }
}

// ─── Login ───────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  clearError();

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) { showError("Please fill in all fields"); return; }

  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "Signing in…";

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) { showError(data.error || "Login failed"); return; }
    saveToken(data.token);
    localStorage.setItem("spotijay_is_admin", data.isAdmin ? "true" : "false");
    hideAuthScreen(data.username);
  } catch {
    showError("Network error. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
}

// ─── Register ─────────────────────────────────────

async function handleRegister(e) {
  e.preventDefault();
  clearError();

  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  if (!username || !password) { showError("Please fill in all fields"); return; }
  if (password !== confirm) { showError("Passwords do not match"); return; }
  if (password.length < 6) { showError("Password must be at least 6 characters"); return; }

  const btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.textContent = "Creating account…";

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) { showError(data.error || "Registration failed"); return; }
    saveToken(data.token);
    localStorage.setItem("spotijay_is_admin", data.isAdmin ? "true" : "false");
    hideAuthScreen(data.username);
  } catch {
    showError("Network error. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
}

// ─── Logout ──────────────────────────────────────

function logout() {
  clearToken();
  localStorage.removeItem("spotijay_is_admin");
  showAuthScreen();
  showLoginTab();
  // Reset inputs
  ["login-username", "login-password", "reg-username", "reg-password", "reg-confirm"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

// ─── Init ─────────────────────────────────────────

function initAuth() {
  document.getElementById("login-form")?.addEventListener("submit", handleLogin);
  document.getElementById("register-form")?.addEventListener("submit", handleRegister);
  document.getElementById("tab-login")?.addEventListener("click", showLoginTab);
  document.getElementById("tab-register")?.addEventListener("click", showRegisterTab);
  document.getElementById("logout-btn")?.addEventListener("click", logout);

  // ซ่อน app ก่อน ระหว่างที่ check token
  document.getElementById("app").style.display = "none";

  checkAuth();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
