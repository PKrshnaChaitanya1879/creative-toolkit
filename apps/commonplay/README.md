# Commonplay

Search, play and download openly licensed music in one place. Results come from four open catalogues and are mixed together. You can play anything, and you can download a selection as one ZIP that includes a CREDITS.txt and a playlist.

| Source | What's there | How it's reached |
|---|---|---|
| Jamendo | Indie artists, about 650k CC tracks | Through Openverse (streaming only), or the Jamendo API when you add a free client ID (downloads where the artist allows them) |
| Internet Archive | Netlabel and open-source audio collections | Directly. Only items that carry a license URL are included |
| Wikimedia Commons | Mostly public-domain classical recordings | Directly. Clips under 45 seconds, such as pronunciations, are skipped |
| ccMixter | Remixes, a cappellas and instrumentals | Through the bundled proxy, so only when hosted |

## Run it

**Quick look:** open `public/index.html` in a browser. Jamendo, Internet Archive and Commons all work from a local file. ccMixter stays off because it needs the proxy.

**Host it (free, Cloudflare Pages):**
```bash
npm install -g wrangler
wrangler login
cd commonplay
wrangler pages deploy public --project-name commonplay
```
Run the deploy from the project root so `functions/` ships with it. That folder provides `/api/health` and `/api/fetch`. The site goes live at `https://commonplay.pages.dev`, or whatever name you pick. Once it's hosted, ccMixter turns on and every ZIP download goes through the proxy if a source blocks the browser.

**Jamendo downloads:** create an app at https://devportal.jamendo.com, which gives you a client ID. Paste the ID into Settings → Jamendo client ID. For the public site, you can hard-code it as the default in `index.html` (`store.get("jamKey", "")`).

## Files
```
public/index.html          the whole app: HTML, CSS and JS in one file (JSZip from cdnjs)
public/manifest.webmanifest, sw.js, icon*.png/svg   installable app, offline shell
functions/api/fetch.js     allow-listed pass-through (ccMixter, archive.org, Wikimedia, Jamendo)
functions/api/health.js    tells the app the proxy is there
```

## Design
The app follows Apple's Human Interface Guidelines, Liquid Glass era:
- Glass is used only on the functional layer: the sidebar, tab bar, mini player and selection bar.
- Lists use solid grouped backgrounds.
- Colours come from the system palette, with indigo as the single accent.
- Type uses the iOS text-style scale.
- Hit targets are 44pt.
- The Now Playing sheet puts its controls on clear glass over blurred artwork.
- The app respects reduced motion, reduced transparency and increased contrast.
- Media Session is wired up, so keyboard media keys, the lock screen and headphones all work.

Keyboard shortcuts: `/` to search, `Space` to play or pause, `Shift + ←/→` for previous or next.

## Licensing notes
- Each track shows its license. The ZIP's CREDITS.txt has a ready-made attribution line for every file.
- NC means non-commercial only. ND means no remixing. SA means remixes must be shared under the same license. The License filter can hide tracks that don't fit what you need.
- Licenses are as published by each uploader. For anything commercial, check the source page before you use a track.
- Jamendo tracks whose artists turned off downloads stay stream-only, even with a client ID.
