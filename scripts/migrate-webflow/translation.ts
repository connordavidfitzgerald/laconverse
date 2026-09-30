/* English versions of the French documents.
 *
 * Webflow only has French content, so the English documents are built from
 * the French ones with a translation memory: JSON files in
 * scripts/migrate-webflow/translations/en/, each a map of
 * French source → English. Hand-written files and the ones translate.ts
 * writes are merged; a later file wins.
 *
 * Rich text is translated one block at a time. A block is written out as a
 * small markup string that keeps its marks as tags —
 *   “La <em>Converse</em> a parlé à <l1>Mme Diallo</l1>.”
 * — so a translator can move them with the words; the tags are then parsed
 * back into spans. strong / em / sup are decorators, l1, l2… are the block's
 * links in markDef order.
 *
 * `localize()` returns the English document, or the list of strings it is
 * still missing. The transform only writes an English document once every
 * string in it is translated: no half-French pages under /en. */
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { key, readJson } from "./lib";

export const TRANSLATIONS = join(import.meta.dirname, "translations", "en");

export function loadMemory(): Map<string, string> {
  const memory = new Map<string, string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".json")) {
        for (const [fr, en] of Object.entries(readJson<Record<string, string>>(path)))
          if (en?.trim()) memory.set(fr, en);
      }
    }
  };
  try {
    walk(TRANSLATIONS);
  } catch {}
  return memory;
}

/* ---- Blocks ⇄ markup --------------------------------------------------- */

interface Span {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
}
interface Block {
  _type: "block";
  _key: string;
  children: Span[];
  markDefs?: { _key: string }[];
  [k: string]: unknown;
}

const DECORATORS = new Set(["strong", "em", "sup"]);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

export function blockToMarkup(block: Block): string {
  const links = (block.markDefs ?? []).map((d) => d._key);
  return (
    block.children
      .map((span) => {
        const marks = [...(span.marks ?? [])].sort();
        return marks.reduce((t, m) => {
          const tag = DECORATORS.has(m) ? m : links.includes(m) ? `l${links.indexOf(m) + 1}` : null;
          return tag ? `<${tag}>${t}</${tag}>` : t;
        }, esc(span.text));
      })
      .join("")
      // Adjacent spans with the same mark read as one phrase to a translator.
      .replace(/<\/(strong|em|sup|l\d+)><\1>/g, "")
  );
}

/** The translated block, or null when the markup's tags don't parse. */
export function markupToBlock(markup: string, source: Block): Block | null {
  const links = (source.markDefs ?? []).map((d) => d._key);
  const children: Span[] = [];
  const open: string[] = [];
  const push = (text: string) => {
    if (!text) return;
    const marks = open.map((t) => (DECORATORS.has(t) ? t : links[Number(t.slice(1)) - 1]));
    children.push({
      _type: "span",
      _key: key(source._key, "en", String(children.length)),
      text: unesc(text),
      marks,
    });
  };
  const re = /<(\/?)(strong|em|sup|l\d+)>/g;
  let last = 0;
  for (let m; (m = re.exec(markup));) {
    push(markup.slice(last, m.index));
    last = re.lastIndex;
    const [, closing, tag] = m;
    if (tag.startsWith("l") && !links[Number(tag.slice(1)) - 1]) return null;
    if (!closing) open.push(tag);
    else if (open.at(-1) === tag) open.pop();
    else return null;
  }
  push(markup.slice(last));
  if (open.length || /<\/?[a-z]/i.test(children.map((c) => c.text).join(""))) return null;
  // Links the translation dropped are dropped from markDefs too.
  const used = new Set(children.flatMap((c) => c.marks ?? []));
  return { ...source, children, markDefs: (source.markDefs ?? []).filter((d) => used.has(d._key)) };
}

/* ---- Documents --------------------------------------------------------- */

/* Plain-string fields that are copy (anything else — slugs, urls, names,
   ids, dates, enums — is left alone). */
const TEXT_KEYS = new Set([
  "title",
  "dek",
  "description",
  "intro",
  "summary",
  "note",
  "caption",
  "alt",
  "label",
  "text",
  "meta",
  "tagline",
  "role",
]);
const LIST_KEYS = new Set(["responsibilities", "profile"]);

export interface Localized<T> {
  doc?: T;
  missing: string[];
}

export function localize<T extends Record<string, unknown>>(
  doc: T,
  memory: Map<string, string>,
): Localized<T> {
  const missing: string[] = [];
  const tr = (fr: string) => {
    const en = memory.get(fr.trim());
    if (en === undefined) missing.push(fr.trim());
    return en ?? fr;
  };
  const walk = (value: unknown, field?: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((v) =>
        typeof v === "string" && field && LIST_KEYS.has(field) ? tr(v) : walk(v),
      );
    }
    if (!value || typeof value !== "object") return value;
    const o = value as Record<string, unknown>;
    if (o._type === "block") {
      const source = o as unknown as Block;
      const markup = blockToMarkup(source);
      if (!markup.trim()) return o;
      const en = memory.get(markup.trim());
      if (en === undefined) {
        missing.push(markup.trim());
        return o;
      }
      const block = markupToBlock(en, source);
      if (!block) missing.push(markup.trim());
      return block ?? o;
    }
    return Object.fromEntries(
      Object.entries(o).map(([k, v]) => {
        if (
          typeof v === "string" &&
          TEXT_KEYS.has(k) &&
          !(k === "text" && o._type === "span") &&
          v.trim()
        )
          return [k, tr(v)];
        return [k, walk(v, k)];
      }),
    );
  };
  const out = walk(doc) as T;
  return missing.length ? { missing } : { doc: out, missing };
}

/** Every string `localize` would need for a document, for the to-do list. */
export const sourceStrings = (doc: Record<string, unknown>) => localize(doc, new Map()).missing;
