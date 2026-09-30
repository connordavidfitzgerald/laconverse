/* Step 3 — turn the snapshot into Sanity documents.
 *
 *   npm run migrate:transform
 *
 * Reads .migration/raw/, writes:
 *   .migration/out/import.ndjson   every CMS document (+ `_sanityAsset` directives)
 *   .migration/out/seed.ndjson     starter copy for the singleton pages + programs
 *   .migration/out/report.json     counts, field choices, and per-record issues
 *   src/redirects.json             old → new paths for slugs that had to change
 *
 * Offline and deterministic: the same snapshot always produces the same
 * files, with the same `_id`s, so the import can be re-run over itself.
 *
 * Taxonomy comes from the re-categorization sheet (raw/sheets/
 * nouvelle-taxonomie.json, one row per article): section, topics, format and
 * series. English documents come from translation.ts when Webflow has no
 * English export. */
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import {
  OUT,
  RAW,
  compact,
  exists,
  figure,
  image,
  key,
  readJson,
  refs,
  slugify,
  text,
  writeJson,
  type WfCollection,
  type WfItem,
  type WfSite,
} from "./lib";
import { OCCUPATIONS, resolveMapping, VIDEO_SERIES, type Target } from "./mapping";
import { mergeDocs, singletonSpecs } from "../merge-locales/lib";
import { htmlLists, htmlToPortableText, htmlToText, restrictBlocks } from "./richtext";
import { loadMemory, localize } from "./translation";
import { FORMATS } from "../../src/lib/formats";
import * as fx from "../../src/lib/fixtures";
import { href, type Lang } from "../../src/i18n";

type Doc = Record<string, unknown> & { _id: string; _type: string };
interface Issue {
  id: string;
  kind: string;
  detail: string;
}

const site = readJson<WfSite>(join(RAW, "site.json"));
const LANGS: Lang[] = site.locales
  ? [site.locales.primary, ...site.locales.secondary]
      .map((l) => l.tag.slice(0, 2) as Lang)
      .filter((l) => l === "fr" || l === "en")
  : ["fr"];
const PRIMARY = LANGS[0];

const collections = readdirSync(join(RAW, "collections")).map((f) =>
  readJson<WfCollection>(join(RAW, "collections", f)),
);
const idToSlug = Object.fromEntries(collections.map((c) => [c.id, c.slug]));
const byTarget = new Map<Target, { c: WfCollection; fields: Record<string, string | undefined> }>();
const contributors: { c: WfCollection; fields: Record<string, string | undefined> }[] = [];
const fieldReport: Record<string, unknown> = {};
for (const c of collections) {
  const m = resolveMapping(c, idToSlug);
  if (!m.target) continue;
  if (m.target === "contributor") contributors.push({ c, fields: m.fields });
  else byTarget.set(m.target, { c, fields: m.fields });
  fieldReport[`${c.slug} → ${m.target}`] = m.fields;
}

function itemsOf(collection: string, lang: Lang, drafts = false): WfItem[] {
  const file = join(RAW, "items", `${collection}.${lang}.json`);
  return exists(file)
    ? readJson<WfItem[]>(file).filter((i) => (drafts || !i.isDraft) && !i.isArchived)
    : [];
}
const items = (target: Target, lang: Lang) => {
  const entry = byTarget.get(target);
  return entry ? itemsOf(entry.c.slug, lang) : [];
};
const F = (target: Target) => byTarget.get(target)?.fields ?? {};
const get = (item: WfItem, field?: string) => (field ? item.fieldData[field] : undefined);

const docs: Doc[] = [];
const issues: Issue[] = [];
const redirects: { source: string; destination: string }[] = [];
const issue = (id: string, kind: string, detail: string) => issues.push({ id, kind, detail });

const translations = new Map<string, { type: string; ids: Partial<Record<Lang, string>> }>();
function linkTranslation(type: string, sourceKey: string, lang: Lang, id: string) {
  const entry = translations.get(`${type}:${sourceKey}`) ?? { type, ids: {} };
  entry.ids[lang] = id;
  translations.set(`${type}:${sourceKey}`, entry);
}
const oldTags = new Map<string, readonly ["category" | "tag", string]>();

/* Slugs: keep Webflow's where they are already URL-safe (so old URLs keep
   working), clean them up where they are not, and never allow duplicates
   within one type + language. */
