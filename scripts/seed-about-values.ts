/* Write the About page's values carousel (title + the 10 values, French and
 * English) into the `aboutPage` document, from the copy in fixtures.ts.
 *
 *   npm run about:values           # sets valuesTitle and values (replaces them)
 *   npm run about:values -- --dry  # print the patch, change nothing
 *
 * Needs PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env. Edit the
 * values in the Studio afterwards; rerunning overwrites those edits. */
import { createClient } from "@sanity/client";

import { VALUES, VALUES_TITLE } from "../src/lib/fixtures";

const { PUBLIC_SANITY_PROJECT_ID, SANITY_WRITE_TOKEN } = process.env;
if (!PUBLIC_SANITY_PROJECT_ID || !SANITY_WRITE_TOKEN)
  throw new Error("Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env");

const set = {
  valuesTitle: { _type: "localeString", ...VALUES_TITLE },
  values: VALUES.fr.map(([fr, frText], i) => {
    const [en, enText] = VALUES.en[i];
    return {
      _key: `value${i + 1}`,
      _type: "value",
      title: { _type: "localeString", fr, en },
      text: { _type: "localeText", fr: frText, en: enText },
    };
  }),
};

if (process.argv.includes("--dry")) {
  console.log(JSON.stringify(set, null, 2));
} else {
  const sanity = createClient({
    projectId: PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2026-09-01",
    token: SANITY_WRITE_TOKEN,
    useCdn: false,
  });
  // Patch the draft too if one is open, so publishing it doesn't drop the values.
  const ids = await sanity.fetch<string[]>(`*[_id in ["aboutPage", "drafts.aboutPage"]]._id`);
  if (!ids.length) throw new Error("No aboutPage document yet: create it in the Studio first");
  const tx = sanity.transaction();
  for (const id of ids) tx.patch(id, (p) => p.set(set));
  await tx.commit();
  console.log(`Set ${set.values.length} values on ${ids.join(", ")}`);
}
