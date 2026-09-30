/* Every read the site makes. Each function runs a GROQ query when a Sanity
   project is configured and falls back to the fixtures otherwise, returning
   the same shape either way. Article, author and topic pages render on demand
   in a long-lived function, so identical queries are only shared while in
   flight — a warm function must never serve a result from an earlier request. */
import type { Lang } from "../i18n";
import { client } from "./sanity";
import * as fx from "./fixtures";
import type {
  AboutData,
  Article,
  ArticleCard,
  Category,
  ContactData,
  TaxonomyPage,
  GetInvolvedData,
  GiveYourVoiceData,
  HomeData,
  IndexEntry,
  LaReleveData,
  PartnerStory,
  Person,
  Podcast,
  PodcastCard,
  Position,
  Program,
  Settings,
  Video,
} from "./types";
import { imageUrl } from "./sanity";

const inflight = new Map<string, Promise<unknown>>();

function load<T>(query: string, params: Record<string, unknown>, fallback: () => T): Promise<T> {
  if (!client) return Promise.resolve(fallback());
  const key = query + JSON.stringify(params);
  if (!inflight.has(key))
    inflight.set(
      key,
      client.fetch<T>(query, params).finally(() => inflight.delete(key)),
    );
  return inflight.get(key) as Promise<T>;
}

/* ---- Projections -------------------------------------------------------- */

const IMG = `{ ..., "asset": asset->{ _id, url, metadata { dimensions, lqip } } }`;
/* Sections, topics, series and the page singletons are one document for both
   languages, with `{ fr, en }` fields: `title[$lang]` picks this page's side. */
const TAX = `{ "title": title[$lang], "slug": slug[$lang].current }`;
const CTA = (path = "cta") => `${path}{ "label": label[$lang], "url": url[$lang] }`;
const SEO = (path = "seo") =>
  `${path}{ "title": title[$lang], "description": description[$lang], image ${IMG} }`;
/* An article has one section; the site's card shape takes a list. */
const REF_CAT = `"categories": select(defined(category) => [category->${TAX}], [])`;
const REF_TAGS = `"tags": coalesce(tags[]->${TAX}, [])`;
const REF_AUTH = `"authors": coalesce(authors[]->{ name, "slug": slug.current }, [])`;
const PERSON = `{ name, "slug": slug.current, image ${IMG}, "role": role[$lang], "bio": bio[$lang], email }`;
const BODY = `body[]{ ..., _type == "figure" => ${IMG}, _type == "audio" => { ..., "src": file.asset->url } }`;
const RICH = (field: string) => `${field}[$lang][]{ ..., _type == "figure" => ${IMG} }`;
const TRANSLATIONS = `"translations": coalesce(*[_type == "translation.metadata" && references(^._id)][0].translations[].value->{ language, "slug": slug.current }, [])`;

const ARTICLE_CARD = `{ _id, title, "slug": slug.current, dek, publishedAt, image ${IMG}, ${REF_CAT}, ${REF_TAGS}, ${REF_AUTH} }`;
const VIDEO_CARD = `{ _id, title, "slug": slug.current, poster ${IMG}, duration, publishedAt, ${REF_CAT} }`;
const PODCAST_CARD = `{ _id, title, "slug": slug.current, cover ${IMG}, description, "episodeCount": count(episodes) }`;
const PROGRAM_CARD = `{ _id, title, "slug": slug.current, image ${IMG}, linkTo }`;
const PARTNER_STORY = `{ _id, title, url, image ${IMG}, partner, partnerLogo ${IMG}, publishedAt }`;
const POSITION = `{ _id, title, "slug": slug.current, meta, summary, "responsibilities": coalesce(responsibilities, []), "profile": coalesce(profile, []), ${TRANSLATIONS} }`;

const ARTICLES = `*[_type == "article" && language == $lang && defined(slug.current)] | order(publishedAt desc)`;

/* ---- Global ------------------------------------------------------------- */

export const getSettings = (lang: Lang) =>
  load<Settings | null>(
    `*[_id == "siteSettings"][0]{
      "email": coalesce(email, "info@laconverse.com"), donateUrl, newsletterAction,
      "voicePrompt": voicePrompt[$lang],
      "socials": coalesce(socials[defined(url)]{ platform, url }, []),
      "menuCategories": coalesce(menuCategories[]->${TAX}, *[_type == "category"] | order(order asc)${TAX}),
      "seo": ${SEO()}
    }`,
    { lang },
    () => fx.settings(lang),
  ).then((s) => s ?? fx.settings(lang));

