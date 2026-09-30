/* Step 1 (alternative) — build the snapshot from Webflow CSV exports instead
 * of the API.
 *
 *   npm run migrate:csv
 *
 * Put every collection's export in .migration/csv/ — once per locale. The
 * Designer exports only the locale currently selected, so export all
 * collections in French, switch the locale to English, and export again
 * (add -en to those filenames if the names collide).
 *
 * Writes .migration/raw/ in the same shape extract.ts does, so inspect and
 * transform work unchanged. What a CSV can't say, this infers:
 *   - field types, from the values in each column
 *   - references, which the CSV gives as slugs: matched to the Item IDs of
 *     the referenced collection's own export (hints below say which one)
 *   - the locale, from the “Locale ID” column (the most common id is French) */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  RAW,
  ROOT,
  slugify,
  writeJson,
  type WfCollection,
  type WfField,
  type WfItem,
  type WfSite,
} from "./lib";

const DIR = join(ROOT, "csv");

/* Webflow collection display names → the URL slugs the live site uses. */
const COLLECTION_SLUGS: Record<string, string> = {
  articles: "articles",
  people: "people",
  tags: "tag",
  tag: "tag",
  "category-tags": "categorytag",
  categorytags: "categorytag",
  "article-categories": "categorytag",
  categories: "categorytag",
  "video-tags": "video-tags",
  videos: "videos",
  "balados-series": "balados-series",
  "balados-episodes": "balados-episodes",
  carriere: "carriere",
  carrieres: "carriere",
  careers: "carriere",
  photographers: "photographers",
  illustrators: "illustrators",
};

/* Columns known to be references, by column slug → target collection slug.
   Anything else is detected by matching its values against other exports. */
const REF_HINTS: Record<string, string> = {
  "main-author": "people",
  "multiple-authors": "people",
  photographer: "photographers",
  illustrator: "illustrators",
  "article-category": "categorytag",
  "sub-category-tag": "tag",
};

const SYSTEM = new Set([
  "name",
  "slug",
  "collection-id",
  "locale-id",
  "item-id",
  "archived",
  "draft",
  "created-on",
  "updated-on",
  "published-on",
]);

/* ---- CSV parsing (RFC 4180: quoted fields, embedded commas/newlines) --- */

function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const text = input.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ""));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

/* ---- Load every export ------------------------------------------------- */

interface Export {
  file: string;
  name: string;
  slug: string;
  collectionId: string;
  localeId: string;
  headers: string[];
  rows: Record<string, string>[];
  forcedLang?: "fr" | "en";
}

const files = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".csv"));
if (!files.length) {
  console.error(`No CSV files in ${DIR}`);
  process.exit(1);
}

/* Sheets that aren't Webflow exports (no Item ID column) — such as the
   re-categorization sheet — are copied into the snapshot as they are, under
   their slugified name, for transform.ts to pick up. */
const sheets = new Map<string, Record<string, string>[]>();

const exports: Export[] = files.flatMap((file) => {
  const rows = parseCsv(readFileSync(join(DIR, file), "utf8"));
  if (rows[0] && !("Item ID" in rows[0])) {
    const name = slugify(file.replace(/\.csv$/i, "").replace(/^la converse - /i, ""));
    sheets.set(name, rows);
    return [];
  }
  // "La Converse - Articles - 659f0e2c….csv" (optionally with -en / (EN))
  const base = file.replace(/\.csv$/i, "");
  // An explicit language in the filename wins over the Locale ID guess.
  const forcedLang = /\b(en|english|anglais)\b/i.test(base)
    ? "en"
    : /\b(fr|french|francais|français)\b/i.test(base)
      ? "fr"
      : undefined;
  const parts = base.split(" - ");
  const name = (parts.length >= 3 ? parts.slice(1, -1).join(" - ") : parts[0]).trim();
  const slug = COLLECTION_SLUGS[slugify(name)] ?? slugify(name);
  return [
    {
      file,
      name,
      slug,
      rows,
      forcedLang,
      collectionId: rows[0]?.["Collection ID"] ?? slugify(name),
      localeId: rows[0]?.["Locale ID"] ?? "",
      headers: rows[0] ? Object.keys(rows[0]) : [],
    },
  ];
});

