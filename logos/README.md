# Subscription logos

Logos for every service in the app's **⚡ اشتراكات شائعة — إضافة سريعة** (popular subscriptions / quick-add) list.

## How the app uses logos

The app already shows a logo next to each quick-add pill **and** each saved subscription. By default it loads them
live from a logo CDN (Clearbit, with a Google-favicon fallback) — so **logos appear with zero setup as long as
you're online**. No files in this folder are required for that.

This folder exists so you can also keep **local copies** (for offline / PWA use, or to drop in higher-res art).

## Get the local logo files

This environment had no internet, so the image files couldn't be downloaded for you. Run the downloader on your
own machine (it has internet):

**Windows (PowerShell):**
```powershell
cd "c:\Users\F8DK\Desktop\payment\logos"
powershell -ExecutionPolicy Bypass -File .\download-logos.ps1
```

**macOS / Linux / Git-Bash:**
```bash
bash download-logos.sh
```

Each service is saved as `<slug>.png` (e.g. `netflix.png`, `spotify.png`). The script tries the clean Clearbit
logo first and falls back to a Google favicon. Pass `-Force` (PowerShell) to overwrite existing files.

## Switch the app to the local files (offline)

After downloading, open `index.html`, find the logo block (search for `SUB_LOGO_LOCAL`) and set:

```js
var SUB_LOGO_LOCAL = true;   // load logos/<slug>.png instead of the CDN
```

Now the app uses this folder and works fully offline.

## Want pixel-perfect / SVG logos?

For the highest quality (vector SVG, official brand art), grab them by hand from **Brandfetch** — the
`brandfetch` link for every service is in [`manifest.json`](manifest.json). Save the file as `<slug>.png`
(or `.svg`) here, matching the `slug` in the manifest, and it will be picked up.

## Files

- `manifest.json` — the source of truth: name → slug → category → domain → Brandfetch link for every service (auto-generated from `SUB_LOGOS` in `index.html`).
- `download-logos.ps1` / `download-logos.sh` — fetch all logos into this folder.
