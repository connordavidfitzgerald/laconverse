// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import react from "@astrojs/react";
import sanity from "@sanity/astro";
import { readFileSync } from "node:fs";

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  "",
);

/* The Studio is mounted at /admin once a Sanity project exists. Until then the
   site builds from the fixtures in src/lib/fixtures.ts. */
const studio = PUBLIC_SANITY_PROJECT_ID
  ? [
      sanity({
        projectId: PUBLIC_SANITY_PROJECT_ID,
        dataset: PUBLIC_SANITY_DATASET || "production",
        apiVersion: "2026-09-01",
        useCdn: false,
        studioBasePath: "/admin",
      }),
      react(),
    ]
  : [];

/* Old Webflow URLs → new ones. French paths keep their slugs; the Webflow
   English locale used the same path segments under /en. Item URLs that
   collapse into an index, and author pages (whose slugs had spaces), are
   handled by src/pages/[section]/[slug].ts — see src/lib/legacy.ts. */
const legacy = [
  // [old path (no /en), new French path, new English path]
  ["/balados-series/[slug]", "/balados/[slug]", "/en/podcasts/[slug]"],
  [
    "/carriere/[slug]",
    "/engagez-vous/donnez-votre-voix/[slug]",
    "/en/get-involved/give-your-voice/[slug]",
  ],
  ["/media/articles", "/recherche", "/en/search"],
  ["/media/videos", "/videos", "/en/videos"],
  ["/media/balados", "/balados", "/en/podcasts"],
  ["/media/series", "/balados", "/en/podcasts"],
  ["/a-propos/equipe", "/a-propos", "/en/about"],
  ["/a-propos/nouvelles", "/a-propos", "/en/about"],
  ["/a-propos/nos-anciens", "/a-propos", "/en/about"],
  ["/a-propos/carrieres", "/engagez-vous/donnez-votre-voix", "/en/get-involved/give-your-voice"],
  ["/ecole/journalisme", "/la-releve/ecole-converse", "/en/la-releve/ecole-converse"],
  ["/ecole/mc-converse", "/la-releve/mc-converse", "/en/la-releve/mc-converse"],
  ["/ecole/balados", "/balados", "/en/podcasts"],
  ["/ecole/cohortes", "/la-releve", "/en/la-releve"],
  ["/ecole-converse", "/la-releve/ecole-converse", "/en/la-releve/ecole-converse"],
  ["/nextgen", "/la-releve", "/en/la-releve"],
  ["/event", "/la-releve", "/en/la-releve"],
  ["/search", "/recherche", "/en/search"],
  ["/je-donne", "/engagez-vous", "/en/get-involved"],
  ["/communaute-converse", "/engagez-vous", "/en/get-involved"],
  ["/infolettre", "/", "/en"],
  ["/notre-financement", "/a-propos", "/en/about"],
  ["/prix-et-reconnaissances", "/a-propos", "/en/about"],
  ["/politique-de-confidentialite", "/a-propos", "/en/about"],
  ["/protection-des-donnees", "/a-propos", "/en/about"],
  ["/studio", "/", "/en"],
  ["/en/a-propos", "", "/en/about"],
  ["/en/engagez-vous", "", "/en/get-involved"],
];
/** @param {string} destination @returns {{ status: 301, destination: string }} */
const moved = (destination) => ({ status: 301, destination });
/** @type {Record<string, { status: 301, destination: string }>} */
const redirects = Object.fromEntries(
  legacy
    .flatMap(([from, fr, en]) =>
      from.startsWith("/en/")
        ? [[from, moved(en)]]
        : [
            [from, moved(fr)],
            [`/en${from}`, moved(en)],
          ],
    )
    .filter(([source, target]) => typeof target === "object" && source !== target.destination),
);
/* Individual slugs the import had to change (written by migrate:transform). */
for (const { source, destination } of JSON.parse(readFileSync("./src/redirects.json", "utf8"))) {
  redirects[source] = moved(destination);
}

export default defineConfig({
  redirects,
  site: "https://laconverse.com",
  /* Every page is built at deploy time except articles, authors and topics
     (the routes with `prerender = false`): there are too many of those to
     build each time, so Vercel renders each on its first visit and caches it
     (ISR) until the next deploy. Publishing in Sanity redeploys the site; see
     README → “Publishing”. */
  adapter: vercel({ isr: { expiration: false, exclude: [/^\/api\//] } }),
  // Static pages mostly wait on Sanity, so build several at once.
  build: { concurrency: 6 },
  integrations: studio,
  vite: { plugins: [tailwindcss()] },
});
