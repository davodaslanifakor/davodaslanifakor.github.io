# PORTFOLIO_PLAN.md — "Behind the Build"

A 3D room portfolio for **Davoud Fakour** (also spelled Davod Fakor), Senior Frontend Engineer & Technical Lead.
Replaces the current site at https://davodfakor.ir/.

Put this file in the repo root. Every Codex task should read it before starting.

---

## 0. How to use this plan with Codex

| Model | Role in this project | Use for | Don't use for |
|---|---|---|---|
| **Astra** | Architect + final reviewer | Phase 0 (architecture, repo scaffold, contracts) and Phase 6 (full review, performance audit) | Routine components, copy, repetitive config. It is expensive and burns usage limits fast; keep its tasks few and well-defined |
| **Sol** | Senior builder | Hard, open-ended parts: 3D scene system, camera + GSAP, raycasting, the CSS3D monitor editor, performance work | Simple UI, data entry |
| **Luna** | Fast implementer | Clear, repeatable tasks with a spec: content data, modal components from Figma, i18n strings, 2D recruiter page, tests, lint fixes | Architecture decisions, anything ambiguous |

**Rules for every task**
1. One phase = one branch = one PR. Branch name: `phase-N-short-name`.
2. Read `PORTFOLIO_PLAN.md` and `AGENTS.md` first.
3. Do not change the contracts in §4 without flagging it in the PR description.
4. Every PR must pass: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
5. If a task is ambiguous, stop and ask. Do not invent content, numbers, or employers.

---

## 1. Goal and audience

**Goal:** get noticed by SaaS AI companies hiring a senior Vue.js engineer who can lead a team and ship at scale.

**Audience:** recruiters and engineering managers. Many will give the site 30 seconds, some on a phone.

**The core idea:** the room is the career, and the monitor is the best work. Every object is clickable and maps to a real story. No decorative filler.

**Success criteria**
- A recruiter can reach CV + contact in one click from any screen, without waiting for 3D to load.
- The site itself proves Vue skill (built in Nuxt + TresJS, not vanilla JS).
- The monitor interaction (a mini visual editor) is the memorable moment.

---

## 2. Tech stack

- **Nuxt** (latest stable) + **TypeScript** strict
- **TresJS** (`@tresjs/nuxt`, `@tresjs/cientos`) for Three.js in Vue
- **Three.js CSS3DRenderer** for real DOM on the monitor screen
- **GSAP** for camera moves, intro, hover, modal animations
- **Pinia** for scene/UI state
- **@nuxtjs/i18n** — English + Persian (RTL)
- **Howler.js** — optional ambient sound, off by default
- **Vitest** + **Playwright**
- **pnpm**, deploy on **GitHub Pages** at `https://davodaslanifakor.github.io/` (launch plan: `docs/GITHUB_PAGES_LAUNCH.md`)
- 3D assets: **GLB** with Draco or Meshopt compression, **KTX2** baked textures

---

## 3. The room: object map

Each object is a mesh in Blender named with the `int_` prefix (interactive). Non-interactive meshes use `static_`.

| Mesh name | Object | Story | Click opens |
|---|---|---|---|
| `int_monitor` | Monitor | html-editor-plugin | Camera zoom → live mini editor on screen |
| `int_books` | 5 books on a shelf | Career timeline | Timeline modal, one card per employer |
| `int_pegboard` | Pegboard of tools | Skills | Skills modal (tools with "used for…" labels, no % bars) |
| `int_certificate` | Framed certificate | Vue credibility | Certified Vue.js Developer |
| `int_paratrooper` | Toy paratrooper | "Parachuting into stalled projects" | Sarmayex case study |
| `int_bugjar` | Bug in a glass jar + sticky note | Debugging reality | Android FileReader debugging story |
| `int_robot` | Robot desk toy | AI workflow | DESIGN.md, Prompt Optimization Wizard, AI agent editor |
| `int_cards` | Business cards + letterhead | Brand asset system | Brand asset "operating system" feature |
| `int_window` | Window | Location | Small "Istanbul" label, no modal |
| `int_clock` | Wall clock | Experience | Tooltip: "10 years" |
| `int_door` | Door with sign | Contact / CTA | Contact modal: CV download, LinkedIn, email |
| `int_langsign` | Small wall sign | Language | Toggles EN / فارسی |

Everything else (walls, floor, desk, chair, lamp, plants) is `static_` and baked into one texture set.

---

## 4. Contracts (do not break)

### 4.1 Blender → code

- File: `public/models/room.glb`
- Interactive meshes named exactly as in §3.
- Monitor screen is a **separate flat mesh** named `int_monitor_screen`, facing +Z in local space, UVs 0–1. The CSS3D editor is aligned to it.
- Camera focus points are **empty objects** named `cam_<objectId>` (e.g. `cam_monitor`, `cam_books`) and `cam_start`.
- Textures: `public/textures/room_day.ktx2` (and optional `room_night.ktx2`).
- Budget: GLB ≤ 3 MB, total textures ≤ 4 MB.