const seen = new Set<string>();
function slugFor(type: string, lang: Lang, raw: string | undefined, fallback: string, id: string) {
  // Any lowercase a–z/0–9/hyphen slug is already a valid URL: keep it as-is
  // (triple hyphens and long slugs included) so the live URL doesn't change.
  let slug = raw && /^[a-z0-9]+(-+[a-z0-9]+)*$/.test(raw) ? raw : slugify(raw || fallback);
  if (raw && slug !== raw) issue(id, "slug-cleaned", `${raw} → ${slug}`);
  let n = 2;
  const base = slug;
  while (seen.has(`${type}:${lang}:${slug}`)) slug = `${base}-${n++}`;
  if (slug !== base) issue(id, "slug-duplicate", `${base} → ${slug}`);
  seen.add(`${type}:${lang}:${slug}`);
  return slug;
}
const slugObj = (current: string) => ({ _type: "slug", current });
const ref = (id: string, weak = false) => ({
  _type: "reference",
  _ref: id,
  ...(weak ? { _weak: true } : {}),
});
const refArray = (ids: string[], seed: string) =>
  ids.map((id) => ({ ...ref(id), _key: key(seed, id) }));
/* Plain-text fields with line breaks → paragraphs, for the rich text converter. */
const paragraphs = (v?: string) =>
  v
    ?.split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/<(?![a-z/])/gi, "&lt;")}</p>`)
    .join("");
const date = (item: WfItem, field?: string) =>
  text(get(item, field)) ?? item.lastPublished ?? item.createdOn;

function duration(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  const s = text(v);
  if (!s) return undefined;
  const parts = s.match(/\d+/g)?.map(Number);
  if (!parts?.length) return undefined;
  if (/min/i.test(s) && parts.length === 1) return parts[0] * 60;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

const episodeNumber = (v: unknown) => Number(String(v ?? "").match(/\d+/)?.[0] ?? 0);
/* Episodes store a bare Spotify id; the site plays it with Spotify's embed. */
const spotifyUrl = (v?: string) =>
  v && /^[A-Za-z0-9]{22}$/.test(v) ? `https://open.spotify.com/episode/${v}` : v;

function fileAsset(v: unknown) {
  const url = typeof v === "string" ? v : (v as { url?: string } | undefined)?.url;
  return url ? { _type: "file", _sanityAsset: `file@${url}` } : undefined;
}

/* ---- Taxonomy (from the re-categorization sheet) --------------------- */

interface SheetRow {
  item_id: string;
  slug: string;
  nouvelle_categorie: string;
  tags: string;
  format: string;
  serie: string;
  ancien_tag: string;
  ancienne_categorie: string;
}
const sheetFile = join(RAW, "sheets", "nouvelle-taxonomie.json");
if (!exists(sheetFile)) {
  console.error(
    "No re-categorization sheet in the snapshot (raw/sheets/nouvelle-taxonomie.json). Put it in .migration/csv/ and run migrate:csv.",
  );
  process.exit(1);
}
const sheet = new Map(readJson<SheetRow[]>(sheetFile).map((r) => [r.item_id, r]));
/* Sheet values that mean “no section” / “don't import this article”. */
const NO_SECTION = new Set(["", "La Converse (hors rubriques)"]);
const REMOVE = "À retirer";
const split = (v: string) =>
  v
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean);
const byCount = (values: string[]) => {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .map(([v]) => v);
};
const rows = [...sheet.values()];
/* Menu order of the sections; any other sheet value follows, by count. */
const SECTION_ORDER = [
  "Démocratie & pouvoir",
  "Société",
  "Migrations",
  "Quartiers",
  "Monde",
  "Que du love",
  "Solutions",
];
const rank = (v: string) => (SECTION_ORDER.includes(v) ? SECTION_ORDER.indexOf(v) : Infinity);
const sections = byCount(
  rows.map((r) => r.nouvelle_categorie).filter((v) => !NO_SECTION.has(v) && v !== REMOVE),
).sort((a, b) => rank(a) - rank(b));
const topics = byCount(rows.flatMap((r) => split(r.tags))).sort((a, b) => a.localeCompare(b, "fr"));
const series = byCount([
  ...rows.map((r) => r.serie).filter(Boolean),
  ...Object.values(VIDEO_SERIES),
]);
const formatValue = new Map<string, string>(FORMATS.map((f) => [f.fr, f.value]));

/* Sections, topics and series are one document for both languages, with
   `{ fr, en }` fields (scripts/merge-locales/lib.ts). The English side is
   filled in from the translation memory further down. */
const taxonomyId = (type: string, title: string) => `${type}-${slugify(title)}`;
function taxonomyDoc(type: "category" | "tag" | "series", title: string, order?: number) {
  const id = taxonomyId(type, title);
  docs.push(
    compact({
      _id: id,
      _type: type,
      title: { _type: "localeString", [PRIMARY]: title },
      slug: { [PRIMARY]: slugObj(slugFor(type, PRIMARY, undefined, title, id)) },
      order,
    }),
  );
}
sections.forEach((t, i) => taxonomyDoc("category", t, i));
topics.forEach((t) => taxonomyDoc("tag", t));
series.forEach((t) => taxonomyDoc("series", t));
for (const r of rows) {
  if (r.format && !formatValue.has(r.format))
    issue(`article-${r.item_id}-${PRIMARY}`, "unknown-format", r.format);
}

