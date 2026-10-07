/* Every document used to be one per language (`category-x-fr` +
 * `category-x-en`, `homePage-fr` + `homePage-en`, `article-x-fr` +
 * `article-x-en`), linked by the translation plugin. They are now one
 * document with `{ fr, en }` fields. This file says which fields are
 * bilingual and builds the merged documents; it is shared by the dataset
 * conversion (run.ts) and the Webflow import (transform.ts), so both produce
 * the same shape. Sections, topics, series and the singletons were converted
 * on 2026-09-30; the editorial types (articles…) came after. */

type Doc = Record<string, unknown> & { _id: string; _type: string };

/* A field spec: `{ $l }` merges the French and English values into
   `{ _type?, fr, en }`; an object spec recurses into the listed fields (the
   rest are shared, French winning); `[spec]` merges two arrays item by item. */
type Leaf = { $l: string | null };
type Spec = Leaf | [Spec] | { $type?: string; [field: string]: Spec | string | undefined };

const L = (type: string | null = null): Leaf => ({ $l: type });
const STR = L("localeString");
const TEXT = L("localeText");
const RICH = L("localeRichText");
const NOTE = L("localeNote");
const LIST = L("localeStringList");
/* Different values per language that aren't text (article or program picks). */
const PER_LANG = L(null);
const CTA = { $type: "localeCta", label: STR, url: STR };
const SEO = { $type: "localeSeo", title: STR, description: TEXT };
const CARD = { title: STR, text: TEXT, cta: CTA };

export const TAXONOMY_TYPES = ["category", "tag", "series"] as const;
export const taxonomySpec: Spec = { title: STR, slug: PER_LANG, description: TEXT };

/* Articles, videos, podcasts, programs, positions and partner stories. Their
   old `seo` and `cta` objects become the bilingual `localeSeo`/`localeCta`. */
export const editorialSpecs: Record<string, Spec> = {
  article: {
    title: STR,
    slug: PER_LANG,
    dek: TEXT,
    body: RICH,
    authorsNote: NOTE,
    listen: PER_LANG,
    listenSource: PER_LANG,
    seo: SEO,
  },
  video: { title: STR, slug: PER_LANG, body: RICH, seo: SEO },
  podcast: {
    title: STR,
    slug: PER_LANG,
    description: TEXT,
    intro: TEXT,
    episodes: [{ title: STR, description: TEXT }],
    credits: [{ role: STR }],
    note: TEXT,
    seo: SEO,
  },
  program: {
    title: STR,
    slug: PER_LANG,
    tagline: TEXT,
    body: RICH,
    cta: CTA,
    quote: { text: TEXT, source: STR },
    form: { title: STR, text: TEXT },
    seo: SEO,
  },
  position: {
    title: STR,
    slug: PER_LANG,
    meta: STR,
    summary: TEXT,
    responsibilities: LIST,
    profile: LIST,
  },
  partnerStory: { title: STR },
};
const specFor = (type: string) =>
  (TAXONOMY_TYPES as readonly string[]).includes(type) ? taxonomySpec : editorialSpecs[type];
/* Types paired through the translation plugin's metadata. */
export const PAIRED_TYPES = [...TAXONOMY_TYPES, ...Object.keys(editorialSpecs)];

export const singletonSpecs: Record<string, Spec> = {
  siteSettings: { voicePrompt: STR, seo: SEO },
  homePage: {
    lead: PER_LANG,
    topStories: PER_LANG,
    support: { title: STR, text: TEXT, cta: CTA },
    ecole: { title: STR, text: TEXT, program: PER_LANG },
    seo: SEO,
  },
  aboutPage: { title: STR, intro: RICH, sections: [{ title: STR, body: RICH }], seo: SEO },
  laRelevePage: { title: STR, intro: RICH, cta: CTA, programs: PER_LANG, seo: SEO },
  getInvolvedPage: {
    title: STR,
    intro: TEXT,
    cards: [CARD],
    donate: { title: STR, text: TEXT, options: [CTA] },
    cardsAfter: [CARD],
    volunteer: { title: STR, intro: TEXT, items: [{ title: STR, text: STR }], cta: CTA },
    seo: SEO,
  },
  giveYourVoicePage: {
    title: STR,
    intro: TEXT,
    openApplication: { title: STR, text: TEXT },
    culture: { title: STR, text: TEXT },
    apply: { title: STR, text: TEXT },
    seo: SEO,
  },
  contactPage: { title: STR, subtitle: STR, links: [{ prompt: STR, cta: CTA }], seo: SEO },
};

const empty = (v: unknown) => v === undefined || v === null;
type Obj = Record<string, unknown>;