**Until David delivers the GLB, use placeholder primitives with the same names and empties.** Do not block on assets.

### 4.2 Content

All text lives in `content/portfolio.ts`, typed, with `en` and `fa` fields. Components never hardcode copy.

```ts
export type Locale = 'en' | 'fa'
export type I18nText = Record<Locale, string>

export interface Role {
  id: string
  company: string
  title: I18nText
  period: string
  receipt: I18nText        // one measurable result
  summary: I18nText
}

export interface Skill {
  id: string
  name: string
  usedFor: I18nText
  group: 'core' | 'fullstack' | 'quality' | 'ai'
}

export interface CaseStudy {
  id: string                // matches object id, e.g. 'paratrooper'
  title: I18nText
  problem: I18nText
  action: I18nText
  result: I18nText
  links?: { label: string; href: string }[]
}

export interface SceneObject {
  id: string                // 'monitor', 'books', ...
  mesh: string              // 'int_monitor'
  camera: string            // 'cam_monitor'
  label: I18nText           // hover tooltip + accessible name
  action: 'modal' | 'zoom-editor' | 'tooltip' | 'toggle-locale' | 'play-game'
  contentRef?: string
}
```

Joker game extension (2026-10-15): `play-game` opens the three-card game for the existing `bugjar` object (`root_bugjar` / `int_bugjar`). Static descendants also resolve to that object. Existing Blender names and authored cameras remain unchanged; runtime `cam_joker_game` frames the figure and generated tray. The Android debugging case study remains in portfolio content and the CV. Game rules live in `useJokerCardGame`; existing `focusedId` and `mode: 'focused'` coordinate entry/exit, with no new global state.

Minion desk exploration extension (2026-10-15): the existing `paratrooper`, `cards`, and `robot` Minion objects keep `play-game` / `minion-game`. A runtime clone walks from its original location onto the actual desk, with directional movement, gravity, jumps onto measured surfaces, and proximity-gated MacBook power / monitor plug interactions. This replaces Banana Dash. Mesh/root names, authored cameras and Pinia state stay intact; runtime `cam_minion_game` follows the character, or frames a stationary overview for reduced motion. Keyboard mischief depresses recovered keycaps and types a reversible scratchpad, the mouse can be pushed/ridden with matching collisions, and spectators/Joker react to noise. Runtime articulated limbs and action pose curves preserve the original asset and Peace sign; no Blender animation clips are assumed. Session-local device and prop changes restore on reset/exit. Sound effects unlock on an explicit movement/action gesture and have an independent mute. Original case studies remain in the CV.

Joker adventure replacement (2026-10-18, flagged before implementation): the existing `bugjar` / `play-game` entry now opens a playable room adventure instead of the three-card tray. Existing room mesh IDs, authored room cameras and Pinia selection/mode remain intact. A separate, lazily loaded `public/models/joker-adventure.glb` supplies the Blender props, rigid toy rig and short interaction transitions; room plus adventure must remain below the existing 3 MB geometry budget. Runtime movement/driving and collision-triggered phone damage are session-local and restore on reset/exit. Keyboard typing and monitor-cable actions are excluded for Joker. The old card-game modules remain isolated for reference; their entry-point browser tests are replaced by adventure coverage.

### 4.3 State (Pinia `useSceneStore`)

`mode: 'loading' | 'intro' | 'explore' | 'focused' | 'editor'`, `focusedId: string | null`, `hoveredId: string | null`, `soundOn: boolean`, `quality: 'high' | 'low'`.

Screen theme extension (2026-10-21, flagged before implementation): `screenTheme: 'slate' | 'forest' | 'amber' | 'mono'` stores the session's shared monitor/laptop palette, defaulting to `slate`. A collapsed-by-default HUD picker emits theme selections. Both procedural canvases rebuild in place on selection and refresh from the existing room clock; mesh, camera, selection and mode contracts remain unchanged.

Music playback extension (2026-10-13): `musicPlayback: { playing: boolean; positionMs: number; durationMs: number; sampledAt: number }` stores the latest Spotify API playback snapshot. Track changes clear it; late updates from another selection are ignored. RGB pulses follow verified playback state and position, not audio waveform analysis.

