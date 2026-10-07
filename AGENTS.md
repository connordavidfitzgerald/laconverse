## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project notes

- Design source: Figma AA_1_SHARED, page [CURRENT PROJECTS]. Mobile frames are
  the reference; only the homepage has a desktop frame (`HOMEPAGE — DESKTOP`),
  so other desktop layouts extrapolate from its 12-column grid.
- French is the root locale, English is `/en`. Routes live only in
  `src/i18n/index.ts`; add a page by adding a route key, a view in
  `src/views/`, and one thin page file per locale.
- All reads go through `src/lib/content.ts` (GROQ, falling back to
  `src/lib/fixtures.ts` when no Sanity project is configured). Keep the two in
  the same shape (`src/lib/types.ts`).
- Every Sanity document holds both languages as `{ fr, en }` fields (no
  per-language documents); a document is live in each language it has a slug
  in. Studio Auto-translate (Langbly) lives in `src/sanity/translate/`.
- Components are plain Astro + Tailwind; interactivity is small custom elements
  in `<script>` tags. No animation library yet.
- Webflow migration: see README → “Webflow → Sanity migration”.
