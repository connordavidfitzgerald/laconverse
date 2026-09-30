/* Sections, topics, series and the page singletons used to be one document
 * per language (`category-x-fr` + `category-x-en`, `homePage-fr` +
 * `homePage-en`). They are now one document with `{ fr, en }` fields. This
 * file says which fields are bilingual and builds the merged documents; it is
 * shared by the one-off dataset conversion (run.ts) and the Webflow import
 * (transform.ts), so both produce the same shape. */

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
/* Different values per language that aren't text (article or program picks). */
const PER_LANG = L(null);
const CTA = { $type: "localeCta", label: STR, url: STR };
const SEO = { $type: "localeSeo", title: STR, description: TEXT };
const CARD = { title: STR, text: TEXT, cta: CTA };

export const TAXONOMY_TYPES = ["category", "tag", "series"] as const;
export const taxonomySpec: Spec = { title: STR, slug: PER_LANG, description: TEXT };

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
  return { ...doc, _id: id, _type: String((fr ?? en)!._type) };
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
  patches: { id: string; set: Obj }[];
  deletes: string[];
  /** Old ID → new ID, for the report. */
  ids: Map<string, string>;
  problems: string[];
}

/** The conversion of a dataset (or any list of documents from it). */
export function planMigration(docs: Doc[]): Plan {
  const problems: string[] = [];
  const byId = new Map(docs.map((d) => [d._id, d]));
  const taxonomy = docs.filter((d) => (TAXONOMY_TYPES as readonly string[]).includes(d._type));
  const singletonIds = Object.keys(singletonSpecs).flatMap((t) => [`${t}-fr`, `${t}-en`]);

  for (const d of docs)
    if (
      d._id.startsWith("drafts.") &&
      (taxonomy.some((t) => `drafts.${t._id}` === d._id) || singletonIds.includes(d._id.slice(7)))
    )
      problems.push(`${d._id} has unpublished changes: publish or discard them first.`);

  /* Pairs come from the translation plugin's metadata; anything unpaired
     becomes a one-language document. */
  const metadata = docs.filter(
    (d) =>
      d._type === "translation.metadata" &&
      (d.schemaTypes as string[] | undefined)?.some((t) =>
        (TAXONOMY_TYPES as readonly string[]).includes(t),
      ),
  );
  const pairs = new Map<string, { fr?: Doc; en?: Doc }>();
  const paired = new Set<string>();
  for (const m of metadata) {
    const pair: { fr?: Doc; en?: Doc } = {};
    for (const t of (m.translations as { language: string; value: { _ref: string } }[]) ?? []) {
      const doc = byId.get(t.value._ref);
      if (doc && (t.language === "fr" || t.language === "en")) pair[t.language] = doc;
    }
    const first = pair.fr ?? pair.en;
    if (!first) continue;
    pairs.set(baseId(first._id), pair);
    for (const d of [pair.fr, pair.en]) if (d) paired.add(d._id);
  }
  for (const d of taxonomy) {
    if (d._id.startsWith("drafts.") || paired.has(d._id)) continue;
    if (!d.language) continue; // already converted
    const pair = pairs.get(baseId(d._id)) ?? {};
    pair[d.language as "fr" | "en"] = d;
    pairs.set(baseId(d._id), pair);
  }

  const ids = new Map<string, string>();
  const creates: Doc[] = [];
  for (const [id, { fr, en }] of pairs) {
    creates.push(mergeDocs(taxonomySpec, id, fr, en));
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
  creates.splice(0, creates.length, ...creates.map((d) => relink(d, ids)));

  const gone = new Set([...ids.keys(), ...metadata.map((m) => m._id)]);
  const patches: Plan["patches"] = [];
  for (const d of docs) {
    if (gone.has(d._id) || gone.has(d._id.replace(/^drafts\./, ""))) continue;
    const set: Obj = {};
    for (const [k, v] of Object.entries(d)) {
      if (k.startsWith("_")) continue;
      const next = relink(v, ids);
      if (JSON.stringify(next) !== JSON.stringify(v)) set[k] = next;
    }
    if (Object.keys(set).length) patches.push({ id: d._id, set });
  }

  const deletes = [...gone].filter((id) => byId.has(id));
  return { creates, patches, deletes, ids, problems };
}
