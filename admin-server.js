const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  MAX_JSON_BYTES,
  clearSessionCookie,
  createSessionManager,
  createUploadMiddleware,
  getSessionToken,
  parsePort,
  setSessionCookie
} = require("./server-common");
const { ensureStorage, readData, resetToBundledData, uploadsDir, writeData } = require("./site-store");

const DEFAULT_ADMIN_USER = "admin";
const DEFAULT_ADMIN_PASS = "foody2026";
const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = "sha512";
const MIN_PASSWORD_LENGTH = 8;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const app = express();
const port = parsePort(process.env.PORT, 3102);
const upload = createUploadMiddleware();
const sessions = createSessionManager(path.join(__dirname, "sessions.json"));
const dataRoot = process.env.DATA_FILE
  ? path.dirname(process.env.DATA_FILE)
  : __dirname;
const authFile = process.env.AUTH_FILE || path.join(dataRoot, "auth.json");
const loginAttempts = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString("hex");

  return {
    passwordHash,
    passwordSalt: salt,
    passwordIterations: HASH_ITERATIONS,
    passwordKeyLength: HASH_KEY_LENGTH,
    passwordDigest: HASH_DIGEST
  };
}

function verifyPassword(password, credentials) {
  if (!credentials || typeof password !== "string") return false;

  if (credentials.passwordHash && credentials.passwordSalt) {
    const iterations = Number(credentials.passwordIterations) || HASH_ITERATIONS;
    const keyLength = Number(credentials.passwordKeyLength) || HASH_KEY_LENGTH;
    const digest = credentials.passwordDigest || HASH_DIGEST;
    const candidateHash = crypto
      .pbkdf2Sync(password, credentials.passwordSalt, iterations, keyLength, digest)
      .toString("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(candidateHash, "hex"),
        Buffer.from(credentials.passwordHash, "hex")
      );
    } catch (_error) {
      return false;
    }
  }

  if (typeof credentials.pass === "string") {
    return password === credentials.pass;
  }

  return false;
}

function buildCredentialMeta(raw, source) {
  const user = typeof raw?.user === "string" && raw.user.trim()
    ? raw.user.trim()
    : DEFAULT_ADMIN_USER;
  const hasHash = typeof raw?.passwordHash === "string" && typeof raw?.passwordSalt === "string";
  const legacyPass = typeof raw?.pass === "string" ? raw.pass : "";
  const usesDefaultCredentials = user === DEFAULT_ADMIN_USER
    && (hasHash ? verifyPassword(DEFAULT_ADMIN_PASS, raw) : legacyPass === DEFAULT_ADMIN_PASS);

  return {
    ...raw,
    user,
    source,
    isLegacyPlainText: !hasHash && typeof raw?.pass === "string",
    usesDefaultCredentials
  };
}

function getAdminCredentials() {
  if (fs.existsSync(authFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(authFile, "utf8"));
      return buildCredentialMeta(parsed, "file");
    } catch (error) {
      console.error("Error reading auth.json:", error);
    }
  }

  const fallbackUser = process.env.ADMIN_USER || DEFAULT_ADMIN_USER;
  const fallbackPass = process.env.ADMIN_PASS || DEFAULT_ADMIN_PASS;
  return buildCredentialMeta(
    { user: fallbackUser, pass: fallbackPass },
    process.env.ADMIN_USER || process.env.ADMIN_PASS ? "env" : "default"
  );
}

function saveAdminCredentials(user, password) {
  try {
    const hashed = hashPassword(password);
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(
      authFile,
      JSON.stringify(
        {
          user,
          ...hashed,
          passwordUpdatedAt: new Date().toISOString()
        },
        null,
        2
      )
    );
    return true;
  } catch (error) {
    console.error("Error saving auth.json:", error);
    return false;
  }
}

function migrateLegacyCredentialsIfNeeded(credentials, password) {
  if (credentials?.source === "file" && credentials.isLegacyPlainText && typeof password === "string" && password) {
    const migrated = saveAdminCredentials(credentials.user, password);
    if (migrated) {
      currentCreds = getAdminCredentials();
      console.log("[AUTH] Migrated legacy plain-text credentials to hashed storage.");
    }
  }
}