function merge(spec: Spec, fr: unknown, en: unknown): unknown {
  if (empty(fr) && empty(en)) return undefined;
  if (Array.isArray(spec)) {
    const a = (fr as unknown[] | undefined) ?? [];
    const b = (en as unknown[] | undefined) ?? [];
    const n = Math.max(a.length, b.length);
    return n ? Array.from({ length: n }, (_, i) => merge(spec[0], a[i], b[i])) : undefined;
  }
  if ("$l" in spec) {
    const out: Obj = spec.$l ? { _type: spec.$l } : {};
    if (!empty(fr)) out.fr = fr;
    if (!empty(en)) out.en = en;
    return out;
  }
  const out: Obj = { ...((en as Obj) ?? {}), ...((fr as Obj) ?? {}) };
  for (const [k, sub] of Object.entries(spec)) {
    if (k === "$type" || typeof sub !== "object") continue;
    const v = merge(sub, (fr as Obj | undefined)?.[k], (en as Obj | undefined)?.[k]);
    if (v === undefined) delete out[k];
    else out[k] = v;
  }
  if (typeof spec.$type === "string") out._type = spec.$type;
  return out;
}

const SYSTEM = ["_rev", "_createdAt", "_updatedAt", "_system", "language", "machineTranslated"];

/** One bilingual document from a French and/or English one. */
export function mergeDocs(spec: Spec, id: string, fr?: Obj, en?: Obj): Doc {
  const doc = merge(spec, fr, en) as Obj;
  for (const k of SYSTEM) delete doc[k];
  /* Which side was machine-translated: a flag on the old one-language doc. */
  const translated = en?.machineTranslated ? "en" : fr?.machineTranslated ? "fr" : null;
  if (translated) doc.machineTranslated = translated;
  return { ...doc, _id: id, _type: String((fr ?? en)!._type) };
}

/* Picks of articles and programs used to be one per language
   (`lead: { fr, en }`). Now that both languages are one document they are
   one pick: the French one, or the English one when French had none; lists
   are the French picks followed by any English-only ones. */
const PICKS: Record<string, string[]> = {
  homePage: ["lead", "topStories", "ecole.program"],
  laRelevePage: ["programs"],
};
const perLang = (v: unknown): v is { fr?: unknown; en?: unknown } =>
  !!v && typeof v === "object" && !Array.isArray(v) && !("_ref" in v) && ("fr" in v || "en" in v);

export function collapsePicks<T extends Obj>(doc: T, type: string): T {
  const out = structuredClone(doc) as Obj;
  for (const path of PICKS[type] ?? []) {
    const keys = path.split(".");
    const parent = keys.slice(0, -1).reduce<Obj | undefined>((o, k) => o?.[k] as Obj, out);
    const last = keys.at(-1)!;
    const value = parent?.[last];
    if (!parent || !perLang(value)) continue;
    const { fr, en } = value;
    if (Array.isArray(fr) || Array.isArray(en)) {
      const seen = new Set<string>();
      const list = [...((fr as Obj[]) ?? []), ...((en as Obj[]) ?? [])].filter((r) => {
        const ref = String(r._ref);
        return !seen.has(ref) && !!seen.add(ref);
      });
      if (list.length) parent[last] = list;
      else delete parent[last];
    } else if (fr ?? en) parent[last] = fr ?? en;
    else delete parent[last];
  }
  return out as T;
}

/** Every reference to an old ID swapped for its new one. */
export function relink<T>(value: T, ids: Map<string, string>): T {
  if (Array.isArray(value)) return value.map((v) => relink(v, ids)) as T;
  if (!value || typeof value !== "object") return value;
  const o = value as Obj;
  if (typeof o._ref === "string" && ids.has(o._ref)) return { ...o, _ref: ids.get(o._ref) } as T;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, relink(v, ids)])) as T;
}

export const baseId = (id: string) => id.replace(/-(fr|en)$/, "");

export interface Plan {
  creates: Doc[];
  patches: { id: string; set: Obj; unset: string[] }[];
  deletes: string[];
  /** Old ID → new ID, for the report. */
  ids: Map<string, string>;
  problems: string[];
}