/* The old /tag/<slug> pages go to the section most of their articles moved
   to (or the topic page when most of them have no section). */
for (const old of new Set(rows.map((r) => r.ancien_tag).filter(Boolean))) {
  const moved = rows.filter((r) => r.ancien_tag === old && r.nouvelle_categorie !== REMOVE);
  const [section] = byCount(moved.map((r) => r.nouvelle_categorie));
  const [topic] = byCount(moved.flatMap((r) => split(r.tags)));
  const target =
    section && !NO_SECTION.has(section)
      ? (["category", section] as const)
      : topic
        ? (["tag", topic] as const)
        : null;
  if (target) oldTags.set(old, target);
}

/* ---- People (one document for both languages) ------------------------- */

const personIds = new Set<string>();
const personSlug = new Map<string, string>();
/* Webflow ids of photographers / illustrators who are also in People. */
const personAlias = new Map<string, string>();
{
  const f = F("person");
  // Draft people come too: some are still credited on published stories.
  const people = (l: Lang) => itemsOf(byTarget.get("person")?.c.slug ?? "people", l, true);
  const byLang = Object.fromEntries(
    LANGS.map((l) => [l, new Map(people(l).map((i) => [i.id, i]))]),
  );
  const peopleBySlug = new Map<string, string>();
  const add = (item: WfItem, f: Record<string, string | undefined>, fromPeople: boolean) => {
    const id = `person-${item.id}`;
    personIds.add(id);
    const loc = (field?: string, fallback?: (v: unknown) => string | undefined) =>
      compact(
        Object.fromEntries(
          LANGS.map((l) => {
            const v = get(byLang[l]?.get(item.id) ?? item, field);
            const plain =
              typeof v === "string" && /<\/?[a-z]/i.test(v)
                ? htmlToText(v, true)
                : text(v)
                    ?.replace(/[\u200B-\u200D\uFEFF]/g, "")
                    .trim();
            return [l, plain || fallback?.(get(item, f.occupation))];
          }),
        ) as Record<string, unknown>,
      );
    const role = loc(f.role, (occ) => OCCUPATIONS[text(occ) ?? ""]);
    const bio = loc(f.bio);
    const oldSlug = item.fieldData.slug ?? "";
    const slug = slugFor("person", PRIMARY, oldSlug, item.fieldData.name ?? item.id, id);
    personSlug.set(item.id, slug);
    if (fromPeople)
      [slug, slugify(item.fieldData.name ?? "")].forEach((x) => peopleBySlug.set(x, id));
    if (oldSlug && oldSlug !== slug) {
      redirects.push({
        source: `/people/${encodeURI(oldSlug)}`,
        destination: href("fr", "author", slug),
      });
      redirects.push({
        source: `/en/people/${encodeURI(oldSlug)}`,
        destination: href("en", "author", slug),
      });
    }
    const team = f.team ? Boolean(get(item, f.team)) : undefined;
    docs.push(
      compact({
        _id: id,
        _type: "person",
        name: text(item.fieldData.name) ?? "Unnamed",
        slug: slugObj(slug),
        image: figure(image(get(item, f.image)), item.fieldData.name),
        role: Object.keys(role).length ? { _type: "localeString", ...role } : undefined,
        bio: Object.keys(bio).length ? { _type: "localeText", ...bio } : undefined,
        email: text(get(item, f.email)),
        group: team ? "team" : undefined,
        order: get(item, f.order) as number | undefined,
        webflowId: item.id,
      }),
    );
  };
  for (const item of people(PRIMARY)) add(item, f, true);
  for (const { c, fields } of contributors) {
    for (const item of itemsOf(c.slug, PRIMARY)) {
      const same =
        peopleBySlug.get(item.fieldData.slug ?? "") ??
        peopleBySlug.get(slugify(item.fieldData.name ?? ""));
      if (same) personAlias.set(item.id, same);
      else add(item, fields, false);
    }
  }
}

const authorRefs = (item: WfItem, field: string | undefined, id: string) =>
  refs(get(item, field)).flatMap((wf) => {
    const target = personAlias.get(wf) ?? `person-${wf}`;
    if (!personIds.has(target)) issue(id, "missing-author", wf);
    return personIds.has(target) ? [target] : [];
  });

const untranslated: Record<string, number> = {};
/* Webflow serves the primary-locale value for any field not translated.
   Those still become documents (so every /en URL keeps resolving); they are
   only counted, so the report shows how much English is really French. */
