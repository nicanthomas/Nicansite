// Codice condiviso dalle funzioni in api/. Il prefisso "_" evita che Vercel
// lo esponga come endpoint.
const crypto = require("crypto");
const { get, put } = require("@vercel/blob");
const seed = require("../seed-links.json");

const COOKIE = "session";
const SESSION_DAYS = 30;
const BLOB_PATH = "links.json";

const TYPES = ["site", "artifact", "exe"];
const LIMITS = { sections: 50, items: 500, title: 60, name: 80, icon: 16, url: 2048, id: 32 };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET mancante o troppo corta");
  return s;
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sessionCookie() {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = "v1." + exp;
  const value = payload + "." + sign(payload);
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;
}

function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

function isAuthenticated(req) {
  const value = readCookie(req, COOKIE);
  if (!value) return false;
  const i = value.lastIndexOf(".");
  if (i < 0) return false;
  const payload = value.slice(0, i);
  const [version, exp] = payload.split(".");
  if (version !== "v1" || !(Number(exp) > Date.now())) return false;
  return safeEqual(value.slice(i + 1), sign(payload));
}

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

async function readJson(req, maxBytes = 256 * 1024) {
  if (req.body !== undefined && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  let raw = "";
  if (typeof req.body === "string") raw = req.body;
  else if (Buffer.isBuffer(req.body)) raw = req.body.toString("utf8");
  else {
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > maxBytes) throw Object.assign(new Error("too large"), { status: 413 });
    }
  }
  if (raw.length > maxBytes) throw Object.assign(new Error("too large"), { status: 413 });
  try { return JSON.parse(raw || "null"); } catch { throw Object.assign(new Error("bad json"), { status: 400 }); }
}

function newId() {
  return crypto.randomBytes(6).toString("base64url");
}

function str(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function cleanUrl(v) {
  if (typeof v !== "string" || v.length > LIMITS.url) return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch { return null; }
}

// Accetta solo la struttura prevista: scarta i campi sconosciuti e
// rifiuta indirizzi che non siano http(s).
function validate(data) {
  if (!data || !Array.isArray(data.sections)) return null;
  if (data.sections.length > LIMITS.sections) return null;
  let count = 0;
  const sections = [];
  for (const s of data.sections) {
    if (!s || !Array.isArray(s.items)) return null;
    const title = str(s.title, LIMITS.title);
    if (!title) return null;
    const items = [];
    for (const it of s.items) {
      if (++count > LIMITS.items) return null;
      const name = str(it && it.name, LIMITS.name);
      const url = cleanUrl(it && it.url);
      if (!name || !url) return null;
      items.push({
        id: str(it.id, LIMITS.id) || newId(),
        name,
        icon: str(it.icon, LIMITS.icon),
        url,
        type: TYPES.includes(it.type) ? it.type : "site",
      });
    }
    sections.push({ id: str(s.id, LIMITS.id) || newId(), title, items });
  }
  return { sections };
}

function seedData() {
  return validate({
    sections: seed.sections.map(s => ({
      id: newId(),
      title: s.title,
      items: s.items.map(it => ({ ...it, id: newId() })),
    })),
  });
}

async function loadLinks() {
  const result = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function saveLinks(data) {
  await put(BLOB_PATH, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

module.exports = {
  safeEqual, sessionCookie, clearCookie, isAuthenticated, send, readJson,
  validate, seedData, loadLinks, saveLinks,
};