Music hover extension (2026-10-13; navigation behavior revised 2026-10-21 at David's request, flagged before implementation): `nowPlaying: string | null` stores the selected music track ID, not verified Spotify playback state. It clears when playback is explicitly cleared or the room is unmounted. Returning from the music panel and opening other room objects keep the same embed alive without pausing, restarting, or resetting playback position. Explicit Spotify pause remains authoritative.

---

## 5. Content (source of truth for Luna)

Use only what's below. If something is missing, leave a `TODO(David)` and ask. **Never invent numbers.**

**Header:** Davoud Fakour — Senior Frontend Engineer & Technical Lead · Vue.js / TypeScript · Istanbul
**Tagline:** Most frontend engineers build interfaces. I build the systems people use to create, collaborate, and keep a product coherent as it grows.
**CTA:** Open to senior Vue / frontend leadership roles in AI SaaS.

**Timeline (books)**
| Company | Role | Receipt |
|---|---|---|
| Pay.ir | Frontend Developer (Mid → Senior) | Mobile-first dashboard redesign: 30% fewer support tickets, 35% faster page loads |
| Ostadbank | Senior Frontend Developer → Front-End Team Lead (7+ years) | Kanban, CI/CD, lazy hydration: 50% faster development |
| Sarmayex | Front-End Team Lead | Stabilized a stalled crypto platform; full redesign in 3 months |
| Smile IT Solutions (Remote, UK) | Frontend → Full-Stack Engineer | Playwright E2E: 30% faster delivery; Next.js, PostgreSQL, Docker, AI SDKs in production |
| Zoviz | Senior Frontend Engineer → Frontend Technical Lead | Frontend architecture, component libraries, advanced editors, performance |

`period` values: TODO(David) — confirm exact dates before publishing.

**Skills (pegboard)**
- core: Vue 3, Nuxt, TypeScript, Pinia, frontend architecture, component libraries, performance optimization
- fullstack: React, Next.js, PostgreSQL, Docker
- quality: Playwright, Sentry, CI/CD
- ai: AI coding agents (Claude Code), AI SDK integration, prompt UX

**Monitor — html-editor-plugin (Zoviz)**
Embeddable Vue 3 HTML-rendering visual editor (NOT canvas-based): multi-page documents, drag/resize/rotate, brand colors, cropping, AI image generation, background removal, HTML/PNG/PDF export. ~19 months, ~1,300 commits, ~84% authored by David, v6.

**Certificate:** Certified Vue.js Developer (Vue School).

**Case studies** — David supplies final copy; draft from his public LinkedIn posts:
- `paratrooper`: Sarmayex stalled-platform recovery
- `bugjar`: Android FileReader `NotReadableError` from provider-backed URIs; debugged via Sentry + Chrome remote debugging; shipped a clear fallback instead of a fake fix
- `robot`: DESIGN.md generated from the codebase, codebase restructured for AI agents; Prompt Optimization Wizard
- `cards`: business cards, letterheads, email signatures generated from one brand profile

**Off limits:** no internal team stories, no leadership or colleague names, no compensation, no internal comparisons.

---

## 6. Phases

### Phase 0 — Architecture & scaffold · **Astra (Medium)**
**Tasks**
- Create Nuxt + TS strict project with the stack in §2, ESLint, Prettier, Vitest, Playwright, i18n (EN + FA RTL).
- Write `AGENTS.md` (commands, folder structure, conventions, contracts summary).
- Create folder structure:
  ```
  components/scene/     # TresJS scene parts
  components/ui/        # modals, buttons, loader, HUD
  components/editor/    # mini editor
  composables/          # useRaycast, useCameraRig, useQuality...
  content/portfolio.ts
  stores/scene.ts
  pages/index.vue       # 3D room
  pages/cv.vue          # 2D recruiter page
  ```
- Create typed stubs for §4 contracts and a placeholder room built from primitives.
- CI: GitHub Actions running lint, typecheck, test, build.

**Done when:** `pnpm dev` shows a placeholder room with orbit controls; CI green; `AGENTS.md` exists.

---

### Phase 1 — Content + recruiter page · **Luna**
**Tasks**
- Fill `content/portfolio.ts` from §5 (EN). Add FA fields as `TODO(translate)` — a native speaker reviews later.
- Build `pages/cv.vue`: fast, SSR, no 3D. Header, CTA, timeline, skills, case studies, contact, CV download.
- SEO: title, description, Open Graph image, JSON-LD `Person` with `alternateName: ["Davod Fakor", "Davoud Aslani Fakour"]`.
- Persistent "Skip to CV" button component (used on the 3D page later).

**Done when:** `/cv` scores Lighthouse ≥ 95 on performance, accessibility, SEO; no hardcoded copy.

---

### Phase 2 — Scene system · **Sol (Medium)**
**Tasks**
- `RoomScene.vue`: load GLB (fall back to placeholders), apply baked KTX2 texture, glass/screen materials.
- `useRaycast`: hover + click on `int_*` meshes, mouse and touch, driven by `SceneObject[]` from content.
- `useCameraRig`: GSAP transitions between `cam_*` empties; limited OrbitControls (clamp pan, polar, azimuth, zoom).
- Hover highlight (emissive/outline), cursor change, tooltip with `label`.
- Responsive start camera for mobile vs desktop.
- `useQuality`: detect weak devices → lower pixel ratio, disable shadows, or redirect to `/cv` if WebGL unsupported.

**Done when:** every object in §3 is hoverable/clickable on placeholders, camera moves smoothly, Esc returns to `explore`.

---

### Phase 3 — UI layer · **Luna**
**Tasks**
- Modal components from Figma frames (David will share links): `TimelineModal`, `SkillsModal`, `CaseStudyModal`, `ContactModal`, `CertificateModal`.
- GSAP open/close animations; focus trap; Esc closes; RTL-safe layout.
- HUD: Skip to CV, language toggle, sound toggle (default off), "click objects to explore" hint.
- Loading screen with real progress from the GLB loader.

**Done when:** all modals open from scene clicks, keyboard accessible, correct in EN and FA.

---

### Phase 4 — The monitor editor · **Sol (High)**
This is the signature interaction. Build a **new, small demo editor from scratch**.
**Do not copy code, assets, or UI from Zoviz's html-editor-plugin** — it's company property.

**Tasks**
- Mount real DOM on `int_monitor_screen` with CSS3DRenderer, aligned and scaled to the mesh; stays in sync with the WebGL camera.
- Mini editor (Vue, HTML-rendered elements, not canvas): a business-card-sized page with a logo, a name text box, and a shape.
  - Drag, resize, rotate with handles
  - Brand color picker that recolors all elements
  - "Reset" and "Export PNG" buttons
- Camera zooms to `cam_monitor` → mode `editor`; pointer events route to the DOM; Esc exits.
- Side note panel: short description of the real html-editor-plugin (from §5) — text only.
- Mobile: instead of CSS3D, open the editor in a full-screen modal.

**Done when:** editor works with mouse and touch, no drift between screen mesh and DOM at any resize, Playwright test covers drag + color change.

---

### Phase 5 — Polish · **Sol (Medium)** for motion, **Luna** for the rest
**Sol**
- Intro animation (camera fly-in, objects settle), idle micro-animations (clock hands, plant sway), day/night lamp toggle if `room_night.ktx2` exists.
- Respect `prefers-reduced-motion`.

**Luna**
- Accessible object list: a hidden-until-focused nav listing every object, so keyboard and screen-reader users can open all content without 3D.
- Optional ambient sound with Howler (off by default).
- 404 page, favicon, OG image.
- Playwright smoke tests: load, open each modal, switch language, reach `/cv`.

---

### Phase 6 — Review & ship · **Astra (Medium)**
**Tasks**
- Full code review against this plan and §4 contracts; list issues by severity.
- Performance audit: 3D page interactive ≤ 4 s on a mid laptop / throttled 4G; `/cv` LCP ≤ 1.5 s; bundle and asset budgets met.
- Check content for invented facts or off-limits material (§5).
- GitHub Pages static deployment, preserved legacy demo URLs, custom domain notes.

**Done when:** a written review report is in `docs/review.md`, blocking issues fixed, production deploy works.

---

## 7. What David does (not Codex)

- **Figma:** moodboard, color palette, floor plan with the 12 objects, modal designs → share frame links before Phase 3.
- **Blender:** model the room with only the §3 objects, follow the §4.1 naming contract, bake textures, export GLB → drop into `public/models/` any time after Phase 2.
- **Content:** confirm dates, write final case-study copy, get a native-speaker review of Persian text.
- **Permission:** confirm with Zoviz that describing html-editor-plugin publicly (text only) is fine.

---

## 8. Ready-to-paste prompts

**Phase 0 (Astra)**
> Read PORTFOLIO_PLAN.md fully. Execute Phase 0 exactly. Create the scaffold, AGENTS.md, typed contract stubs from §4, placeholder room, and CI. Don't build features from later phases. Open a PR on branch `phase-0-scaffold` with a summary of decisions.

**Phase 1 / 3 / 5 (Luna)**
> Read PORTFOLIO_PLAN.md and AGENTS.md. Execute Phase [N] tasks for Luna only. Use content only from §5; mark gaps as TODO(David). Don't change §4 contracts. Make lint, typecheck, test, build pass. Open a PR on branch `phase-[N]-[name]`.

**Phase 2 / 4 / 5 (Sol)**
> Read PORTFOLIO_PLAN.md and AGENTS.md. Execute Phase [N] tasks for Sol. Work against placeholder meshes if room.glb isn't present. Respect §4 contracts and budgets. Add tests for the interactions you build. Explain any trade-offs in the PR description.

**Phase 6 (Astra)**
> Read PORTFOLIO_PLAN.md, AGENTS.md, and the full repo. Execute Phase 6: review, performance audit, content check, deploy prep. Write docs/review.md with issues by severity, then fix blocking issues in a PR on branch `phase-6-review`.

