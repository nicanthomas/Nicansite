# Nicansite: home dei miei siti

Pagina iniziale personale in stile "nuova scheda di Chrome", protetta da password.
I collegamenti si gestiscono dalla pagina (pulsante **Modifica**) e sono uguali su tutti i dispositivi.

- Indirizzo: https://nicansite.vercel.app
- Progetto Vercel: `nicansite`, collegato a questo repo. Branch di produzione: `sviluppo` (ogni push va online da solo).
- Nessuna fase di build: Vercel serve `index.html` e le funzioni in `api/`.

## Come funziona

- `index.html`: la pagina, un solo file con CSS e JavaScript inline. Non contiene dati: li carica da `/api/links`.
  Senza sessione mostra solo la schermata di accesso.
- `api/login.js`: controlla la password (confronto a tempo costante, breve attesa dopo un tentativo sbagliato)
  e imposta un cookie di sessione firmato con HMAC-SHA256: HttpOnly, Secure, SameSite=Strict, valido 30 giorni.
- `api/logout.js`: cancella il cookie.
- `api/links.js`: `GET` restituisce i collegamenti, `PUT` li salva. Senza sessione valida risponde 401.
- `seed-links.json`: dati iniziali, usati solo la prima volta, quando lo storage è ancora vuoto.

## Come funziona il salvataggio

Tutti i collegamenti stanno in un unico file `links.json` in uno store **Vercel Blob privato**
(leggibile solo dal server con il token, non da un indirizzo pubblico).
Ogni modifica fatta nella pagina (aggiungere, modificare, eliminare, riordinare, sezioni) invia subito
l'elenco completo con `PUT /api/links`, che sovrascrive `links.json`. In basso compare "Salvato" oppure
"Errore, riprova": in caso di errore la modifica resta nella pagina e il salvataggio riprova da solo
ogni 5 secondi (o subito, cliccando sul messaggio). Il server accetta solo indirizzi http/https.

## Variabili d'ambiente (Vercel → nicansite → Settings → Environment Variables)

| Nome | A cosa serve |
| --- | --- |
| `SITE_PASSWORD` | La password per entrare. Tipo "Sensitive", Production e Preview. |
| `SESSION_SECRET` | Stringa casuale lunga (almeno 32 caratteri) per firmare il cookie. |
| `BLOB_READ_WRITE_TOKEN` | Impostata da Vercel quando lo store Blob è collegato al progetto. |

Non vanno mai scritte nel codice o nel repo (`.env*` è in `.gitignore`).

## Cambiare la password

1. Vercel → `nicansite` → Settings → Environment Variables → modifica `SITE_PASSWORD` (Production e Preview).
2. Deployments → ultimo deploy di produzione → **Redeploy**: le variabili nuove valgono solo dopo un nuovo deploy.
3. Per far uscire anche i dispositivi già collegati, cambia pure `SESSION_SECRET` con una nuova stringa
   casuale (per esempio `openssl rand -base64 48`) prima del redeploy.

## Programmi .exe

Carica l'.exe in una release di GitHub (Releases → "Create a new release"), copia il link del file,
poi nella home: **Modifica** → **+ Aggiungi** → tipo "Programma .exe" → incolla il link.
Le caselle .exe hanno il distintivo ".exe" e al clic scaricano il file.
