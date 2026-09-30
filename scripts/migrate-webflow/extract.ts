/* Step 1 — snapshot the Webflow CMS to .migration/raw/.
 *
 *   npm run migrate:extract
 *
 * Needs WEBFLOW_TOKEN (site token with CMS: read, Sites: read) and
 * WEBFLOW_SITE_ID in .env. Pulls every collection's schema and every
 * *published* item in every locale. Nothing in Sanity is touched. */
import { join } from "node:path";

import { RAW, wf, writeJson, type WfCollection, type WfItem, type WfSite } from "./lib";

const token = process.env.WEBFLOW_TOKEN;
const siteId = process.env.WEBFLOW_SITE_ID;
if (!token || !siteId) {
  console.error("Set WEBFLOW_TOKEN and WEBFLOW_SITE_ID in .env first.");
  process.exit(1);
}

const site = await wf<WfSite>(`/sites/${siteId}`, token);
const locales = site.locales ? [site.locales.primary, ...site.locales.secondary] : [];
console.log(
  `Site: ${site.displayName} · locales: ${locales.map((l) => l.tag).join(", ") || "(single)"}`,
);
writeJson(join(RAW, "site.json"), site);

const { collections } = await wf<{ collections: WfCollection[] }>(
  `/sites/${siteId}/collections`,
  token,
);
const summary: Record<string, Record<string, number>> = {};

for (const c of collections) {
  const full = await wf<WfCollection>(`/collections/${c.id}`, token);
  writeJson(join(RAW, "collections", `${full.slug}.json`), full);
  summary[full.slug] = {};

  for (const locale of locales.length ? locales : [undefined]) {
    const items: WfItem[] = [];
    for (let offset = 0; ; offset += 100) {
      const q = new URLSearchParams({ offset: String(offset), limit: "100" });
      if (locale) q.set("cmsLocaleId", locale.cmsLocaleId);
      const page = await wf<{ items: WfItem[]; pagination: { total: number } }>(
        `/collections/${c.id}/items/live?${q}`,
        token,
      );
      items.push(...page.items);
      if (items.length >= page.pagination.total || page.items.length === 0) break;
    }
    const tag = locale?.tag.slice(0, 2) ?? "fr";
    writeJson(join(RAW, "items", `${full.slug}.${tag}.json`), items);
    summary[full.slug][tag] = items.length;
    console.log(`  ${full.slug} [${tag}] ${items.length}`);
  }
}

writeJson(join(RAW, "summary.json"), summary);
console.log("\nSnapshot written to .migration/raw/. Next: npm run migrate:inspect");