/** The conversion of a dataset (or any list of documents from it). */
export function planMigration(docs: Doc[]): Plan {
  const problems: string[] = [];
  const byId = new Map(docs.map((d) => [d._id, d]));
  const isPaired = (type: string) => PAIRED_TYPES.includes(type);
  /* Documents still one per language; converted ones have no `language`. */
  const perLanguage = docs.filter(
    (d) => isPaired(d._type) && d.language && !d._id.startsWith("drafts."),
  );
  const singletonIds = Object.keys(singletonSpecs).flatMap((t) => [`${t}-fr`, `${t}-en`]);

  for (const d of docs)
    if (
      d._id.startsWith("drafts.") &&
      (perLanguage.some((t) => `drafts.${t._id}` === d._id) ||
        singletonIds.includes(d._id.slice(7)))
    )
      problems.push(`${d._id} has unpublished changes: publish or discard them first.`);

  /* Pairs come from the translation plugin's metadata; anything unpaired
     becomes a one-language document. */
  const metadata = docs.filter(
    (d) =>
      d._type === "translation.metadata" && (d.schemaTypes as string[] | undefined)?.some(isPaired),
  );
  const pairs = new Map<string, { fr?: Doc; en?: Doc }>();
  const paired = new Set<string>();
  for (const m of metadata) {
    const pair: { fr?: Doc; en?: Doc } = {};
    for (const t of (m.translations as { language: string; value: { _ref: string } }[]) ?? []) {
      const doc = byId.get(t.value._ref);
      if (doc?.language && (t.language === "fr" || t.language === "en")) pair[t.language] = doc;
    }
    const first = pair.fr ?? pair.en;
    if (!first) continue;
    pairs.set(baseId(first._id), pair);
    for (const d of [pair.fr, pair.en]) if (d) paired.add(d._id);
  }
  for (const d of perLanguage) {
    if (paired.has(d._id)) continue;
    const pair = pairs.get(baseId(d._id)) ?? {};
    if (pair[d.language as "fr" | "en"]) {
      problems.push(
        `${d._id} and ${pair[d.language as "fr" | "en"]!._id} both claim ${baseId(d._id)}.`,
      );
      continue;
    }
    pair[d.language as "fr" | "en"] = d;
    pairs.set(baseId(d._id), pair);
  }

  const ids = new Map<string, string>();
  const creates: Doc[] = [];
  for (const [id, { fr, en }] of pairs) {
    creates.push(mergeDocs(specFor((fr ?? en)!._type), id, fr, en));
    for (const d of [fr, en]) if (d) ids.set(d._id, id);
  }
  for (const [type, spec] of Object.entries(singletonSpecs)) {
    const fr = byId.get(`${type}-fr`);
    const en = byId.get(`${type}-en`);
    if (!fr && !en) continue;
    creates.push(mergeDocs(spec, type, fr, en));
    for (const d of [fr, en]) if (d) ids.set(d._id, type);
  }
  // Merged documents point at merged documents too (the menu's sections).
  creates.splice(0, creates.length, ...creates.map((d) => collapsePicks(relink(d, ids), d._type)));

  const created = new Set(creates.map((d) => d._id));
  const gone = new Set([...ids.keys(), ...metadata.map((m) => m._id)]);
  const patches: Plan["patches"] = [];
  for (const d of docs) {
    if (gone.has(d._id) || gone.has(d._id.replace(/^drafts\./, ""))) continue;
    const set: Obj = {};
    const unset: string[] = [];
    const next = collapsePicks(relink(d, ids), d._type);
    for (const [k, v] of Object.entries(d)) {
      if (k.startsWith("_") || JSON.stringify(next[k]) === JSON.stringify(v)) continue;
      if (next[k] === undefined) unset.push(k);
      else set[k] = next[k];
    }
    if (Object.keys(set).length || unset.length) patches.push({ id: d._id, set, unset });
  }

  /* A merged document can keep its French document's ID (one made in the
     Studio has no -fr suffix): it's replaced in place, not deleted. */
  const deletes = [...gone].filter((id) => byId.has(id) && !created.has(id));
  return { creates, patches, deletes, ids, problems };
}

/** The documents after the conversion, for building an import file (the
    Webflow import builds one document per language, then merges them). */
export function mergeAll(docs: Doc[]): Doc[] {
  const plan = planMigration(docs);
  if (plan.problems.length) throw new Error(plan.problems.join("\n"));
  const patches = new Map(plan.patches.map((p) => [p.id, p]));
  const created = new Set(plan.creates.map((d) => d._id));
  const dropped = new Set([...plan.deletes, ...created]);
  const kept = docs
    .filter((d) => !dropped.has(d._id))
    .map((d) => {
      const p = patches.get(d._id);
      if (!p) return d;
      const out: Doc = { ...d, ...p.set };
      for (const k of p.unset) delete out[k];
      return out;
    });
  return [...kept, ...plan.creates];
}

/** Report keys for a document: `article.fr` / `article.en` for each language
    it's published in (has a slug in), or just its type. Shared by the import
    report and validate.ts so their counts compare. */
export function countKeys(d: { _type: string; slug?: unknown }): string[] {
  const slug = d.slug as Record<string, { current?: string } | undefined> | undefined;
  const langs = slug && !("current" in slug) ? ["fr", "en"].filter((l) => slug[l]?.current) : [];
  return langs.length ? langs.map((l) => `${d._type}.${l}`) : [d._type];
}
