/* Step 5 — after the import, compare what is in Sanity with what the
 * transform produced, and check every reference resolves.
 *
 *   npm run migrate:validate */
import { join } from "node:path";
import { createClient } from "@sanity/client";

import { OUT, readJson } from "./lib";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env.");
  process.exit(1);
}
const client = createClient({
  projectId,
  dataset: process.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2026-09-01",
  token,
  useCdn: false,
});
const report = readJson<{
  counts: Record<string, number>;
  source: Record<string, Record<string, number>>;
}>(join(OUT, "report.json"));

let failed = false;
const actual = await client.fetch<{ type: string; lang: string | null }[]>(
  `*[!(_id in path("drafts.**")) && _type in $types]{ "type": _type, "lang": language }`,
  {
    types: [...new Set(Object.keys(report.counts).map((k) => k.replace(/\.(fr|en)$/, "")))],
  },
);
const tally: Record<string, number> = {};
for (const { type, lang } of actual)
  tally[`${type}${lang ? `.${lang}` : ""}`] = (tally[`${type}${lang ? `.${lang}` : ""}`] ?? 0) + 1;

console.log("type.lang".padEnd(28), "expected", "in sanity");
for (const [k, expected] of Object.entries(report.counts)) {
  const got = tally[k] ?? 0;
  if (got !== expected) failed = true;
  console.log(
    k.padEnd(28),
    String(expected).padStart(8),
    String(got).padStart(9),
    got === expected ? "" : "  ✗",
  );
}

const all = await client.fetch<Record<string, unknown>[]>(
  `*[!(_id in path("drafts.**")) && _type in ["article", "video", "podcast", "aboutPage", "laRelevePage", "homePage", "siteSettings"]]`,
);
const dangling: { id: string; ref: string }[] = [];
const walk = (v: unknown, id: string) => {
  if (Array.isArray(v)) v.forEach((x) => walk(x, id));
  else if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o._ref === "string" && !o._ref.startsWith("image-") && !o._ref.startsWith("file-"))
      dangling.push({ id, ref: o._ref });
    Object.values(o).forEach((x) => walk(x, id));
  }
};
all.forEach((d) => walk(d, String(d._id)));
const found = new Set(
  await client.fetch<string[]>(`*[_id in $ids]._id`, {
    ids: [...new Set(dangling.map((d) => d.ref))],
  }),
);
dangling.splice(0, dangling.length, ...dangling.filter((d) => !found.has(d.ref)));
if (dangling.length) {
  failed = true;
  console.log(`\n${dangling.length} references do not resolve, e.g.`, dangling.slice(0, 5));
}

const noAsset = await client.fetch<number>(
  `count(*[_type == "article" && defined(image) && !defined(image.asset)])`,
);
if (noAsset) {
  failed = true;
  console.log(`\n${noAsset} articles have an image field but no uploaded asset.`);
}

// GROQ `match` works on words, so the tag test runs here.
const html = (
  await client.fetch<string[]>(`*[_type == "article"]{ "t": pt::text(body) }.t`)
).filter((t) => /<\/?(p|div|span|h[1-6]|br|strong|em)[\s>/]/i.test(t ?? "")).length;
if (html)
  console.log(`\n${html} articles look like they still contain raw HTML — check richtext.ts.`);

const samples = await client.fetch<{ title: string; slug: string; language: string }[]>(
  `*[_type == "article"] | order(publishedAt desc)[0...5]{ title, "slug": slug.current, language }`,
);
console.log("\nSpot-check these against the live site:");
for (const s of samples)
  console.log(`  ${s.language === "en" ? "/en" : ""}/articles/${s.slug}   ${s.title}`);

console.log(failed ? "\n✗ Validation found problems." : "\n✓ Counts and references match.");
process.exit(failed ? 1 : 0);
