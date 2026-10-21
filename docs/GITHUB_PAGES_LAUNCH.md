# GitHub Pages launch review — 21 October 2026

## Repository map

| Repository | Verified contents / current role | Recommended role |
| --- | --- | --- |
| [davodaslanifakor.github.io](https://github.com/davodaslanifakor/davodaslanifakor.github.io) | Legacy demos: Modaltor, to-do apps and shared assets. Pages is configured for `master` at `/`; no root `index.html` exists. The API reports a successful legacy build from 26 January 2020, but the root and Modaltor public URLs currently return 404. | Host **Behind the Build** at `https://davodaslanifakor.github.io/`, preserving legacy demo files. |
| [davodaslanifakor](https://github.com/davodaslanifakor/davodaslanifakor) | Only `README.md`; this is the special repository displayed on the GitHub profile. | Keep as the profile introduction; link it to the new portfolio after launch. |
| [davodfakor](https://github.com/davodaslanifakor/davodfakor) | The older HTML portfolio, images, CSS, JS and an old CV PDF. Pages is configured for `master` at `/`. `https://davodaslanifakor.github.io/davodfakor/` and `https://davodfakor.ir/` both respond with portfolio HTML. Hosting ownership of the custom domain has not been verified. | Retain as the older portfolio. No rename, deletion or archive flag is needed for this launch. |
| [modaltor](https://github.com/davodaslanifakor/modaltor) | Vue modal library source. Its README links to `/modaltor`; its own Pages API returns 404. The standalone demo actually lives in `.github.io`. | Keep as the library repository. Preserve the existing demo URL through the root site; migrating documentation into this repository can be a separate task. |
| [car-service-tracker](https://github.com/davodaslanifakor/car-service-tracker) | Independent project Pages site; `/car-service-tracker/` currently responds successfully. | Leave its repository and deployment unchanged. Do not introduce a custom domain at the account root during this launch. |

The missing root index explains the missing homepage. The Modaltor 404 despite its file being present also shows that the old published site needs a fresh deployment; the API's 2020 “built” status does not prove current URLs work.

## Prepared locally

- `pnpm generate` builds with Nuxt's `github_pages` preset. The homepage and `/cv` are prerendered with SSR enabled; the CV remains readable before JavaScript and does not require the 3D models.
- `NUXT_PUBLIC_SITE_URL` defaults to `https://davodaslanifakor.github.io`. Canonical links and social images use the public origin instead of the prerender server's localhost address.
- This setup intentionally targets the **account site at `/`**. A separate repository hosted at `/portfolio/` would need an asset-path audit, including GLB, Draco, fonts, iframe URLs and navigation; changing only Nuxt's base URL would not cover all existing absolute paths.
- All 42 public demo files from commit `660c2e1fb229ddd82fdd5f5ea3b63873c919a99a` are preserved unchanged under `public/`. Their path, size and SHA-256 are recorded in `tools/pages/legacy-manifest.json`. IDE metadata is excluded. These are compatibility copies, not a modernization of the old demos.
- `/modaltor/` forwards to `/modaltor.html`, preserving query strings and anchors. The old demo's relative asset paths therefore continue to work. The other `.html` and asset paths remain available.
- `pnpm verify:pages` checks output HTML, canonical/social URLs, 3D assets, `.nojekyll`, the alias and every preserved demo hash.
- CI now installs both Chromium and WebKit and tests the generated site with a plain static HTTP server. Browser scenarios run one at a time to avoid competing for 3D rendering resources; unit tests use at most four workers.
- `.github/workflows/deploy-pages.yml` is **manual-only** and restricted to the account-site repository's default branch. It verifies the source and generated site, then uploads only `.output/public` with the official Pages artifact/deployment actions. Merely adding the workflow does not publish the site.
- The root `README.md` explains this repository's purpose, local development, validation and publishing. Local caches, environment files and Blender backup files are ignored.

## Source organization for the first launch

This workspace has one local scaffold commit and **no Git remote**. Do not force-push its unrelated history onto the existing account-site repository.

A local review checkout at `/tmp/portfolio-pages-review` now has branch `codex/pages-launch` based on the account-site repository's existing `master`, retaining its history. It stages the current application source, lockfile, workflows, test files, public assets, and required Blender source/export metadata. The root demo assets are relocated into `public/`; their deployed URL paths stay unchanged because that directory is copied into the static artifact. This branch has not been committed or pushed. Before publishing it, refresh the preview from any newer workspace changes and verify its diff.

Keep these in the source branch:

- `assets/`, `components/`, `composables/` (including generated camera positions), `content/`, `i18n/`, `pages/`, `stores/`, `utils/`, `public/`, `tests/`, `e2e/` and the root configuration files.
- `tools/pages/` and the Blender scripts and assets needed to reproduce the room.
- `tools/blender/review/website-export.json` and `tools/blender/review/reference-restyle/room-light-dark.blend`; the asset-integrity tests deliberately verify that checkpoint checksum.
- Text plans and launch documentation.

Do not copy local caches, `.output/`, `.nuxt/`, `node_modules/`, test reports, `.vitest/`, `.DS_Store`, `.blend1` backups, or the roughly 520 MB of `docs/renders/` and `docs/reference/` imagery into the launch commit. Retain those files locally. No local file deletion or existing history rewrite is needed.

## Local verification

Verified on macOS on 21 October 2026:

- Lint and TypeScript checks passed in both the workspace and the clean release preview.
- All **167 unit tests across 44 files** passed, including a repeat in the release preview with four workers.
- The standard production build passed in the clean release preview.
- The GitHub Pages static build and output verification passed in both the workspace and the clean release preview.
- All **62 browser scenarios** passed against the generated static site in Chromium and WebKit, across two complementary runs: 32 homepage/CV/theme/music/publishing scenarios and 30 gameplay/room-lighting scenarios. No scenarios were skipped.
- The CV was verified with JavaScript disabled. The restored Modaltor alias preserves anchors, and its modal opens.
- Every selected application, test, public asset and tool file in the release preview matches the workspace. All 42 preserved legacy website files match the pinned checksums.

The complete import diff has pre-existing whitespace findings in two source files and the original font licenses; the Pages configuration, new README, launch guide, verifier and publishing tests pass their whitespace checks. Original license text is retained.

These are local results; GitHub Actions has not run for this release yet. Browser checks include mobile-sized layouts, but physical iPhone testing is still outstanding. A final downloadable CV PDF remains a separate content task; the HTML CV works.

## Reviewed cutover sequence

1. Review the release branch and wait for its CI checks to pass. Keep the legacy commit above as the rollback reference.
2. In `.github.io` → Settings → Pages, change **Source** from the current branch deployment to **GitHub Actions** before merging, so the old branch publisher does not try to serve the new application source. Keep the custom-domain field empty for the first launch.
3. Merge the reviewed branch into the existing default branch, then run **Publish portfolio to GitHub Pages** on that branch. The workflow fails before deployment if validation fails.
4. Verify `/`, `/cv/`, `/modaltor/`, `/modaltor.html`, `/todo.html`, `/app-todo.html`, `/davodfakor/` and `/car-service-tracker/` publicly. Check 3D loading, Spotify, keyboard navigation and a real phone.
5. Link the profile README to the new homepage. A future `davodfakor.ir` cutover is separate because it requires confirming current DNS/hosting and testing project-site effects.

To roll back to the old demo deployment, select the legacy commit's contents on a recovery branch and configure branch-based Pages for that branch, or redeploy an earlier verified artifact. The original history is retained. Its missing homepage would still be missing; rollback restores the old demo source, not a previously working root portfolio.

No remote repository, remote branch, Pages setting, profile README, domain, or live deployment has been changed during this preparation.

References: [Nuxt GitHub Pages deployment](https://nuxt.com/deploy/github-pages), [GitHub Pages site types](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
