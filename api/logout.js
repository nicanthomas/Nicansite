const { clearCookie, send } = require("./_lib");

module.exports = (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Metodo non consentito" }, { Allow: "POST" });
  send(res, 200, { ok: true }, { "Set-Cookie": clearCookie() });
};
