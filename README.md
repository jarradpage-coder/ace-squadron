# Ace Squadron

An original, 1942-inspired vertical shoot-'em-up, built as an installable PWA.
Phaser 4 + Vite + TypeScript. **Phase 0**: scaffold + deploy pipeline + a
placeholder ship that follows your thumb.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173  (drag anywhere to fly)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build locally
```

## Deploy (GitHub Pages)

1. Create a GitHub repo named **`ace-squadron`** and push `main`.
2. In the repo: Settings → Pages → Build and deployment → Source = **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml` and publishes to
   `https://<user>.github.io/ace-squadron/`.

### Base path

`vite.config.ts` sets `base: '/ace-squadron/'` for the production build so asset
and service-worker paths resolve under the repo subpath. **If you rename the
repo, update `REPO` in `vite.config.ts`** — a wrong base silently breaks asset
loading and the PWA install.

## Install on iPhone

Open the deployed URL in Safari → Share → **Add to Home Screen**. It launches
standalone (no URL bar), portrait-locked, and runs offline after first load.

## Icons

`npm run icons` regenerates the PWA icons in `public/` (runs automatically before
`dev` and `build`). They're placeholder art for now — replaced in a later phase.
