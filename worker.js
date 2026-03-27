// =====================================================
// SpotiJay — Cloudflare Worker
// =====================================================
// KV Bindings required in Cloudflare Dashboard:
//   - USERS  → KV Namespace สำหรับเก็บ user accounts
// Environment Variables required:
//   - AUTH_SECRET → random secret string สำหรับ sign tokens
// =====================================================

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // ─── AUTH HELPERS ─────────────────────────────────

    async function sha256(message) {
      const buf = new TextEncoder().encode(message);
      const hash = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    }

    async function hmacSign(message) {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(env.AUTH_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
      return Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    }

    async function createToken(username) {
      const ts = Date.now().toString();
      const payload = `${username}|${ts}`;
      const sig = await hmacSign(payload);
      return btoa(`${payload}|${sig}`);
    }

    async function verifyToken(token) {
      try {
        const decoded = atob(token);
        const lastPipe = decoded.lastIndexOf("|");
        const payload = decoded.substring(0, lastPipe);
        const sig = decoded.substring(lastPipe + 1);
        const expected = await hmacSign(payload);
        if (sig !== expected) return null;
        const firstPipe = payload.indexOf("|");
        const ts = payload.substring(firstPipe + 1);
        const username = payload.substring(0, firstPipe);
        // Token หมดอายุใน 30 วัน
        if (Date.now() - parseInt(ts) > 30 * 24 * 60 * 60 * 1000) return null;
        return username;
      } catch {
        return null;
      }
    }

    async function hashPassword(password, username) {
      return sha256(`${username.toLowerCase()}:${password}:spotijay_kv`);
    }

    function json(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ─── REGISTER ──────────────────────────────────────

    if (request.method === "POST" && url.pathname === "/register") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

      const { username, password } = body;
      if (!username || !password) return json({ error: "Username and password required" }, 400);
      if (username.length < 3 || username.length > 32) return json({ error: "Username must be 3–32 characters" }, 400);
      if (!/^[a-zA-Z0-9_]+$/.test(username)) return json({ error: "Username: letters, numbers, underscore only" }, 400);
      if (password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

      const existing = await env.USERS.get(`user:${username.toLowerCase()}`);
      if (existing) return json({ error: "Username already taken" }, 409);

      const passwordHash = await hashPassword(password, username);
      await env.USERS.put(`user:${username.toLowerCase()}`, JSON.stringify({
        username,
        passwordHash,
        createdAt: new Date().toISOString(),
      }));

      const token = await createToken(username);
      return json({ token, username });
    }

    // ─── LOGIN ────────────────────────────────────────

    if (request.method === "POST" && url.pathname === "/login") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

      const { username, password } = body;
      if (!username || !password) return json({ error: "Username and password required" }, 400);

      const stored = await env.USERS.get(`user:${username.toLowerCase()}`);
      if (!stored) return json({ error: "Invalid username or password" }, 401);

      const user = JSON.parse(stored);
      const hash = await hashPassword(password, username);
      if (hash !== user.passwordHash) return json({ error: "Invalid username or password" }, 401);

      const token = await createToken(user.username);
      return json({ token, username: user.username });
    }

    // ─── ME (verify token) ───────────────────────────

    if (request.method === "GET" && url.pathname === "/me") {
      const auth = request.headers.get("Authorization");
      if (!auth || !auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
      const username = await verifyToken(auth.slice(7));
      if (!username) return json({ error: "Invalid or expired token" }, 401);
      return json({ username });
    }

    // ─── LIST SONGS ───────────────────────────────────

    if (request.method === "GET" && url.pathname === "/") {
      const objects = await env.MUSIC_BUCKET.list();
      const songs = objects.objects.map(obj => ({
        name: obj.key,
        url: `https://pub-2e8666cb559e404494da43e60f719738.r2.dev/${encodeURIComponent(obj.key)}`
      }));
      return new Response(JSON.stringify(songs), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    // ─── UPLOAD ──────────────────────────────────────

    if (request.method === "POST" && url.pathname === "/upload") {
      const form = await request.formData();
      const file = form.get("file");
      if (!file) return new Response("No file", { status: 400, headers: cors });
      await env.MUSIC_BUCKET.put(file.name, file.stream());
      return new Response("uploaded", { headers: cors });
    }

    // ─── DELETE ──────────────────────────────────────

    if (request.method === "DELETE" && url.pathname === "/delete") {
      const body = await request.json();
      await env.MUSIC_BUCKET.delete(body.name);
      return new Response("deleted", { headers: cors });
    }

    // ─── IMPORT PLAYLIST ─────────────────────────────

    if (request.method === "POST" && url.pathname === "/import") {
      const body = await request.json();
      const playlistRes = await fetch(body.url);
      const playlistText = await playlistRes.text();
      for (const line of playlistText.split("\n")) {
        if (line.startsWith("http")) {
          const songRes = await fetch(line);
          const fileName = line.split("/").pop().split("?")[0];
          await env.MUSIC_BUCKET.put(fileName, songRes.body);
        }
      }
      return new Response("playlist imported", { headers: cors });
    }

    return new Response("Not Found", { status: 404, headers: cors });
  }
};