function countFallback(type: string, item: WfItem, lang: Lang, bodyField?: string) {
  if (lang === PRIMARY) return;
  const primary = items(type === "article" ? "article" : (type as Target), PRIMARY).find(
    (x) => x.id === item.id,
  );
  if (
    primary &&
    primary.fieldData.name === item.fieldData.name &&
    get(primary, bodyField) === get(item, bodyField)
  ) {
    untranslated[type] = (untranslated[type] ?? 0) + 1;
  }
}

for (const lang of LANGS) {
  const f = F("article");
  const articleFields = byTarget.get("article")?.c.fields ?? [];
  /* Webflow articles are split into “Post Body #1–3”, each optionally
     followed by a “CTA Box #n”. They become one body, with the visible boxes
     as call-out blocks in place. A collection with a single body field just
     takes the first branch. */
  const parts = articleFields
    .map((x) => x.slug.match(/^post-body-(\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number)
    .sort((a, b) => a - b);
  for (const item of items("article", lang)) {
    const id = `article-${item.id}-${lang}`;
    const row = sheet.get(item.id);
    if (!row) issue(id, "not-in-taxonomy-sheet", item.fieldData.name ?? "");
    if (row?.nouvelle_categorie === REMOVE) {
      issue(id, "removed-by-taxonomy", `${item.fieldData.name} (marked “${REMOVE}”; not imported)`);
      continue;
    }
    const body = {
      blocks: [] as Record<string, unknown>[],
      issues: [] as { kind: string; detail: string }[],
    };
    for (const n of parts.length ? parts : [0]) {
      const part = htmlToPortableText(
        text(get(item, parts.length ? `post-body-${n}` : f.body)),
        `${id}-${n}`,
      );
      body.issues.push(...part.issues);
      body.blocks.push(...(part.blocks ?? []));
      const visible = get(item, `cta-box-${n}-visibility`);
      const html = text(get(item, `cta-box-${n}-body`));
      if (visible === true && html) {
        const label = text(get(item, `cta-box-${n}-button-text`));
        const url = text(get(item, `cta-box-${n}-button-link`));
        body.blocks.push(
          compact({
            _type: "callout",
            _key: key(id, "callout", String(n)),
            body: restrictBlocks(htmlToPortableText(html, `${id}-cta-${n}`).blocks, true),
            cta:
              label && url
                ? {
                    _type: "cta",
                    label,
                    url: url.replace(/^https?:\/\/(www\.)?laconverse\.com/, "") || "/",
                  }
                : undefined,
          }),
        );
      } else if (visible === true && !html)
        issue(id, "callout-empty", `CTA box #${n} is visible but empty`);
    }
    body.issues.forEach((x) => issue(id, `richtext-${x.kind}`, x.detail));
    const note = restrictBlocks(
      htmlToPortableText(text(get(item, f.authorsNote)), `${id}-note`).blocks,
      false,
    );
    const img = image(get(item, f.image));
    const main = figure(img, text(get(item, f.imageAlt)));
    if (main && text(get(item, f.imageCaption)))
      (main as Record<string, unknown>).caption = text(get(item, f.imageCaption));
    if (!main) issue(id, "no-image", item.fieldData.name ?? "");
    const section =
      row && !NO_SECTION.has(row.nouvelle_categorie) ? row.nouvelle_categorie : undefined;
    const listen = get(item, f.listen);
    countFallback("article", item, lang, f.body);
    linkTranslation("article", item.id, lang, id);
    docs.push(
      compact({
        _id: id,
        _type: "article",
        language: lang,
        title: text(item.fieldData.name) ?? "Untitled",
        slug: slugObj(
          slugFor("article", lang, item.fieldData.slug, item.fieldData.name ?? item.id, id),
        ),
        dek: htmlToText(text(get(item, f.dek))),
        image: main,
        category: section ? ref(taxonomyId("category", section)) : undefined,
        tags: refArray(
          split(row?.tags ?? "").map((t) => taxonomyId("tag", t)),
          `${id}-tags`,
        ),
        series: row?.serie ? ref(taxonomyId("series", row.serie)) : undefined,
        authors: refArray(
          [...new Set([...authorRefs(item, f.authors, id), ...authorRefs(item, f.coAuthors, id)])],
          id,
        ),
        photographers: refArray(authorRefs(item, f.photographers, id), `${id}-ph`),
        illustrators: refArray(authorRefs(item, f.illustrators, id), `${id}-il`),
        authorsNote: note,
        trending: get(item, f.trending) === true || undefined,
        localJournalismInitiative: get(item, f.lji) === true || undefined,
        format: formatValue.get(row?.format ?? ""),
        publishedAt: date(item, f.date),
        listen: typeof listen === "object" ? fileAsset(listen) : undefined,
        body: body.blocks.length ? body.blocks : undefined,
        seo:
          text(get(item, f.seoTitle)) || text(get(item, f.seoDescription))
            ? compact({
                _type: "seo",
                title: text(get(item, f.seoTitle)),
                description: text(get(item, f.seoDescription)),
              })
            : undefined,
        webflowId: item.id,
      }),
    );
    const oldSlug = item.fieldData.slug;
    const newSlug = (docs.at(-1)!.slug as { current: string }).current;
    if (oldSlug && oldSlug !== newSlug)
      redirects.push({
        source: `${lang === "fr" ? "" : "/en"}/articles/${encodeURI(oldSlug)}`,
        destination: href(lang, "article", newSlug),
      });
  }

  const v = F("video");
  for (const item of items("video", lang)) {
    const id = `video-${item.id}-${lang}`;
    const body = htmlToPortableText(paragraphs(text(get(item, v.body))), id);
    body.issues.forEach((x) => issue(id, `richtext-${x.kind}`, x.detail));
    const link = get(item, v.videoUrl);
    // Some embed-link cells carry stray quotes; keep the URL itself.
    const videoUrl = (
      typeof link === "string" ? link : (link as { url?: string } | undefined)?.url
    )?.match(/https?:\/\/[^\s"']+/)?.[0];
    const seriesName = VIDEO_SERIES[text(get(item, v.series)) ?? ""];
    const file = fileAsset(get(item, v.file));
    if (!videoUrl && !file) issue(id, "no-video", item.fieldData.name ?? "");
    countFallback("video", item, lang, v.body);
    linkTranslation("video", item.id, lang, id);
    docs.push(
      compact({
        _id: id,
        _type: "video",
        language: lang,
        title: text(item.fieldData.name) ?? "Untitled",
        slug: slugObj(
          slugFor("video", lang, item.fieldData.slug, item.fieldData.name ?? item.id, id),
        ),
        poster: figure(image(get(item, v.poster))),
        videoUrl,
        file,
        duration: duration(get(item, v.duration)),
        series: seriesName ? ref(taxonomyId("series", seriesName)) : undefined,
        authors: refArray(authorRefs(item, v.authors, id), id),
        publishedAt: date(item, v.date),
        body: body.blocks,
        webflowId: item.id,
      }),
    );
  }

  const p = F("podcast");
  const e = F("episode");
  const episodes = items("episode", lang);
  items("podcast", lang).forEach((item, i) => {
    const id = `podcast-${item.id}-${lang}`;
    const eps = episodes
      .filter((ep) => refs(get(ep, e.series)).includes(item.id))
      .sort(
        (a, b) =>
          episodeNumber(get(a, e.number)) - episodeNumber(get(b, e.number)) ||
          String(date(a, e.date)).localeCompare(String(date(b, e.date))),
      );
    const credits = htmlLists(text(get(item, p.credits)));
    linkTranslation("podcast", item.id, lang, id);
    docs.push(
      compact({
        _id: id,
        _type: "podcast",
        language: lang,
        title: text(item.fieldData.name) ?? "Untitled",
        slug: slugObj(
          slugFor("podcast", lang, item.fieldData.slug, item.fieldData.name ?? item.id, id),
        ),
        cover: figure(image(get(item, p.cover))),
        image: p.image ? figure(image(get(item, p.image))) : undefined,
        description: htmlToText(text(get(item, p.description)), true),
        intro: htmlToText(text(get(item, p.intro)), true),
        // Credits are free text in Webflow; each paragraph becomes one line,
        // split on the first colon or line break into role / names.
        credits: credits.paragraphs.map((line, n) => {
          const [role, ...rest] = line.split(/:\s*|\n/);
          return {
            _type: "credit",
            _key: key(id, "credit", String(n)),
            role: rest.length ? role.trim() : "",
            names: (rest.join(" ") || role).trim(),
          };
        }),
        note: htmlToText(text(get(item, p.note))),
        order: (get(item, p.order) as number | undefined) ?? i,
        seo: text(get(item, p.seoDescription))
          ? { _type: "seo", description: text(get(item, p.seoDescription)) }
          : undefined,
        episodes: eps.map((ep) => {
          const audio = get(ep, e.audio);
          const link = get(ep, e.audioUrl);
          return compact({
            _type: "episode",
            _key: key(ep.id),
            title: text(ep.fieldData.name) ?? "Untitled",
            description: htmlToText(text(get(ep, e.description))),
            audio: audio && typeof audio === "object" ? fileAsset(audio) : undefined,
            audioUrl: spotifyUrl(
              typeof link === "string" ? link : (link as { url?: string } | undefined)?.url,
            ),
            duration: duration(get(ep, e.duration)),
            publishedAt: text(date(ep, e.date))?.slice(0, 10),
          });
        }),
        webflowId: item.id,
      }),
    );
  });

  const pos = F("position");
  items("position", lang).forEach((item, i) => {
    const id = `position-${item.id}-${lang}`;
    const body = htmlLists(text(get(item, pos.body)));
    const profile = htmlLists(text(get(item, pos.profile)));
    linkTranslation("position", item.id, lang, id);
    docs.push(
      compact({
        _id: id,
        _type: "position",
        language: lang,
        title: text(item.fieldData.name) ?? "Untitled",
        slug: slugObj(
          slugFor("position", lang, item.fieldData.slug, item.fieldData.name ?? item.id, id),
        ),
        meta: pos.meta
          ? text(get(item, pos.meta))
          : [pos.location, pos.schedule, pos.duration, pos.salary]
              .map((x) => text(get(item, x)))
              .filter(Boolean)
              .join(" · ") || undefined,
        summary: htmlToText(text(get(item, pos.summary))) ?? body.paragraphs[0],
        // Each field may hold several lists under sub-headings; they are joined.
        responsibilities: pos.profile ? body.lists.flat() : body.lists[0],
        profile: pos.profile ? profile.lists.flat() : body.lists[1],
        open: true,
        order: (get(item, pos.order) as number | undefined) ?? i,
      }),
    );
    if (!body.lists.length)
      issue(id, "position-no-lists", "Responsibilities / profile need filling in by hand.");
  });
}

/* ---- English from the translation memory ------------------------------ */

/* Webflow has no English content, so each French document gets an English
   twin once every string in it is in the memory (translation.ts). Anything
   still missing is listed in out/to-translate.en.json for translate.ts. */
const memory = loadMemory();
const pending = new Map<string, { type: string; title: string; strings: string[] }>();
const peopleRoles = new Set<string>();
if (!LANGS.includes("en")) {
  const translatedTypes = ["article", "video", "podcast", "position"];
  const english = new Set<string>();
  const toEn = (id: string) => id.replace(/-fr$/, "-en");
  /* References to French documents point at their English twin, or are
     dropped when the twin doesn't exist (yet). */
  const relink = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(relink).filter((v) => v !== undefined);
    if (!value || typeof value !== "object") return value;
    const o = value as Record<string, unknown>;
    if (typeof o._ref === "string" && o._ref.endsWith("-fr"))
      return english.has(toEn(o._ref)) ? { ...o, _ref: toEn(o._ref) } : undefined;
    return Object.fromEntries(
      Object.entries(o)
        .map(([k, v]) => [k, relink(v)])
        .filter(([, v]) => v !== undefined),
    );
  };
  const skip = new Set(["_id", "language", "slug", "webflowId"]);
  for (const type of translatedTypes) {
    for (const fr of docs.filter((d) => d._type === type && d.language === "fr")) {
      const copy = Object.fromEntries(Object.entries(fr).filter(([k]) => !skip.has(k)));
      const { doc, missing } = localize(copy, memory);
      if (!doc) {
        pending.set(fr._id, { type, title: String(fr.title), strings: [...new Set(missing)] });
        continue;
      }
      const id = toEn(fr._id);
      const title = String(doc.title);
      const slug = slugFor(type, "en", undefined, title, id);
      english.add(id);
      docs.push(
        compact({
          ...(relink(doc) as Record<string, unknown>),
          _id: id,
          _type: type,
          language: "en",
          slug: slugObj(slug),
          machineTranslated: true,
          webflowId: fr.webflowId,
        }) as Doc,
      );
      const source = [...translations.entries()].find(([, t]) => t.ids.fr === fr._id)?.[0];
      if (source) linkTranslation(type, source.split(":").slice(1).join(":"), "en", id);
      // The live site served the French slug under /en; send it to the new one.
      const frSlug = (fr.slug as { current: string }).current;
      if (type === "article" && frSlug !== slug)
        redirects.push({
          source: `/en/articles/${encodeURI(frSlug)}`,
          destination: href("en", "article", slug),
        });
    }
  }
  /* Sections, topics and series are shared: their title gets an English
     value, and an English slug made from it. */
  for (const d of docs.filter((x) => ["category", "tag", "series"].includes(x._type))) {
    const title = d.title as { fr: string; en?: string };
    const slug = d.slug as Record<string, { current: string }>;
    const en = memory.get(title.fr.trim());
    if (!en) {
      pending.set(d._id, { type: d._type, title: title.fr, strings: [title.fr.trim()] });
      continue;
    }
    title.en = en;
    slug.en = slugObj(slugFor(d._type, "en", undefined, en, d._id));
  }
  /* People are shared: only role and bio get an English value. */
  for (const d of docs.filter((x) => x._type === "person")) {
    for (const field of ["role", "bio"] as const) {
      const value = d[field] as { fr?: string; en?: string } | undefined;
      if (!value?.fr || value.en) continue;
      const en = memory.get(value.fr.trim());
      if (en) value.en = en;
      else peopleRoles.add(value.fr.trim());
    }
  }
}

/* Old /tag/<slug> URLs → the section or topic that replaced them. */
for (const [old, [type, title]] of oldTags) {
  const route = type === "category" ? "category" : "tag";
  for (const lang of ["fr", "en"] as Lang[]) {
    const doc = docs.find((d) => d._id === taxonomyId(type, title));
    const slug = (doc?.slug as Record<string, { current: string }> | undefined)?.[lang];
    if (slug)
      redirects.push({
        source: `${lang === "fr" ? "" : "/en"}/tag/${old}`,
        destination: href(lang, route, slug.current),
      });
  }
}

for (const [wfKey, { type, ids }] of translations) {
  const langs = Object.keys(ids) as Lang[];
  if (langs.length < 2) continue;
  docs.push({
    _id: `translation-metadata-${type}-${wfKey.split(":")[1]}`,
    _type: "translation.metadata",
    schemaTypes: [type],
    translations: langs.map((l) => ({
      _key: l,
      _type: "internationalizedArrayReferenceValue",
      language: l,
      value: { _type: "reference", _ref: ids[l], _weak: true },
    })),
  });
}

/* ---- Reference check --------------------------------------------------- */

const ids = new Set(docs.map((d) => d._id));
function walkRefs(value: unknown, owner: string) {
  if (Array.isArray(value)) value.forEach((v) => walkRefs(v, owner));
  else if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o._ref === "string" && !o._weak && !ids.has(o._ref))
      issue(owner, "dangling-reference", o._ref);
    Object.values(o).forEach((v) => walkRefs(v, owner));
  }
}
docs.forEach((d) => walkRefs(d, d._id));

/* ---- Seed: singleton pages + programs from the design copy ------------- */

const seed: Doc[] = [];
const personBySlug = new Map(
  docs
    .filter((d) => d._type === "person")
    .map((d) => [(d.slug as { current: string }).current, d._id]),
);
const peopleRefs = (people: { slug: string; name: string }[], seedKey: string) =>
  people.flatMap((p) => {
    const id = personBySlug.get(p.slug) ?? personBySlug.get(slugify(p.name));
    return id ? [{ ...ref(id), _key: key(seedKey, id) }] : [];
  });
const withKeys = <T extends object>(list: T[] | undefined, seedKey: string) =>
  list?.map((x, n) => ({ ...x, _key: key(seedKey, String(n)) }));

/* The pages are built per language from the fixtures, then merged into one
   bilingual document each (scripts/merge-locales/lib.ts). */
const pages: Record<string, Partial<Record<Lang, Doc>>> = {};
const page = (lang: Lang, doc: Doc) => ((pages[doc._type] ??= {})[lang] = doc);

for (const lang of ["fr", "en"] as Lang[]) {
  const settings = fx.settings(lang);
  page(
    lang,
    compact({
      _id: `siteSettings-${lang}`,
      _type: "siteSettings",
      language: lang,
      email: settings.email,
      socials: withKeys(
        settings.socials.map((s) => ({ _type: "social", ...s })),
        `soc-${lang}`,
      ),
      seo: { _type: "seo", ...settings.seo },
    }),
  );
  page(lang, { _id: `homePage-${lang}`, _type: "homePage", language: lang });
  const about = fx.about(lang);
  page(
    lang,
    compact({
      _id: `aboutPage-${lang}`,
      _type: "aboutPage",
      language: lang,
      title: about.title ?? undefined,
      intro: about.intro ?? undefined,
      team: peopleRefs(about.team, `team-${lang}`),
      collaborators: peopleRefs(about.collaborators, `collab-${lang}`),
      sections: withKeys(
        about.sections.map(({ _key, ...rest }) => ({ _type: "section", ...rest })),
        `sec-${lang}`,
      ),
    }),
  );
  const programs = fx.programs(lang).map((p) => {
    const full = fx.program(lang, p.slug)!;
    return compact({
      _id: `program-${p.slug}-${lang}`,
      _type: "program",
      language: lang,
      title: full.title,
      slug: slugObj(full.slug),
      tagline: full.tagline ?? undefined,
      body: full.body ?? undefined,
      cta: full.cta ? { _type: "cta", ...full.cta } : undefined,
      quote: full.quote ? compact({ ...full.quote, image: undefined }) : undefined,
      form: full.form ?? undefined,
      linkTo: full.linkTo ?? "self",
      order: fx.programs(lang).indexOf(p),
    });
  });
  seed.push(...programs);
  const releve = fx.laReleve(lang);
  page(
    lang,
    compact({
      _id: `laRelevePage-${lang}`,
      _type: "laRelevePage",
      language: lang,
      title: releve.title ?? undefined,
      intro: releve.intro ?? undefined,
      cta: releve.cta ? { _type: "cta", ...releve.cta } : undefined,
      programs: programs.map((p) => ({ ...ref(p._id), _key: key(p._id) })),
    }),
  );
  const gi = fx.getInvolved(lang);
  const card = (c: (typeof gi.cards)[number], n: number, s: string) =>
    compact({
      _type: "card",
      _key: key(s, String(n)),
      title: c.title ?? undefined,
      text: c.text ?? undefined,
      cta: c.cta ? { _type: "cta", ...c.cta } : undefined,
      ctaStyle: c.ctaStyle ?? undefined,
    });
  page(
    lang,
    compact({
      _id: `getInvolvedPage-${lang}`,
      _type: "getInvolvedPage",
      language: lang,
      title: gi.title ?? undefined,
      intro: gi.intro ?? undefined,
      cards: gi.cards.map((c, n) => card(c, n, `gi-${lang}`)),
      cardsAfter: gi.cardsAfter.map((c, n) => card(c, n, `gia-${lang}`)),
      donate: gi.donate
        ? {
            ...gi.donate,
            options: withKeys(
              gi.donate.options.map((o) => ({ _type: "cta", ...o })),
              `don-${lang}`,
            ),
          }
        : undefined,
      volunteer: gi.volunteer
        ? {
            ...gi.volunteer,
            items: withKeys(
              gi.volunteer.items.map((it) => ({ _type: "item", ...it })),
              `vol-${lang}`,
            ),
          }
        : undefined,
    }),
  );
  const gyv = fx.giveYourVoice(lang);
  page(
    lang,
    compact({
      _id: `giveYourVoicePage-${lang}`,
      _type: "giveYourVoicePage",
      language: lang,
      title: gyv.title ?? undefined,
      intro: gyv.intro ?? undefined,
      openApplication: gyv.openApplication ?? undefined,
      culture: gyv.culture ? compact({ ...gyv.culture, image: undefined }) : undefined,
      apply: gyv.apply ?? undefined,
    }),
  );
  const contact = fx.contact(lang);
  page(
    lang,
    compact({
      _id: `contactPage-${lang}`,
      _type: "contactPage",
      language: lang,
      title: contact.title ?? undefined,
      subtitle: contact.subtitle ?? undefined,
      links: withKeys(
        contact.links.map((l) => ({
          _type: "contactLink",
          prompt: l.prompt,
          cta: { _type: "cta", ...l.cta },
        })),
        `ct-${lang}`,
      ),
    }),
  );
}
for (const [type, { fr, en }] of Object.entries(pages))
  seed.push(mergeDocs(singletonSpecs[type], type, fr, en));

/* ---- Write ------------------------------------------------------------- */

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "import.ndjson"), docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
writeFileSync(join(OUT, "seed.ndjson"), seed.map((d) => JSON.stringify(d)).join("\n") + "\n");
writeJson(join(process.cwd(), "src", "redirects.json"), redirects);
/* The English to-do list: every missing string, grouped by document. */
writeJson(join(OUT, "to-translate.en.json"), {
  documents: Object.fromEntries(pending),
  people: [...peopleRoles],
});

