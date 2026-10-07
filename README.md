# La Converse

Astro + Tailwind v4 site for La Converse, built from the Figma file
**AA_1_SHARED → [CURRENT PROJECTS]** (mobile UI frames + `HOMEPAGE — DESKTOP`).
Content lives in Sanity; the Studio is served from the site at `/admin`.
No animations yet.

## Run it

```sh
npm install
cp .env.example .env    # fill in once the Sanity project exists (below)
npm run dev             # http://localhost:4321
npm run check           # astro check + sanity schema validate
npm run build
```

With no `PUBLIC_SANITY_PROJECT_ID` the site renders from `src/lib/fixtures.ts`
(the copy from the Figma frames), so every page works before any content exists.
In that mode, submissions are logged to the terminal rather than stored.

## Languages and URLs

French is the default and lives at the root; English lives under `/en`. That
matches the Webflow site, so existing article URLs keep working. Every route is
declared once in `src/i18n/index.ts` (`href(lang, "article", slug)`). Page files
under `src/pages` are thin wrappers around the views in `src/views`, one per
locale. Interface strings (buttons, labels) are in the same file; everything
editorial comes from Sanity.

Translation model: **every document holds both languages.** Text fields have
a French and an English box side by side (`localeString`, `localeText`,
`localeRichText`…, stored as `{ fr, en }`); images, people, sections and dates
are shared. Articles, videos, podcasts, programs, positions, sections, topics
and series have a slug per language, and are on the site in each language
they have a slug in, so a story can go out in French first and get its
English side later. Partner stories show in each language whose title is
filled in. The page singletons (Home, About, La Relève, Get involved, Give your
voice, Contact, Site settings) are one fixed document each (`homePage`, …);
their picks of articles and programs skip any that aren't published in the
page's language.

Queries pick a side with `title[$lang]` (see `src/lib/content.ts`), so the
pages receive plain strings either way. The field layout of the bilingual
types is in `scripts/merge-locales/lib.ts`, shared by the import and by the
conversion from the old one-document-per-language model
(`npm run migrate:merge-locales`; sections, topics, series and singletons were
converted on `production` on 2026-09-30, backup in
`.migration/backup-before-merge.tar.gz`).

### Auto-translate

Every French/English pair in the Studio has **FR → EN** and **EN → FR**
buttons under it, and the document menu (⋯ next to Publish) has
**Auto-translate**, which fills every empty field of one language from the
other in one go, including the body, the SEO fields and the slug (made from the
translated title; an existing slug is never changed). It marks the document
_Machine-translated_ for that language, and the article page then says it was
translated, until an editor clears the field after reviewing it.

