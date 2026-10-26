# Behind the Build

Davoud Aslani Fakour’s interactive portfolio: a 3D room with project stories, a small visual editor, music, and playable desk toys. A separate HTML CV stays readable without JavaScript or the 3D scene.

Built with Nuxt 4, Vue 3, TypeScript, Pinia, and Three.js.

## Website and repositories

The target for this project is **https://davodaslanifakor.github.io/**, with the CV at `/cv/` and the Studio portfolio at [`/studio/`](https://davodaslanifakor.github.io/studio/).

- **`davodaslanifakor.github.io`** hosts this portfolio and the preserved legacy demos.
- **`davodaslanifakor`** is the separate GitHub profile README repository.
- **`davodfakor`** contains the older portfolio.
- **`modaltor`** contains the Vue modal library source. Its demo remains available through `/modaltor/` and `/modaltor.html` on this site.

## Local development

Use Node.js 22 and pnpm 10.14.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Portfolio copy lives in `content/portfolio.ts`. Shared room state lives in `stores/scene.ts`. Preserve existing Blender mesh names, authored cameras, content types and scene state when making changes.

## Check and build

```sh
pnpm lint
pnpm typecheck
pnpm test --maxWorkers=4
pnpm build
pnpm generate
pnpm verify:pages
pnpm exec playwright install chromium webkit
PORTFOLIO_E2E_STATIC=1 PORTFOLIO_E2E_PORT=3102 pnpm test:e2e --workers=1
```

`pnpm generate` produces the GitHub Pages site in `.output/public`. It prerenders the homepage and CV; no application server is needed on the host. Static browser tests serve that generated directory locally.

## Publishing

The **Publish portfolio to GitHub Pages** workflow runs manually from GitHub Actions on the default branch of `davodaslanifakor/davodaslanifakor.github.io`. It checks the project, runs the `@pages` browser scenarios in Chromium and WebKit, and deploys only `.output/public`.

CI verifies the homepage-to-CV flow, CV without JavaScript, contact navigation, mobile layout, locale behavior, and legacy Modaltor links, alongside the full unit suite and static asset checks. Run the complete browser suite above on a machine with hardware graphics before releasing gameplay or room changes. The longer 3D tours use timed movement inputs; software rendering on a GPU-less runner changes those timings and is not a reliable environment for those tours.

In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. Run the publishing workflow from the **Actions** tab after merging a verified update. The setup targets the account site at `/`; hosting under a project subdirectory requires an asset-path review.

The original demo history is retained. Commit `660c2e1fb229ddd82fdd5f5ea3b63873c919a99a` records the legacy site before migration. A rollback can redeploy an earlier verified artifact or restore that source on a recovery branch.

Legacy demo assets in `public/` are preserved byte-for-byte. Their source revision and checksums are recorded in `tools/pages/legacy-manifest.json`; `pnpm verify:pages` checks them before publishing.