export const getCategories = (lang: Lang) =>
  load<(Category & { count: number })[]>(
    `*[_type == "category" && defined(slug[$lang].current)] | order(order asc){
      "title": title[$lang], "slug": slug[$lang].current, "description": description[$lang],
      "count": count(*[_type == "article" && language == $lang && references(^._id)])
    }`,
    { lang },
    () => fx.categories(lang),
  );

/* ---- Home --------------------------------------------------------------- */

export const getHome = (lang: Lang) =>
  load<HomeData>(
    `{
      "page": *[_id == "homePage"][0],
      "latest": ${ARTICLES}[0...8] ${ARTICLE_CARD}
    }{
      "lead": coalesce(page.lead[$lang]->${ARTICLE_CARD}, latest[0]),
      "topStories": select(
        count(page.topStories[$lang]) > 0 => page.topStories[$lang][]->${ARTICLE_CARD},
        latest[1...7]
      ),
      "support": page.support{ "title": title[$lang], "text": text[$lang], "cta": ${CTA()} },
      "ecole": page.ecole{
        "title": title[$lang], "text": text[$lang], image ${IMG},
        "program": program[$lang]->{ "slug": slug.current }
      },
      "seo": ${SEO("page.seo")},
      "videos": *[_type == "video" && language == $lang && defined(slug.current)] | order(publishedAt desc)[0...8] ${VIDEO_CARD},
      "podcasts": *[_type == "podcast" && language == $lang && defined(slug.current)] | order(order asc)[0...8] ${PODCAST_CARD},
      "partnerStories": *[_type == "partnerStory" && language == $lang] | order(publishedAt desc)[0...8] ${PARTNER_STORY},
      "categories": *[_type == "category" && defined(slug[$lang].current)] | order(order asc){
        ...${TAX}, "count": count(*[_type == "article" && language == $lang && references(^._id)])
      }
    }`,
    { lang },
    () => fx.home(lang),
  );

/* ---- Articles ----------------------------------------------------------- */

export const getArticleCount = (lang: Lang) =>
  load<number>(`count(${ARTICLES})`, { lang }, () => fx.articles(lang).length);

export const getArticle = (lang: Lang, slug: string) =>
  load<Article | null>(
    `*[_type == "article" && language == $lang && slug.current == $slug][0]{
      _id, title, "slug": slug.current, dek, publishedAt, image ${IMG}, ${REF_CAT}, ${REF_TAGS}, ${REF_AUTH},
      ${BODY}, seo { ..., image ${IMG} }, ${TRANSLATIONS},
      "listen": listen.asset->url,
      trending, localJournalismInitiative, format, machineTranslated,
      "series": series->${TAX},
      "authorsNote": authorsNote,
      "photographers": coalesce(photographers[]->{ name, "slug": slug.current }, []),
      "illustrators": coalesce(illustrators[]->{ name, "slug": slug.current }, []),
      "authorsFull": coalesce(authors[]->${PERSON}, [])
    }`,
    { lang, slug },
    () => fx.article(lang, slug),
  );

export const getRelated = (lang: Lang, article: Article) =>
  load<ArticleCard[]>(
    `${ARTICLES}[_id != $id && (category->slug[$lang].current in $cats || count((tags[]->slug[$lang].current)[@ in $tags]) > 0)][0...3] ${ARTICLE_CARD}`,
    {
      lang,
      id: article._id,
      cats: article.categories.map((c) => c.slug),
      tags: (article.tags ?? []).map((t) => t.slug),
    },
    () =>
      fx
        .articles(lang)
        .filter((a) => a._id !== article._id)
        .slice(0, 3),
  );

export const getLatest = (lang: Lang, count = 12) =>
  load<ArticleCard[]>(`${ARTICLES}[0...$count] ${ARTICLE_CARD}`, { lang, count }, () =>
    fx.articles(lang).slice(0, count),
  );

