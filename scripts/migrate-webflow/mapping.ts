/* Which Webflow collection becomes which Sanity type, and which Webflow field
 * feeds which Sanity field.
 *
 * The collection slugs come from the live site's URLs (laconverse.com/articles,
 * /people, …). Webflow's own taxonomies (tag, categorytag, video-tags) are
 * not imported: the re-categorization sheet replaces them (see transform.ts). Field slugs are *guessed* by name and type until the
 * snapshot exists — run `npm run migrate:inspect` and pin anything it gets
 * wrong in OVERRIDES below. */
import { findField, type WfCollection } from "./lib";

export type Target =
  "article" | "person" | "contributor" | "video" | "podcast" | "episode" | "position";

export const COLLECTIONS: Record<string, Target> = {
  articles: "article",
  people: "person",
  // Photo and illustration credits live in their own collections; they
  // become people too (merged with a People item of the same slug).
  photographers: "contributor",
  illustrators: "contributor",
  videos: "video",
  "balados-series": "podcast",
  "balados-episodes": "episode",
  carriere: "position",
};

/* Pin a field once `migrate:inspect` shows the guess is wrong, e.g.
 *   articles: { dek: "chapeau", image: "image-principale" }
 * Use `null` to force a field to be ignored. */
export const OVERRIDES: Record<string, Record<string, string | null>> = {
  people: { order: "equipe-page-custom-sort-order", occupation: "main-title-tag-occupation" },
  // Plain-text columns in the CSV, so the type-based guesses miss them.
  videos: { videoUrl: "youtube-video-embed-link", body: "description", series: "video-tag" },
  // The "short" description is the long one; the SEO line is the card blurb.
  "balados-series": {
    description: "seo-description",
    intro: "short-description",
    seoDescription: "seo-description",
  },
  "balados-episodes": { audioUrl: "spotify-episode-id" },
  carriere: {
    summary: "a-propos-de-loffre-demploi",
    profile: "competences-requises",
    location: "location",
    salary: "salaire",
    duration: "duree",
    schedule: "horaire",
    meta: null,
  },
};

/* Webflow video tags that are really series. */
export const VIDEO_SERIES: Record<string, string> = {
  "hood-heros": "Hood Heroes",
  "les-dialogues": "Dialogues",
  "mc-converse": "MC Converse",
  "culture-g": "Culture G",
};

/* “Main Title Tag / Occupation” option values → role labels (French). */
export const OCCUPATIONS: Record<string, string> = {
  journaliste: "Journaliste",
  "journaliste-junior": "Journaliste junior",
  collaborateur: "Collaborateur·rice",
  "ecole-converse": "École Converse",
  operations: "Opérations",
  leadership: "Direction",
};

type FieldMap = Record<string, string | undefined>;

const TEXT = ["PlainText"];
const RICH = ["RichText"];
const IMG = ["Image", "MultiImage"];
const REF = ["Reference", "MultiReference"];
const DATE = ["DateTime"];
const LINK = ["Link", "VideoLink"];
const FILE = ["File"];

/* `idToSlug` maps Webflow collection ids to their slugs, so a reference field
   is found by the collection it points at rather than by its name. */
