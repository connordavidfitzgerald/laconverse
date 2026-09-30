/* Shared by the Webflow → Sanity migration steps. See README.md next to this
   file for the order to run them in. */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

export const ROOT = process.env.MIGRATION_DIR ?? join(process.cwd(), ".migration");
export const RAW = join(ROOT, "raw");
export const OUT = join(ROOT, "out");

export function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}
export const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
export const exists = existsSync;

/* ---- Webflow Data API v2 ----------------------------------------------- */

export interface WfLocale {
  id: string;
  cmsLocaleId: string;
  tag: string;
  displayName: string;
  primary?: boolean;
}
export interface WfSite {
  id: string;
  displayName: string;
  locales?: { primary: WfLocale; secondary: WfLocale[] };
}
export interface WfField {
  id: string;
  slug: string;
  displayName: string;
  type: string;
  validations?: { collectionId?: string };
}
export interface WfCollection {
  id: string;
  slug: string;
  displayName: string;
  singularName: string;
  fields: WfField[];
}
export interface WfItem {
  id: string;
  cmsLocaleId?: string;
  isDraft?: boolean;
  isArchived?: boolean;
  createdOn?: string;
  lastPublished?: string;
  lastUpdated?: string;
  fieldData: Record<string, unknown> & { name?: string; slug?: string };
}

const API = "https://api.webflow.com/v2";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function wf<T>(path: string, token: string, attempt = 0): Promise<T> {
  const res = await fetch(API + path, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (res.status === 429 && attempt < 6) {
    const wait = Number(res.headers.get("retry-after") ?? 10) * 1000;
    console.warn(`  rate limited, waiting ${wait / 1000}s`);
    await sleep(wait);
    return wf(path, token, attempt + 1);
  }
  if (!res.ok) throw new Error(`Webflow ${res.status} ${path}: ${await res.text()}`);
  // Stay well under the 60 requests/minute limit.
  await sleep(1100);
  return res.json() as Promise<T>;
}

/* ---- Deterministic ids and keys --------------------------------------- */

export const key = (...parts: string[]) =>
  createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 12);

export { slugify } from "../../src/lib/slugify";

/* ---- Field lookup ------------------------------------------------------ */

/* Webflow field slugs are whatever the site's builder typed, so each target
   field is looked up by a list of likely slugs, then by type. Whatever is
   chosen is written to the report so the guesses can be reviewed and pinned
   in mapping.ts. */
export function findField(
  collection: WfCollection,
  types: string[],
  names: string[] = [],
  exclude: string[] = [],
) {
  const ok = collection.fields.filter(
    (f) => types.includes(f.type) && !["name", "slug", ...exclude].includes(f.slug),
  );
  for (const n of names) {
    const hit = ok.find((f) => f.slug === n || f.slug.startsWith(n));
    if (hit) return hit;
  }
  // Only images, rich text, references and dates fall back to "the first
  // one"; a random text, link or file field is worse than none.
  return types.some((t) =>
    ["PlainText", "Number", "Switch", "Email", "Link", "VideoLink", "File"].includes(t),
  )
    ? undefined
    : ok[0];
}

export const text = (v: unknown) =>
  typeof v === "string" ? v.trim() || undefined : typeof v === "number" ? String(v) : undefined;

export interface WfImage {
  fileId?: string;
  url?: string;
  alt?: string | null;
}
export const image = (v: unknown): WfImage | undefined => {
  const img = Array.isArray(v) ? v[0] : v;
  return img && typeof img === "object" && typeof (img as WfImage).url === "string"
    ? (img as WfImage)
    : undefined;
};

/** A Sanity image field built from a Webflow image; imported by `sanity dataset import`. */
export function figure(img: WfImage | undefined, alt?: string) {
  if (!img?.url) return undefined;
  return {
    _type: "figure",
    _sanityAsset: `image@${img.url}`,
    ...(img.alt || alt ? { alt: img.alt || alt } : {}),
  };
}

export const refs = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : typeof v === "string" && v ? [v] : [];

/** Drop undefined / empty values so documents stay clean. */
export function compact<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))
      delete obj[k];
  }
  return obj;
}