/** Every article as a compact card — the search page and "load more" read this. */
export async function getIndex(lang: Lang): Promise<IndexEntry[]> {
  const cards = await load<ArticleCard[]>(`${ARTICLES} ${ARTICLE_CARD}`, { lang }, () =>
    fx.articles(lang),
  );
  return cards.map((a) => ({
    id: a._id,
    t: a.title,
    s: a.slug,
    d: a.dek,
    p: a.publishedAt,
    i: imageUrl(a.image, 800, 600),
    c: a.categories,
    g: a.tags?.map((t) => t.slug),
    a: a.authors,
  }));
}

/* A section or topic page: this language's articles, plus both slugs so the
   language switch lands on the same page. */
const TAXONOMY_PAGE = `{
  "title": title[$lang], "slug": slug[$lang].current, "description": description[$lang],
  "alternates": { "fr": slug.fr.current, "en": slug.en.current },
  "total": count(*[_type == "article" && language == $lang && references(^._id)]),
  "articles": *[_type == "article" && language == $lang && references(^._id)] | order(publishedAt desc)[0...12] ${ARTICLE_CARD}
}`;

export const getCategory = (lang: Lang, slug: string) =>
  load<TaxonomyPage | null>(
    `*[_type == "category" && slug[$lang].current == $slug][0]${TAXONOMY_PAGE}`,
    { lang, slug },
    () => fx.category(lang, slug),
  );

export const getTags = (lang: Lang) =>
  load<(Category & { count: number })[]>(
    `*[_type == "tag" && defined(slug[$lang].current)]{
      "title": title[$lang], "slug": slug[$lang].current, "description": description[$lang],
      "count": count(*[_type == "article" && language == $lang && references(^._id)])
    } | order(title asc)`,
    { lang },
    () => [],
  );

export const getTag = (lang: Lang, slug: string) =>
  load<TaxonomyPage | null>(
    `*[_type == "tag" && slug[$lang].current == $slug][0]${TAXONOMY_PAGE}`,
    { lang, slug },
    () => null,
  );

/* ---- People ------------------------------------------------------------- */

export const getAuthor = (lang: Lang, slug: string) =>
  load<(Person & { total: number; articles: ArticleCard[] }) | null>(
    `*[_type == "person" && slug.current == $slug][0]{
      ...${PERSON},
      "total": count(*[_type == "article" && language == $lang && references(^._id)]),
      "articles": *[_type == "article" && language == $lang && references(^._id)] | order(publishedAt desc)[0...12] ${ARTICLE_CARD}
    }`,
    { lang, slug },
    () => fx.author(lang, slug),
  );

/* ---- Videos ------------------------------------------------------------- */

export const getVideos = (lang: Lang) =>
  load<Video[]>(
    `*[_type == "video" && language == $lang && defined(slug.current)] | order(publishedAt desc){
      ...${VIDEO_CARD}, "src": file.asset->url, videoUrl, ${BODY},
      "authorsFull": coalesce(authors[]->${PERSON}, []), ${TRANSLATIONS}, seo
    }`,
    { lang },
    () => fx.videos(lang),
  );

/* ---- Podcasts ----------------------------------------------------------- */

export const getPodcasts = (lang: Lang) =>
  load<PodcastCard[]>(
    `*[_type == "podcast" && language == $lang && defined(slug.current)] | order(order asc, title asc) ${PODCAST_CARD}`,
    { lang },
    () => fx.podcasts(lang),
  );

export const getPodcast = (lang: Lang, slug: string) =>
  load<Podcast | null>(
    `*[_type == "podcast" && language == $lang && slug.current == $slug][0]{
      ...${PODCAST_CARD}, image ${IMG}, intro, note, seo, ${TRANSLATIONS},
      "episodes": coalesce(episodes[]{ _key, title, description, duration, publishedAt, "src": coalesce(audio.asset->url, audioUrl) }, []),
      "credits": coalesce(credits[]{ role, names }, [])
    }`,
    { lang, slug },
    () => fx.podcast(lang, slug),
  );

/* ---- La Relève / programs ---------------------------------------------- */

export const getLaReleve = (lang: Lang) =>
  load<LaReleveData>(
    `{
      "page": *[_id == "laRelevePage"][0]
    }{
      "title": page.title[$lang], "intro": page.${RICH("intro")},
      "cta": ${CTA("page.cta")}, "seo": ${SEO("page.seo")},
      "programs": select(
        count(page.programs[$lang]) > 0 => page.programs[$lang][]->${PROGRAM_CARD},
        *[_type == "program" && language == $lang] | order(order asc) ${PROGRAM_CARD}
      )
    }`,
    { lang },
    () => fx.laReleve(lang),
  );

