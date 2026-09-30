/* One-off: convert sections, topics, series and the page singletons from one
 * document per language to one bilingual document (see lib.ts).
 *
 *   npm run migrate:merge-locales                      # dry run: prints the plan
 *   npm run migrate:merge-locales -- --apply           # does it
 *   npm run migrate:merge-locales -- --dataset staging --apply
 *
 * Steps, each safe to re-run: create the merged documents, repoint every
 * article/video/settings reference at them, then delete the old per-language
 * documents and their translation links. Export a backup first:
 *   npx sanity dataset export production backup-before-merge.tar.gz */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@sanity/client";

import { planMigration } from "./lib";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const APPLY = process.argv.includes("--apply");
const dataset = arg("dataset") ?? process.env.PUBLIC_SANITY_DATASET ?? "production";
const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env.");
  process.exit(1);
}
const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-09-01",
  token,
  useCdn: false,
  perspective: "raw",
});

const docs = await client.fetch(
  `*[_type in ["category", "tag", "series", "translation.metadata"]
     || _id match "*Page-*" || _id match "siteSettings-*"
     || references(*[_type in ["category", "tag", "series"]]._id)]`,
);
const plan = planMigration(docs);

console.log(`Dataset "${dataset}":`);
console.log(`  ${plan.creates.length} bilingual documents to create`);
console.log(`  ${plan.patches.length} documents to repoint`);
console.log(`  ${plan.deletes.length} per-language documents and translation links to delete`);
const out = join(".migration", "out", `merge-locales.${dataset}.json`);
writeFileSync(out, JSON.stringify({ ...plan, ids: Object.fromEntries(plan.ids) }, null, 1));
console.log(`  Full plan: ${out}`);
if (plan.problems.length) {
  console.error(`\n${plan.problems.join("\n")}`);
  process.exit(1);
}
if (!plan.creates.length && !plan.patches.length && !plan.deletes.length) {
  console.log("\nNothing to do: already converted.");
  process.exit(0);
}
if (!APPLY) {
  console.log("\nDry run. Add --apply to write it.");
  process.exit(0);
}

async function inChunks<T>(
  label: string,
  items: T[],
  add: (tx: ReturnType<typeof client.transaction>, item: T) => void,
) {
  for (let i = 0; i < items.length; i += 50) {
    const tx = client.transaction();
    for (const item of items.slice(i, i + 50)) add(tx, item);
    await tx.commit({ visibility: "async" });
    console.log(`  ${label}: ${Math.min(i + 50, items.length)}/${items.length}`);
  }
}
await inChunks("created", plan.creates, (tx, d) => tx.createOrReplace(d));
await inChunks("repointed", plan.patches, (tx, p) => tx.patch(p.id, (q) => q.set(p.set)));
await inChunks("deleted", plan.deletes, (tx, id) => tx.delete(id));
console.log("\nDone. Redeploy the site so the pages are rebuilt from the new documents.");