function guess(c: WfCollection, target: Target, idToSlug: Record<string, string>): FieldMap {
  const f = (types: string[], names: string[] = [], exclude: string[] = []) =>
    findField(c, types, names, exclude)?.slug;
  const refTo = (collections: string[]) =>
    c.fields.find((x) => {
      const id = x.validations?.collectionId ?? "";
      // CSV snapshots name the target by slug until that collection is exported.
      return REF.includes(x.type) && collections.includes(idToSlug[id] ?? id);
    })?.slug;
  const refNamed = (names: string[]) => {
    for (const n of names) {
      const hit = c.fields.find(
        (x) => REF.includes(x.type) && (x.slug === n || x.slug.startsWith(n)),
      );
      if (hit) return hit.slug;
    }
  };

  switch (target) {
    case "article":
      return {
        dek: f(TEXT, [
          "post-summary",
          "resume",
          "summary",
          "excerpt",
          "chapeau",
          "sous-titre",
          "subtitle",
          "description",
          "intro",
          "extrait",
        ]),
        image: f(IMG, ["image-principale", "main-image", "image", "thumbnail", "cover", "photo"]),
        imageAlt: f(TEXT, ["alt", "image-alt", "texte-alternatif"]),
        imageCaption: f(TEXT, ["image-caption", "legende", "caption", "credit", "credit-photo"]),
        body: f(RICH, ["contenu", "content", "body", "post-body", "article", "texte"]),
        authors: refNamed(["main-author", "auteur", "author"]) ?? refTo(["people"]),
        coAuthors: refNamed(["multiple-authors", "co-auteurs", "authors"]),
        photographers: refNamed(["photographer", "photographe", "photo"]),
        illustrators: refNamed(["illustrator", "illustrateur", "illustratrice", "illustration"]),
        authorsNote: f(
          RICH,
          ["authors-note", "note", "transparency"],
          [f(RICH, ["contenu", "content", "body", "post-body", "article", "texte"]) ?? ""],
        ),
        trending: c.fields.find(
          (x) => x.type === "Switch" && /trending|tendance|populaire/.test(x.slug),
        )?.slug,
        lji: c.fields.find(
          (x) => x.type === "Switch" && /initiative|journalisme-local|lji/.test(x.slug),
        )?.slug,
        date: f(DATE, [
          "published-date",
          "date-de-publication",
          "publication-date",
          "published",
          "date",
        ]),
        listen: f([...FILE, ...LINK], ["audio", "ecouter", "listen", "podcast"]),
        seoTitle: f(TEXT, ["seo-headline", "meta-title", "seo-title", "titre-seo"]),
        seoDescription: f(TEXT, [
          "seo-summary",
          "meta-description",
          "seo-description",
          "description-seo",
        ]),
      };
    case "person":
    case "contributor":
      return {
        image: f(IMG, ["photo", "portrait", "image", "avatar", "picture"]),
        role: f(TEXT, ["role", "poste", "position", "titre", "title", "job", "fonction"]),
        bio: f([...TEXT, ...RICH], ["bio", "biographie", "description", "about", "a-propos"]),
        email: f(["Email", ...TEXT], ["email", "courriel"]),
        team: c.fields.find((x) => x.type === "Switch" && /equipe|team|staff|membre/.test(x.slug))
          ?.slug,
        alumni: c.fields.find((x) => x.type === "Switch" && /ancien|alumni/.test(x.slug))?.slug,
        order: f(["Number"], ["order", "ordre", "position"]),
      };
    case "video":
      return {
        poster: f(IMG, ["thumbnail", "miniature", "poster", "image", "cover"]),
        videoUrl: f(LINK, ["video", "youtube", "vimeo", "lien", "link", "url"]),
        file: f(FILE, ["video", "fichier", "file"]),
        duration: f([...TEXT, "Number"], ["duree", "duration", "length", "temps"]),
        authors: refTo(["people"]),
        body: f(RICH, ["contenu", "content", "description", "body", "texte"]),
        date: f(DATE, ["date"]),
      };
    case "podcast":
      return {
        cover: f(IMG, ["cover", "couverture", "pochette", "image", "thumbnail"]),
        image: f(
          IMG,
          ["hero", "header", "banniere", "photo"],
          [f(IMG, ["cover", "couverture", "pochette", "image", "thumbnail"]) ?? ""],
        ),
        description: f(TEXT, ["description", "resume", "summary", "short"]),
        intro: f(
          [...TEXT, ...RICH],
          ["intro", "description-longue", "long-description", "about"],
          [f(TEXT, ["description", "resume", "summary", "short"]) ?? ""],
        ),
        credits: f([...RICH, ...TEXT], ["credit", "generique"]),
        note: f([...TEXT, ...RICH], ["financement", "funding", "partenaire", "note"]),
        order: f(["Number"], ["order", "ordre"]),
      };
    case "episode":
      return {
        series: refTo(["balados-series"]),
        description: f([...TEXT, ...RICH], ["description", "resume", "summary"]),
        audio: f(FILE, ["audio", "mp3", "fichier"]),
        audioUrl: f(LINK, ["audio", "lien", "spotify", "apple", "soundcloud", "url", "link"]),
        duration: f([...TEXT, "Number"], ["duree", "duration", "length"]),
        number: f(["Number", ...TEXT], ["numero", "number", "episode", "ep"]),
        date: f(DATE, ["date"]),
      };
    case "position":
      return {
        meta: f(TEXT, ["type", "contrat", "lieu", "location", "statut"]),
        summary: f(TEXT, ["resume", "summary", "description", "intro"]),
        body: f(RICH, ["description", "contenu", "content", "body", "details"]),
        order: f(["Number"], ["order", "ordre"]),
      };
  }
}

export function resolveMapping(
  c: WfCollection,
  idToSlug: Record<string, string>,
): { target?: Target; fields: FieldMap } {
  const target = COLLECTIONS[c.slug];
  if (!target) return { fields: {} };
  const fields = guess(c, target, idToSlug);
  for (const [k, v] of Object.entries(OVERRIDES[c.slug] ?? {})) fields[k] = v ?? undefined;
  return { target, fields };
}