const counts: Record<string, number> = {};
for (const d of docs)
  counts[`${d._type}${d.language ? `.${d.language}` : ""}`] =
    (counts[`${d._type}${d.language ? `.${d.language}` : ""}`] ?? 0) + 1;
const issueCounts: Record<string, number> = {};
for (const i of issues) issueCounts[i.kind] = (issueCounts[i.kind] ?? 0) + 1;
const source = readJson<Record<string, Record<string, number>>>(join(RAW, "summary.json"));

const englishPending: Record<string, number> = {};
for (const p of pending.values()) englishPending[p.type] = (englishPending[p.type] ?? 0) + 1;
writeJson(join(OUT, "report.json"), {
  source,
  counts,
  untranslatedEnglish: untranslated,
  englishPending,
  issueCounts,
  fields: fieldReport,
  redirects: redirects.length,
  issues,
});

console.table(counts);
console.log("Webflow source:", source);
console.log("EN items that are really FR fallbacks:", untranslated);
console.log(
  `Waiting on English translation (${memory.size} strings in memory):`,
  englishPending,
  peopleRoles.size ? `+ ${peopleRoles.size} people roles/bios` : "",
);
console.log("Issues:", issueCounts);
console.log(
  `\nWrote ${docs.length} documents, ${seed.length} seed documents, ${redirects.length} redirects. See .migration/out/report.json`,
);
