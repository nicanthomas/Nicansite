# Nicansite: home dei miei siti

Pagina iniziale personale in stile "nuova scheda di Chrome", protetta da password.
I collegamenti si gestiscono dalla pagina (pulsante **Modifica**) e sono uguali su tutti i dispositivi.

## Come funziona

- `index.html`: la pagina, un solo file con CSS e JavaScript inline. Non contiene dati: li carica da `/api/links`.
- `api/login.js`: controlla la password e imposta un cookie di sessione firmato (HMAC-SHA256, HttpOnly, Secure, SameSite=Strict, 30 giorni).
- `api/logout.js`: cancella il cookie.
- `api/links.js`: `GET` restituisce i collegamenti, `PUT` li salva. Senza sessione valida risponde 401.
- I dati stanno in un unico file `links.json` in uno store **Vercel Blob privato**.
- `seed-links.json`: dati iniziali, usati solo la prima volta, quando lo store è ancora vuoto.

Pubblicato su Vercel (progetto `home-siti`), collegato a questo repo: ogni push su `main` va online da solo. Nessuna fase di build.

## Variabili d'ambiente (Vercel → Settings → Environment Variables)

| Nome | A cosa serve |
| --- | --- |
| `SITE_PASSWORD` | La password per entrare. |
| `SESSION_SECRET` | Stringa casuale lunga (almeno 32 caratteri) per firmare il cookie. |
| `BLOB_READ_WRITE_TOKEN` | Impostata da Vercel quando lo store Blob è collegato al progetto. |

Non vanno mai scritte nel codice o nel repo (`.env*` è in `.gitignore`).

## Cambiare la password

1. Vercel → progetto `home-siti` → Settings → Environment Variables → modifica `SITE_PASSWORD` (Production e Preview).
2. Deployments → ultimo deploy → **Redeploy**: le variabili nuove valgono solo dopo un nuovo deploy.
3. Per far uscire anche i dispositivi già collegati, cambia pure `SESSION_SECRET` con una nuova stringa casuale (per esempio `openssl rand -base64 48`).

## Programmi .exe

Carica l'.exe in una release di GitHub (Releases → "Create a new release"), copia il link del file,
poi nella home: **Modifica** → **+ Aggiungi** → tipo "Programma .exe" → incolla il link.