function getRateLimitKey(req, username) {
  const requestIp = typeof req.ip === "string" && req.ip ? req.ip : "";
  const forwarded = typeof req.headers["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"] : "";
  const ip = requestIp || forwarded || "unknown";
  return `${String(username || "").trim().toLowerCase()}::${ip}`;
}

function getRateLimitState(key) {
  const now = Date.now();
  const state = loginAttempts.get(key);

  if (!state) {
    return { count: 0, firstAttemptAt: now, lockedUntil: 0 };
  }

  if (state.lockedUntil && state.lockedUntil > now) {
    return state;
  }

  if (now - state.firstAttemptAt > LOGIN_WINDOW_MS) {
    const resetState = { count: 0, firstAttemptAt: now, lockedUntil: 0 };
    loginAttempts.set(key, resetState);
    return resetState;
  }

  return state;
}

function registerFailedLogin(key) {
  const now = Date.now();
  const currentState = getRateLimitState(key);
  const nextState = {
    count: currentState.count + 1,
    firstAttemptAt: currentState.count === 0 ? now : currentState.firstAttemptAt,
    lockedUntil: 0
  };

  if (nextState.count >= MAX_LOGIN_ATTEMPTS) {
    nextState.lockedUntil = now + LOGIN_LOCK_MS;
  }

  loginAttempts.set(key, nextState);
  return nextState;
}

function clearFailedLogins(key) {
  loginAttempts.delete(key);
}

let currentCreds = getAdminCredentials();
if (currentCreds.usesDefaultCredentials) {
  console.warn("Using default fallback credentials (admin / foody2026). Consider changing them in the Security tab.");
}

ensureStorage();

app.use(express.json({ limit: MAX_JSON_BYTES }));

function requireAuth(req, res, next) {
  const token = getSessionToken(req);
  if (!sessions.isValid(token)) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }
  next();
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "admin" });
});

app.post("/api/admin/login", (req, res) => {
  console.log("[AUTH] Login request received.");
  const username = typeof req.body?.username === "string" ? req.body.username : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const rateLimitKey = getRateLimitKey(req, username);
  const rateLimitState = getRateLimitState(rateLimitKey);

  if (rateLimitState.lockedUntil && rateLimitState.lockedUntil > Date.now()) {
    const retryAfterSec = Math.max(1, Math.ceil((rateLimitState.lockedUntil - Date.now()) / 1000));
    res.status(429).json({ ok: false, error: "too_many_attempts", retryAfterSec });
    return;
  }

  currentCreds = getAdminCredentials();

  if (username !== currentCreds.user || !verifyPassword(password, currentCreds)) {
    const failedState = registerFailedLogin(rateLimitKey);
    console.warn(`[AUTH] Invalid credentials for: "${username}" password_length: ${password.length}`);

    if (failedState.lockedUntil && failedState.lockedUntil > Date.now()) {
      const retryAfterSec = Math.max(1, Math.ceil((failedState.lockedUntil - Date.now()) / 1000));
      res.status(429).json({ ok: false, error: "too_many_attempts", retryAfterSec });
      return;
    }

    res.status(401).json({ ok: false, error: "invalid_credentials" });
    return;
  }

  clearFailedLogins(rateLimitKey);
  migrateLegacyCredentialsIfNeeded(currentCreds, password);

  const token = sessions.create();
  setSessionCookie(res, token);
  res.json({ ok: true, user: currentCreds.user });
});