/* Only programs that link to their own page have one. */
export const getProgramSlugs = (lang: Lang) =>
  load<string[]>(
    `*[_type == "program" && language == $lang && defined(slug.current) && coalesce(linkTo, "self") == "self"].slug.current`,
    { lang },
    () =>
      fx
        .programs(lang)
        .filter((p) => (p.linkTo ?? "self") === "self")
        .map((p) => p.slug),
  );

export const getProgram = (lang: Lang, slug: string) =>
  load<Program | null>(
    `*[_type == "program" && language == $lang && slug.current == $slug && coalesce(linkTo, "self") == "self"][0]{
      ...${PROGRAM_CARD}, tagline, ${BODY}, cta, form, seo, ${TRANSLATIONS},
      quote { ..., image ${IMG} }
    }`,
    { lang, slug },
    () => {
      const program = fx.program(lang, slug);
      return (program?.linkTo ?? "self") === "self" ? program : null;
    },
  );

/* ---- Pages -------------------------------------------------------------- */

export const getAbout = (lang: Lang) =>
  load<AboutData>(
    `*[_id == "aboutPage"][0]{
      "title": title[$lang], image ${IMG}, "intro": ${RICH("intro")}, "seo": ${SEO()},
      "team": coalesce(team[]->${PERSON}, []),
      "collaborators": coalesce(collaborators[]->${PERSON}, []),
      "sections": coalesce(sections[]{ _key, "title": title[$lang], "body": ${RICH("body")} }, []),
      "partners": coalesce(partners[]{ name, url, logo ${IMG} }, [])
    }`,
    { lang },
    () => fx.about(lang),
  ).then((d) => d ?? fx.about(lang));

const CARD = `{ "title": title[$lang], "text": text[$lang], "cta": ${CTA()}, ctaStyle, image ${IMG} }`;

export const getGetInvolved = (lang: Lang) =>
  load<GetInvolvedData>(
    `*[_id == "getInvolvedPage"][0]{
      "title": title[$lang], "intro": intro[$lang], "seo": ${SEO()},
      "cards": coalesce(cards[]${CARD}, []),
      "cardsAfter": coalesce(cardsAfter[]${CARD}, []),
      donate {
        "title": title[$lang], "text": text[$lang],
        "options": coalesce(options[]{ _key, "label": label[$lang], "url": url[$lang] }, [])
      },
      volunteer {
        "title": title[$lang], "intro": intro[$lang], "cta": ${CTA()},
        "items": coalesce(items[]{ _key, "title": title[$lang], "text": text[$lang] }, [])
      }
    }`,
    { lang },
    () => fx.getInvolved(lang),
  ).then((d) => d ?? fx.getInvolved(lang));

export const getGiveYourVoice = (lang: Lang) =>
  load<GiveYourVoiceData>(
    `{
      "page": *[_id == "giveYourVoicePage"][0]
    }{
      "title": page.title[$lang], "intro": page.intro[$lang],
      "openApplication": page.openApplication{ "title": title[$lang], "text": text[$lang] },
      "apply": page.apply{ "title": title[$lang], "text": text[$lang] },
      "seo": ${SEO("page.seo")},
      "culture": page.culture{ "title": title[$lang], "text": text[$lang], image ${IMG} },
      "positions": *[_type == "position" && language == $lang && open != false] | order(order asc) ${POSITION}
    }`,
    { lang },
    () => fx.giveYourVoice(lang),
  );

export const getContact = (lang: Lang) =>
  load<ContactData>(
    `*[_id == "contactPage"][0]{
      "title": title[$lang], "subtitle": subtitle[$lang], "seo": ${SEO()},
      "links": coalesce(links[]{ _key, "prompt": prompt[$lang], "cta": ${CTA()} }, [])
    }`,
    { lang },
    () => fx.contact(lang),
  ).then((d) => d ?? fx.contact(lang));

export const getPartnerStories = (lang: Lang) =>
  load<PartnerStory[]>(
    `*[_type == "partnerStory" && language == $lang] | order(publishedAt desc)[0...8] ${PARTNER_STORY}`,
    { lang },
    () => fx.home(lang).partnerStories,
  );

export type { Position };