/* Locales: the id on the most rows overall is the primary (French). */
const localeCounts = new Map<string, number>();
for (const e of exports)
  for (const r of e.rows)
    localeCounts.set(r["Locale ID"], (localeCounts.get(r["Locale ID"]) ?? 0) + 1);
const forced = new Map(exports.filter((e) => e.forcedLang).map((e) => [e.localeId, e.forcedLang!]));
const [primaryId] = [...localeCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .find(([id]) => forced.get(id) !== "en") ?? [""];
const langOf = (localeId: string) => forced.get(localeId) ?? (localeId === primaryId ? "fr" : "en");

/* Slug → Item ID per collection, from the primary-locale exports (Webflow
   references are to the item, whatever the locale). */
const itemIdBySlug = new Map<string, Map<string, string>>();
for (const e of exports) {
  const map = itemIdBySlug.get(e.slug) ?? new Map<string, string>();
  for (const r of e.rows) {
    if (r.Slug) map.set(r.Slug, r["Item ID"]);
    const name = r.Name ?? r[Object.keys(r)[0]];
    if (name) map.set(slugify(name), r["Item ID"]); // “nouri nesrouche”-style references
  }
  itemIdBySlug.set(e.slug, map);
}
const collectionIdBySlug = new Map(exports.map((e) => [e.slug, e.collectionId]));

/* ---- Field types ------------------------------------------------------- */

const isDate = (v: string) =>
  /^\w{3} \w{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT/.test(v) || /^\d{4}-\d{2}-\d{2}T/.test(v);
const isHtml = (v: string) => /<(p|h[1-6]|ul|ol|figure|div|blockquote|strong|em|a)[\s>]/i.test(v);
const isImage = (v: string) =>
  /^https?:\/\/\S+\.(jpe?g|png|gif|webp|avif|svg)(\?\S*)?$/i.test(v.split(";")[0].trim());
const isFile = (v: string) =>
  /^https?:\/\/\S*(website-files|webflow)\S*\.(pdf|mp3|m4a|wav|mp4|mov|docx?)(\?\S*)?$/i.test(v);
const tokens = (v: string) =>
  v
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

function inferField(e: Export, header: string): WfField {
  const slug = slugify(header);
  const values = e.rows.map((r) => r[header]).filter((v) => v.trim());
  const multi = values.some((v) => v.includes(";"));
  const field = (type: string, extra: Partial<WfField> = {}): WfField => ({
    id: slug,
    slug,
    displayName: header,
    type,
    ...extra,
  });
  if (!values.length) return field("PlainText");

  const hinted = REF_HINTS[slug];
  const refTarget =
    hinted ??
    [...itemIdBySlug.entries()].find(
      ([target, map]) =>
        target !== e.slug &&
        map.size > 0 &&
        values.filter((v) => tokens(v).every((t) => map.has(t))).length / values.length >= 0.8,
    )?.[0];
  if (refTarget && !values.some(isHtml) && !values.some((v) => /^https?:/.test(v))) {
    return field(multi ? "MultiReference" : "Reference", {
      validations: { collectionId: collectionIdBySlug.get(refTarget) ?? refTarget },
    });
  }
  if (values.every((v) => v === "true" || v === "false")) return field("Switch");
  if (values.every(isDate)) return field("DateTime");
  if (values.some(isHtml)) return field("RichText");
  if (values.every(isImage)) return field(multi ? "MultiImage" : "Image");
  if (values.every(isFile)) return field("File");
  if (values.every((v) => /^https?:\/\//.test(v)))
    return field(/youtu|vimeo/.test(values[0]) ? "VideoLink" : "Link");
  if (values.every((v) => /^-?\d+(\.\d+)?$/.test(v))) return field("Number");
  return field("PlainText");
}

function value(field: WfField, raw: string, targetSlug?: string): unknown {
  const v = raw.trim();
  if (!v) return undefined;
  switch (field.type) {
    case "Switch":
      return v === "true";
    case "Number":
      return Number(v);
    case "DateTime":
      return new Date(v.replace(/ \(.*\)$/, "")).toISOString();
    case "Image":
      return { url: v, alt: null };
    case "MultiImage":
      return tokens(v).map((url) => ({ url, alt: null }));
    case "File":
      return { url: v };
    case "Link":
    case "VideoLink":
      return v;
    case "Reference":
    case "MultiReference": {
      const map = itemIdBySlug.get(targetSlug ?? "");
      // Unresolvable slugs are kept as-is, so transform reports them.
      const ids = tokens(v).map((t) => map?.get(t) ?? map?.get(slugify(t)) ?? `unresolved:${t}`);
      return field.type === "Reference" ? ids[0] : ids;
    }
    default:
      return v;
  }
}

/* ---- Write the snapshot ------------------------------------------------ */

const site: WfSite = {
  id: "csv",
  displayName: "La Converse (CSV export)",
  locales: {
    primary: { id: primaryId, cmsLocaleId: primaryId, tag: "fr", displayName: "Français" },
    secondary: [...localeCounts.keys()]
      .filter((id) => id !== primaryId)
      .map((id) => ({ id, cmsLocaleId: id, tag: langOf(id), displayName: langOf(id) })),
  },
};
writeJson(join(RAW, "site.json"), site);

const summary: Record<string, Record<string, number>> = {};
const idToSlug = Object.fromEntries(exports.map((e) => [e.collectionId, e.slug]));
const written = new Set<string>();

for (const e of exports) {
  // One schema per collection (from the first export seen of it).
  // Most exports call the title column "Name"; a few (Carrières) name it
  // themselves, in which case it is the first column.
  const nameCol = e.headers.includes("Name") ? "Name" : e.headers[0];
  const fields = e.headers
    .filter((h) => h !== nameCol && !SYSTEM.has(slugify(h)))
    .map((h) => inferField(e, h));
  if (!written.has(e.slug)) {
    const collection: WfCollection = {
      id: e.collectionId,
      slug: e.slug,
      displayName: e.name,
      singularName: e.name,
      fields: [
        { id: "name", slug: "name", displayName: "Name", type: "PlainText" },
        { id: "slug", slug: "slug", displayName: "Slug", type: "PlainText" },
        ...fields,
      ],
    };
    writeJson(join(RAW, "collections", `${e.slug}.json`), collection);
    written.add(e.slug);
  }

  const lang = e.forcedLang ?? langOf(e.localeId);
  const items: WfItem[] = e.rows.map((r) => ({
    id: r["Item ID"],
    cmsLocaleId: r["Locale ID"],
    isDraft: r.Draft === "true",
    isArchived: r.Archived === "true",
    createdOn: r["Created On"]
      ? new Date(r["Created On"].replace(/ \(.*\)$/, "")).toISOString()
      : undefined,
    lastPublished: r["Published On"]
      ? new Date(r["Published On"].replace(/ \(.*\)$/, "")).toISOString()
      : undefined,
    fieldData: {
      name: r[nameCol]?.trim(),
      slug: r.Slug?.trim(),
      ...Object.fromEntries(
        fields.map((f) => [
          f.slug,
          value(
            f,
            r[f.displayName] ?? "",
            idToSlug[f.validations?.collectionId ?? ""] ?? f.validations?.collectionId,
          ),
        ]),
      ),
    },
  }));
  writeJson(join(RAW, "items", `${e.slug}.${lang}.json`), items);
  summary[e.slug] = {
    ...summary[e.slug],
    [lang]: items.filter((i) => !i.isDraft && !i.isArchived).length,
  };

  const unresolved = new Set(
    items.flatMap((i) =>
      Object.values(i.fieldData)
        .flat()
        .filter((v): v is string => typeof v === "string" && v.startsWith("unresolved:")),
    ),
  );
  console.log(
    `  ${e.name} → /${e.slug} [${lang}] ${items.length} rows (${summary[e.slug][lang]} live)${unresolved.size ? ` · ${unresolved.size} unresolved reference values` : ""}`,
  );
}

writeJson(join(RAW, "summary.json"), summary);
for (const [name, rows] of sheets) {
  writeJson(join(RAW, "sheets", `${name}.json`), rows);
  console.log(`  ${name} (sheet) → raw/sheets/${name}.json, ${rows.length} rows`);
}
const missing = [...new Set(Object.values(REF_HINTS))].filter((s) => !itemIdBySlug.has(s));
if (missing.length)
  console.log(
    `\nReferences point at collections with no export yet: ${missing.join(", ")}. Add those CSVs and re-run.`,
  );
if (!site.locales!.secondary.length)
  console.log("Only one locale found — export the English locale too.");
console.log("\nSnapshot written to .migration/raw/. Next: npm run migrate:inspect");
