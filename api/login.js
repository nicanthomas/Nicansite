const { safeEqual, sessionCookie, send, readJson } = require("./_lib");

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Metodo non consentito" }, { Allow: "POST" });

  const password = process.env.SITE_PASSWORD;
  if (!password) return send(res, 500, { error: "SITE_PASSWORD non impostata sul server" });

  let body;
  try { body = await readJson(req, 4096); } catch (e) { return send(res, e.status || 400, { error: "Richiesta non valida" }); }

  const given = body && typeof body.password === "string" ? body.password : "";
  if (!safeEqual(given, password)) {
    await sleep(800 + Math.floor(Math.random() * 400));
    return send(res, 401, { error: "Password sbagliata" });
  }
  send(res, 200, { ok: true }, { "Set-Cookie": sessionCookie() });
};
