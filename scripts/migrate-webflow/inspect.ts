/* Step 2 — print each snapshotted collection's fields and which Sanity field
 * the transform will read them into, so the guesses in mapping.ts can be
 * checked before anything is generated.
 *
 *   npm run migrate:inspect */
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { RAW, readJson, type WfCollection } from "./lib";
import { resolveMapping } from "./mapping";

const summary = readJson<Record<string, Record<string, number>>>(join(RAW, "summary.json"));
const collections = readdirSync(join(RAW, "collections")).map((file) =>
  readJson<WfCollection>(join(RAW, "collections", file)),
);
const idToSlug = Object.fromEntries(collections.map((c) => [c.id, c.slug]));
for (const c of collections) {
  const m = resolveMapping(c, idToSlug);
  console.log(
    `\n■ ${c.displayName} (/${c.slug}) → ${m.target ?? "SKIPPED"}   ${JSON.stringify(summary[c.slug] ?? {})}`,
  );
  for (const f of c.fields) {
    const used = Object.entries(m.fields).find(([, v]) => v === f.slug)?.[0];
    console.log(
      `   ${used ? "→ " + used.padEnd(16) : "  " + "".padEnd(16)} ${f.slug.padEnd(28)} ${f.type}${f.validations?.collectionId ? " → /" + (idToSlug[f.validations.collectionId] ?? `${f.validations.collectionId} (not exported yet)`) : ""}`,
    );
  }
}
