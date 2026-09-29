const { isAuthenticated, send, readJson, validate, seedData, loadLinks, saveLinks } = require("./_lib");

module.exports = async (req, res) => {
  if (!isAuthenticated(req)) return send(res, 401, { error: "Accesso richiesto" });

  try {
    if (req.method === "GET") {
      let data = null;
      try { data = await loadLinks(); } catch (e) { if (e.name !== "BlobNotFoundError") throw e; }
      if (!data) {
        // Prima esecuzione: lo storage è vuoto, si parte dai dati iniziali.
        data = seedData();
        await saveLinks(data);
      }
      return send(res, 200, data);
    }

    if (req.method === "PUT") {
      // Il Content-Type JSON obbliga i browser a una richiesta preflight
      // per le chiamate da altri siti, che qui non sono ammesse.
      if (!String(req.headers["content-type"] || "").startsWith("application/json")) {
        return send(res, 415, { error: "Serve application/json" });
      }
      let body;
      try { body = await readJson(req); } catch (e) { return send(res, e.status || 400, { error: "Richiesta non valida" }); }
      const data = validate(body);
      if (!data) return send(res, 400, { error: "Dati non validi" });
      await saveLinks(data);
      return send(res, 200, data);
    }

    send(res, 405, { error: "Metodo non consentito" }, { Allow: "GET, PUT" });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "Errore dello storage, riprova tra poco" });
  }
};