Translation is done by [Langbly](https://langbly.com), which speaks Google
Translate's API. 500,000 characters a month (roughly 50–70 articles) are free;
**beyond that Langbly bills the card on the account**, so set a monthly
spending cap in the Langbly dashboard. Setup, once:

1. Create a Langbly account and an API key.
2. Put the key in `.env` and in Vercel as `LANGBLY_API_KEY`, then redeploy.

The Studio calls `/api/translate` on the site (`src/pages/api/translate.ts`),
which holds the key; Langbly sees only the text being translated and says it
keeps none of it. It runs on a language model, writes international French and
American English, and occasionally swaps « » for straight quotes: read the
result over before publishing.

## Sanity setup (once)

1. Create a project at https://www.sanity.io/manage (or `npx sanity init --bare`),
   with dataset `production`, visibility **public**.
2. Put the id in `.env` as `PUBLIC_SANITY_PROJECT_ID`.
3. **API → CORS origins**: add `http://localhost:4321` and the production
   domain, **with credentials** (the Studio needs them).
4. **API → Tokens**: create an _Editor_ token and set it as `SANITY_WRITE_TOKEN`
   in `.env` and in Vercel. It stores form submissions and runs the import.
5. `npm run dev`, then open `/admin`.
6. So publishing updates the live site, set up the webhook in
   [Publishing](#publishing).

## Publishing

Articles, author pages and topic pages render on their first visit and Vercel
caches them (ISR); every other page is built at deploy time. So the build
doesn’t grow with the archive, and any publish in Sanity redeploys the site,
which rebuilds the static pages and clears the cached ones. Changes are live
once the deploy finishes (a minute or two).

1. In Vercel, create a deploy hook for `main` (Settings → Git → Deploy Hooks).
2. In Sanity (API → Webhooks), create a webhook:
   - URL: the deploy hook URL, method POST
   - Dataset `production`; trigger on create, update and delete
   - Filter: `!(_type in ["submission", "sanity.imageAsset", "sanity.fileAsset"])`
     (form submissions and uploads shouldn’t redeploy the site)

Vercel queues deploys, so a burst of publishes ends in one up-to-date deploy.
Disable the webhook while running a bulk import (`migrate:import`), then deploy
once at the end.

## Forms and the voice note

- `/api/voice`: voice notes (MediaRecorder: webm/opus, or mp4 on Safari) and
  written stories from the “Got a story to tell?” dialog. Any
  `[data-voice-open]` button opens it; `[data-voice-open="write"]` opens it on
  the written form.
- `/api/contact`: job applications (with CV upload), program sign-ups,
  newsletter sign-ups.

Everything lands in **Inbox** in the Studio as a `submission` document. The
newsletter form posts to the mailing-list provider instead once
`newsletterAction` is set in Site settings. There is a honeypot field but no
rate limiting yet. If spam shows up, add Vercel's firewall rule or a captcha.

## Webflow → Sanity migration

Scripts are in `scripts/migrate-webflow/`. Snapshots and generated files go to
`.migration/` (gitignored). Every step is repeatable: IDs come from Webflow
item IDs (`article-<wfid>-fr`, `person-<wfid>`, …), so a re-run replaces
documents instead of duplicating them.

Needs `WEBFLOW_TOKEN` (site token, read-only: CMS, Sites) and
`WEBFLOW_SITE_ID=64dfbe19c5a970d11ca42f63` in `.env`.

| Step                                                                     | Command                     | Writes to Sanity?           |
| ------------------------------------------------------------------------ | --------------------------- | --------------------------- |
| 1. Snapshot every collection, both locales                               | `npm run migrate:extract`   | no                          |
| 1b. …or, without API access, from CSV exports in `.migration/csv/`       | `npm run migrate:csv`       | no                          |
| 2. Review field guesses, pin fixes in `mapping.ts` → `OVERRIDES`         | `npm run migrate:inspect`   | no                          |
| 3. Build NDJSON + report + redirects                                     | `npm run migrate:transform` | no                          |
| 3b. Translate articles to English (see below), then re-run 3             | `npm run migrate:translate` | no                          |
| 4. Read `.migration/out/report.json` (counts, issues, EN-fallback count) | —                           | no                          |
| 5. Import CMS content (assets pulled from Webflow's CDN)                 | `npm run migrate:import`    | **yes** (replaces)          |
| 6. Seed page singletons + programs with the design copy                  | `npm run migrate:seed`      | **yes** (only missing docs) |
| 7. Count / reference / asset checks                                      | `npm run migrate:validate`  | no                          |

Mapping: Webflow `articles` → `article`; `people`, `photographers` and
`illustrators` → `person` (merged by slug); `videos` → `video`;
`balados-series` + `balados-episodes` → `podcast` with inline episodes
(Spotify ids become Spotify embeds); `carriere` → `position`. Rich text
becomes Portable Text: headings, lists, links, figures, YouTube/Vimeo/Spotify
iframes, custom-code embeds, and each “CTA Box” as a call-out block.

**Taxonomy.** Webflow's own `tag` / `categorytag` / `video-tags` are not
imported. The re-categorization sheet (`La Converse - Nouvelle taxonomie.csv`,
one row per article, in `.migration/csv/`) gives each article its section
(`category`), topics (`tag`), format and series. “La Converse (hors
rubriques)” means no section; “À retirer” articles are skipped. Old
`/tag/<slug>` URLs redirect to the section most of their articles moved to.

**English.** Webflow only has French. The English documents are built from
the French ones with a translation memory in
`scripts/migrate-webflow/translations/en/` (French → English JSON files,
committed). `site.json` is hand-translated: sections, topics, series,
videos, podcasts, positions, people's roles and bios. Articles are translated
with Claude:

```sh
npm run migrate:translate -- --limit 20   # newest 20 first, to check the output
npm run migrate:translate                 # the rest (resumable)
npm run migrate:transform && npm run migrate:import
```

It needs `ANTHROPIC_API_KEY` in `.env`. A document only gets an English side
once _all_ its strings are translated. The rest are listed in
`.migration/out/to-translate.en.json`. The transform builds one document per
language, then merges each pair into one bilingual document
(`scripts/merge-locales/lib.ts`). English sides are flagged
`machineTranslated` (visible in the Studio, and articles show a “Translated
from the French” line) until an editor reviews them.

Once the dataset is live and editors are working in the Studio, don't use
`migrate:import` (it `--replace`s every document), and don't rely on
`--missing` to add English: the English side lives in the same document as the
French, which already exists. Fill in what's left with Auto-translate in the
Studio instead.

**Redirects.** Old URL patterns (`/tag/*`, `/balados-series/*`, `/carriere/*`,
`/a-propos/equipe`, `/ecole/*`, …) are in `astro.config.mjs`. Author pages and
item pages that became index pages are handled in `src/lib/legacy.ts`. Any
slug the import had to clean up is written to `src/redirects.json`.

Static Webflow pages (About, the École pages, Contact…) aren't in the CMS.
Step 6 seeds them from the Figma copy; paste over it with the live wording in
the Studio.

## Article audio

“Listen to the article” plays the article's _Audio version_ for the page's
language (one file per language). It's
generated with Microsoft Edge's neural voices (`fr-CA-SylvieNeural`,
`en-CA-ClaraNeural`) through [msedge-tts](https://www.npmjs.com/package/msedge-tts),
free and keyless:

```sh
npm run tts -- --slug <slug> --dry        # try it: writes .migration/tts/<slug>.<lang>.mp3
npm run tts -- --lang fr --limit 20       # the 20 newest French articles
npm run tts                               # everything missing or edited since
```

The script reads the title, summary and body, uploads a 48 kbps MP3 (~4–5 MB
for a 13-minute read) and records a hash of the text, so re-running it only
redoes new or edited articles. Run it after publishing, and again after the
English import. Audio uploaded by hand is never overwritten (except with
`--force`). Voices can be changed with `TTS_VOICE_FR` / `TTS_VOICE_EN` in
`.env` (e.g. `fr-CA-AntoineNeural`, `en-CA-LiamNeural`).

The Edge endpoint is unofficial: Microsoft can change or throttle it. Files
already generated are in Sanity and keep working. If it breaks, the script's
`speak()` is the only thing to swap for a paid API (Azure Speech, Google, OpenAI).

## Before launch

- [ ] Licensed ABC Favorit Compressed webfonts (currently the _Trial_ `.otf`
      files in `public/fonts/`; swap the files and the `@font-face` URLs in
      `src/styles/global.css`).
- [ ] Donate URL, newsletter endpoint and WhatsApp/Facebook links in Site settings.
- [ ] Partner stories (Independent media portal) and About partners: new content, not in Webflow.
- [ ] Final English copy for the interface strings in `src/i18n/index.ts`.

# laconverse