app.post("/api/admin/credentials", requireAuth, (req, res) => {
  currentCreds = getAdminCredentials();

  const newUsername = typeof req.body?.newUsername === "string" ? req.body.newUsername.trim() : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  const confirmPassword = typeof req.body?.confirmPassword === "string" ? req.body.confirmPassword : "";

  if (!newUsername) {
    res.status(400).json({ ok: false, error: "Nom d'utilisateur requis." });
    return;
  }

  if (newUsername.length < 3) {
    res.status(400).json({ ok: false, error: "Le nom d'utilisateur doit contenir au moins 3 caractères." });
    return;
  }

  let passwordToSave = "";
  if (newPassword) {
    if (newPassword !== confirmPassword) {
      res.status(400).json({ ok: false, error: "Les mots de passe ne correspondent pas." });
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ ok: false, error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` });
      return;
    }

    passwordToSave = newPassword;
  } else if (currentCreds.isLegacyPlainText && typeof currentCreds.pass === "string") {
    passwordToSave = currentCreds.pass;
  } else {
    res.status(400).json({ ok: false, error: "Saisissez un nouveau mot de passe pour finaliser cette mise à jour." });
    return;
  }

  const saved = saveAdminCredentials(newUsername, passwordToSave);
  if (!saved) {
    res.status(500).json({ ok: false, error: "Erreur lors de la sauvegarde côté serveur." });
    return;
  }

  currentCreds = getAdminCredentials();
  sessions.clearAll();
  const token = sessions.create();
  setSessionCookie(res, token);
  res.json({
    ok: true,
    user: currentCreds.user,
    message: "Identifiants sauvegardés avec succès. Les anciennes sessions ont été fermées."
  });
});

app.get("/api/admin/session", (req, res) => {
  const token = getSessionToken(req);
  res.json({ ok: true, authenticated: sessions.isValid(token) });
});

app.get("/api/admin/security-status", requireAuth, (_req, res) => {
  currentCreds = getAdminCredentials();
  res.json({
    ok: true,
    user: currentCreds.user,
    usesDefaultCredentials: currentCreds.usesDefaultCredentials,
    isLegacyPlainText: currentCreds.isLegacyPlainText,
    credentialSource: currentCreds.source,
    minPasswordLength: MIN_PASSWORD_LENGTH
  });
});

app.post("/api/admin/logout", (req, res) => {
  sessions.remove(getSessionToken(req));
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/data", requireAuth, (_req, res) => {
  res.json(readData());
});

app.post("/api/data", requireAuth, (req, res) => {
  const saved = writeData(req.body);
  res.json({ ok: true, data: saved });
});

app.get("/api/data/export", requireAuth, (_req, res) => {
  const data = readData();
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="restaurant-backup-${stamp}.json"`);
  res.send(JSON.stringify(data, null, 2));
});

app.post("/api/data/import", requireAuth, (req, res) => {
  try {
    const payload = req.body?.data && typeof req.body.data === "object" ? req.body.data : req.body;
    const saved = writeData(payload);
    res.json({ ok: true, data: saved });
  } catch (error) {
    console.error("IMPORT ERROR:", error);
    res.status(400).json({ ok: false, error: "invalid_import_payload" });
  }
});

app.post("/api/data/reset", requireAuth, (_req, res) => {
  const reset = resetToBundledData();
  res.json({ ok: true, data: reset });
});

app.post("/api/upload", requireAuth, (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      if (error.message === "unsupported_file_type") {
        res.status(400).json({ ok: false, error: "unsupported_file_type" });
        return;
      }

      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ ok: false, error: "file_too_large" });
        return;
      }

      next(error);
      return;
    }

    if (!req.file) {
      res.status(400).json({ ok: false, error: "no_file_uploaded" });
      return;
    }

    res.json({ ok: true, url: `/uploads/${req.file.filename}` });
  });
});

app.use("/uploads", express.static(uploadsDir));

app.get(["/", "/admin", "/admin.html"], (_req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.js", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin.js"));
});

app.get("/shared.js", (_req, res) => {
  res.sendFile(path.join(__dirname, "shared.js"));
});

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((_req, res) => {
  res.status(404).type("text/plain").send("Not Found");
});

app.use((error, _req, res, _next) => {
  console.error("ADMIN SERVER ERROR:", error);
  res.status(500).json({ ok: false, error: "internal_server_error" });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Restaurant admin server running on 0.0.0.0:${port}`);
});

module.exports = { app, server };
