import { getCurrentUser, login, register } from "./api/auth";
import { byId, optionalById } from "./hooks/dom";
import { clearSession, getToken, saveSession } from "./stores/session";
import { logger } from "./utils/logger";

function showAuthScreen(): void {
  byId<HTMLElement>("auth-screen").style.display = "flex";
  byId<HTMLElement>("app").style.display = "none";
}

function hideAuthScreen(username: string): void {
  byId<HTMLElement>("auth-screen").style.display = "none";
  byId<HTMLElement>("app").style.display = "grid";
  const badge = optionalById<HTMLElement>("user-badge");
  if (badge) badge.textContent = username;
  window.dispatchEvent(new Event("auth-success"));
}

function showError(message: string): void {
  const element = optionalById<HTMLElement>("auth-error");
  if (!element) return;
  element.textContent = message;
  element.style.display = message ? "block" : "none";
}

function clearError(): void {
  showError("");
}

function showLoginTab(): void {
  byId<HTMLElement>("login-form").style.display = "flex";
  byId<HTMLElement>("register-form").style.display = "none";
  byId<HTMLElement>("tab-login").classList.add("active");
  byId<HTMLElement>("tab-register").classList.remove("active");
  clearError();
}

function showRegisterTab(): void {
  byId<HTMLElement>("login-form").style.display = "none";
  byId<HTMLElement>("register-form").style.display = "flex";
  byId<HTMLElement>("tab-login").classList.remove("active");
  byId<HTMLElement>("tab-register").classList.add("active");
  clearError();
}

async function checkAuth(): Promise<void> {
  const token = getToken();
  if (!token) {
    showAuthScreen();
    return;
  }

  try {
    const user = await getCurrentUser(token);
    saveSession(token, user.isAdmin);
    hideAuthScreen(user.username);
  } catch (error) {
    logger.warn("Session verification failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    clearSession();
    showAuthScreen();
  }
}

async function handleLogin(event: Event): Promise<void> {
  event.preventDefault();
  clearError();

  const username = byId<HTMLInputElement>("login-username").value.trim();
  const password = byId<HTMLInputElement>("login-password").value;
  if (!username || !password) {
    showError("Please fill in all fields");
    return;
  }

  const button = byId<HTMLButtonElement>("login-btn");
  button.disabled = true;
  button.textContent = "Signing in...";

  try {
    const result = await login({ username, password });
    saveSession(result.token, result.isAdmin);
    hideAuthScreen(result.username);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Login failed");
  } finally {
    button.disabled = false;
    button.textContent = "Sign In";
  }
}

async function handleRegister(event: Event): Promise<void> {
  event.preventDefault();
  clearError();

  const username = byId<HTMLInputElement>("reg-username").value.trim();
  const password = byId<HTMLInputElement>("reg-password").value;
  const confirm = byId<HTMLInputElement>("reg-confirm").value;

  if (!username || !password) {
    showError("Please fill in all fields");
    return;
  }
  if (password !== confirm) {
    showError("Passwords do not match");
    return;
  }
  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  const button = byId<HTMLButtonElement>("register-btn");
  button.disabled = true;
  button.textContent = "Creating account...";

  try {
    const result = await register({ username, password });
    saveSession(result.token, result.isAdmin);
    hideAuthScreen(result.username);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Registration failed");
  } finally {
    button.disabled = false;
    button.textContent = "Create Account";
  }
}

function logout(): void {
  clearSession();
  showAuthScreen();
  showLoginTab();
  ["login-username", "login-password", "reg-username", "reg-password", "reg-confirm"]
    .forEach((id) => {
      const element = optionalById<HTMLInputElement>(id);
      if (element) element.value = "";
    });
}

function initAuth(): void {
  optionalById<HTMLFormElement>("login-form")?.addEventListener("submit", (event) => {
    void handleLogin(event);
  });
  optionalById<HTMLFormElement>("register-form")?.addEventListener("submit", (event) => {
    void handleRegister(event);
  });
  optionalById<HTMLButtonElement>("tab-login")?.addEventListener("click", showLoginTab);
  optionalById<HTMLButtonElement>("tab-register")?.addEventListener("click", showRegisterTab);
  optionalById<HTMLButtonElement>("logout-btn")?.addEventListener("click", logout);

  byId<HTMLElement>("app").style.display = "none";
  void checkAuth();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
