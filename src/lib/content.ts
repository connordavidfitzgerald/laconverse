/* Every read the site makes. Each function runs a GROQ query when a Sanity
   project is configured and falls back to the fixtures otherwise, returning
   the same shape either way. Article, author and topic pages render on demand
   in a long-lived function, so identical queries are only shared while in
   flight — a warm function must never serve a result from an earlier request. */
import { t, type Lang } from "../i18n";
import { client } from "./sanity";
import { getZeffyTotals } from "./zeffy";
import * as fx from "./fixtures";
import type {
  AboutData,
  Article,
  ArticleCard,
  Category,
  ContactData,
  DonateData,
  StudioData,
  TaxonomyPage,
  GiveYourVoiceData,
  HomeData,
  IndexEntry,
  EcoleData,
  PartnerStory,
  Person,
  Podcast,
  PodcastCard,
  Position,
  Program,
  Settings,
  Video,
  VideoCard,
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
/* Every document holds both languages, with `{ fr, en }` fields:
   `title[$lang]` picks this page's side. An article, video, podcast, program
   or position is on the site in each language it has a slug in (PUB). */
const PUB = `defined(slug[$lang].current)`;
const SLUG = `"slug": slug[$lang].current`;
const TAX = `{ "title": title[$lang], "slug": slug[$lang].current }`;
const CTA = (path = "cta") => `${path}{ "label": label[$lang], "url": url[$lang] }`;
const SEO = (path = "seo") =>
  `${path}{ "title": title[$lang], "description": description[$lang], image ${IMG} }`;
/* An article has one section; the site's card shape takes a list. */
const REF_CAT = `"categories": select(defined(category) => [category->${TAX}], [])`;
const REF_TAGS = `"tags": coalesce(tags[]->${TAX}, [])`;
const REF_AUTH = `"authors": coalesce(authors[]->{ name, "slug": slug.current }, [])`;
const PERSON = `{ name, "slug": slug.current, image ${IMG}, "role": role[$lang], "bio": bio[$lang], email }`;
const BODY = `"body": body[$lang][]{ ..., _type == "figure" => ${IMG}, _type == "audio" => { ..., "src": file.asset->url } }`;
const RICH = (field: string) => `${field}[$lang][]{ ..., _type == "figure" => ${IMG} }`;
/* The languages the document is published in, for the language switch. */
const TRANSLATIONS = `"translations": [{ "language": "fr", "slug": slug.fr.current }, { "language": "en", "slug": slug.en.current }][defined(slug)]`;

const ARTICLE_CARD = `{ _id, "title": title[$lang], ${SLUG}, "dek": dek[$lang], publishedAt, image ${IMG}, ${REF_CAT}, ${REF_TAGS}, ${REF_AUTH} }`;
/* Videos show in both languages: a side that hasn't been written yet falls
   back to the other one ("lang" says which the text is in). */
const VPUB = `(defined(slug.fr.current) || defined(slug.en.current))`;
const VIDEO_CARD = `{
  _id, "title": coalesce(title[$lang], title.fr, title.en),
  "slug": coalesce(slug[$lang].current, slug.fr.current, slug.en.current),
  "lang": select(defined(title[$lang]) => $lang, defined(title.fr) => "fr", "en"),
  poster ${IMG}, duration, publishedAt, kind, ${REF_CAT}
}`;
const PODCAST_CARD = `{ _id, "title": title[$lang], ${SLUG}, cover ${IMG}, "description": description[$lang], "episodeCount": count(episodes) }`;
const PROGRAM_CARD = `{ _id, "title": title[$lang], ${SLUG}, image ${IMG}, linkTo }`;
const PARTNER_STORY = `{ _id, "title": title[$lang], url, image ${IMG}, partner, partnerLogo ${IMG}, publishedAt }`;
const POSITION = `{ _id, "title": title[$lang], ${SLUG}, "meta": meta[$lang], "summary": summary[$lang], "responsibilities": coalesce(responsibilities[$lang], []), "profile": coalesce(profile[$lang], []), ${TRANSLATIONS} }`;

const ARTICLES = `*[_type == "article" && ${PUB}] | order(publishedAt desc)`;
/* This language's articles that reference the document in scope. */
const REFERRING = `*[_type == "article" && ${PUB} && references(^._id)]`;

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
      "count": count(${REFERRING})
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
      "lead": select(defined(page.lead->slug[$lang].current) => page.lead->${ARTICLE_CARD}, latest[0]),
      "topStories": select(
        count((page.topStories[]->)[${PUB}]) > 0 => (page.topStories[]->)[${PUB}]${ARTICLE_CARD},
        latest[1...7]
      ),
      "ecole": page.ecole{
        "title": title[$lang], "text": text[$lang], image ${IMG}
      },
      "seo": ${SEO("page.seo")},
      "videos": *[_type == "video" && ${VPUB}] | order(publishedAt desc)[0...8] ${VIDEO_CARD},
      "podcasts": *[_type == "podcast" && ${PUB}] | order(order asc)[0...8] ${PODCAST_CARD},
      "partnerStories": *[_type == "partnerStory" && defined(title[$lang])] | order(publishedAt desc)[0...8] ${PARTNER_STORY},
      "categories": *[_type == "category" && defined(slug[$lang].current)] | order(order asc){
        ...${TAX}, "count": count(${REFERRING})
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
    `*[_type == "article" && slug[$lang].current == $slug][0]{
      _id, "title": title[$lang], ${SLUG}, "dek": dek[$lang], publishedAt, image ${IMG}, ${REF_CAT}, ${REF_TAGS}, ${REF_AUTH},
      ${BODY}, "seo": ${SEO()}, ${TRANSLATIONS},
      "listen": listen[$lang].asset->url,
      trending, localJournalismInitiative, format,
      "machineTranslated": machineTranslated == $lang,
      "series": series->${TAX},
      "authorsNote": authorsNote[$lang],
      "storyPrompt": storyPrompt[$lang],
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
    i: imageUrl(a.image, 800, 450),
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
  "total": count(${REFERRING}),
  "articles": ${REFERRING} | order(publishedAt desc)[0...12] ${ARTICLE_CARD}
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
      "count": count(${REFERRING})
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
      "total": count(${REFERRING}),
      "articles": ${REFERRING} | order(publishedAt desc)[0...12] ${ARTICLE_CARD}
    }`,
    { lang, slug },
    () => fx.author(lang, slug),
  );

/* ---- Videos ------------------------------------------------------------- */

/* Every video as a card (the video index), newest first. */
export const getVideoCards = (lang: Lang) =>
  load<VideoCard[]>(
    `*[_type == "video" && ${VPUB}] | order(publishedAt desc) ${VIDEO_CARD}`,
    { lang },
    () => fx.videos(lang),
  );

export const getVideos = (lang: Lang) =>
  load<Video[]>(
    `*[_type == "video" && ${VPUB}] | order(publishedAt desc){
      ...${VIDEO_CARD}, "playbackId": mux.asset->playbackId, "src": file.asset->url, videoUrl,
      "body": coalesce(body[$lang], body.fr, body.en)[]{ ..., _type == "figure" => ${IMG} },
      "authorsFull": coalesce(authors[]->${PERSON}, []), ${TRANSLATIONS}, "seo": ${SEO()}
    }`,
    { lang },
    () => fx.videos(lang),
  );

/* ---- Podcasts ----------------------------------------------------------- */

export const getPodcasts = (lang: Lang) =>
  load<PodcastCard[]>(
    `*[_type == "podcast" && ${PUB}] | order(order asc, title[$lang] asc) ${PODCAST_CARD}`,
    { lang },
    () => fx.podcasts(lang),
  );

export const getPodcast = (lang: Lang, slug: string) =>
  load<Podcast | null>(
    `*[_type == "podcast" && slug[$lang].current == $slug][0]{
      ...${PODCAST_CARD}, image ${IMG}, "intro": intro[$lang], "note": note[$lang], "seo": ${SEO()}, ${TRANSLATIONS},
      "episodes": coalesce(episodes[]{ _key, "title": coalesce(title[$lang], title.fr, title.en), "description": description[$lang], duration, publishedAt, "src": coalesce(audio.asset->url, audioUrl) }, []),
      "credits": coalesce(credits[]{ "role": coalesce(role[$lang], role.fr, role.en), names }, [])
    }`,
    { lang, slug },
    () => fx.podcast(lang, slug),
  );

/* ---- École Converse / programs ----------------------------------------- */

/* École Converse is the page the programs hang off, not one of them: its old
   program document (from the La Relève days) is skipped everywhere. */
const ECOLE_SLUG = "ecole-converse";
const IS_PROGRAM = `_type == "program" && ${PUB} && slug.fr.current != "${ECOLE_SLUG}"`;

/* The singleton keeps its La Relève-era ID so existing content carries over. */
export const getEcole = (lang: Lang) =>
  load<EcoleData>(
    `{
      "page": *[_id == "laRelevePage"][0]
    }{
      "title": page.title[$lang], "kicker": page.kicker[$lang], "image": page.image ${IMG}, "intro": page.${RICH("intro")},
      "cta": ${CTA("page.cta")}, "seo": ${SEO("page.seo")},
      "why": page.why{ "title": title[$lang], "body": ${RICH("body")}, image ${IMG}, "aside": ${RICH("aside")} },
      "approach": page.approach{ "title": title[$lang], "body": ${RICH("body")}, image ${IMG} },
      "stats": coalesce(page.stats[defined(value) && defined(label[$lang])]{ value, "label": label[$lang] }, []),
      "steps": coalesce(page.steps[defined(title[$lang])]{ "title": title[$lang], "text": text[$lang] }, []),
      "programs": select(
        count((page.programs[]->)[${IS_PROGRAM}]) > 0 => (page.programs[]->)[${IS_PROGRAM}]${PROGRAM_CARD},
        *[${IS_PROGRAM}] | order(order asc) ${PROGRAM_CARD}
      ),
      "cohorts": coalesce(page.cohorts[defined(year) && defined(track[$lang])]{ year, "track": track[$lang], count } | order(year desc), []),
      "support": page.support{
        "title": title[$lang], "body": ${RICH("body")},
        "ctas": coalesce(ctas[defined(url[$lang])]${CTA("")}, []),
        "partners": coalesce(partners[]{ name, url, logo ${IMG} }, [])
      },
      "form": select(defined(page.form.title[$lang]) => page.form{ "title": title[$lang], "text": text[$lang] })
    }`,
    { lang },
    () => fx.ecole(lang),
  );

/* Only programs that link to their own page have one. */
export const getProgramSlugs = (lang: Lang) =>
  load<string[]>(
    `*[${IS_PROGRAM} && coalesce(linkTo, "self") == "self"]{ ${SLUG} }.slug`,
    { lang },
    () =>
      fx
        .programs(lang)
        .filter((p) => (p.linkTo ?? "self") === "self")
        .map((p) => p.slug),
  );

/* A program page's fields; the filter picks the program. */
const PROGRAM = `{
      ...${PROGRAM_CARD}, "tagline": tagline[$lang], ${BODY}, "cta": ${CTA()}, "seo": ${SEO()}, ${TRANSLATIONS},
      "form": select(defined(form.title[$lang]) || defined(form.text[$lang]) => form{ "title": title[$lang], "text": text[$lang] }),
      quote { image ${IMG}, "text": text[$lang], attribution, "source": source[$lang] },
      "video": select(defined(video.url) => video{ "title": title[$lang], "text": text[$lang], url, moreUrl, "moreLabel": moreLabel[$lang] }),
      "about": ${RICH("about")},
      "articles": select(defined(series) => *[_type == "article" && ${PUB} && series._ref == ^.series._ref] | order(publishedAt desc)[0...3] ${ARTICLE_CARD}, []),
      "musicVideos": coalesce(musicVideos[defined(url)]{
        _key, "title": coalesce(title[$lang], title.fr), year, url, "text": text[$lang],
        "artists": coalesce(artists[$lang], artists.fr), "mentor": coalesce(mentor[$lang], mentor.fr), poster ${IMG}
      }, []),
      "podcasts": coalesce((podcasts[]->)[${PUB}]${PODCAST_CARD}, []),
      "alumni": coalesce(alumni[]->${PERSON}, []),
      support
    }`;

export const getProgram = (lang: Lang, slug: string) =>
  load<Program | null>(
    `*[${IS_PROGRAM} && slug[$lang].current == $slug && coalesce(linkTo, "self") == "self"][0]${PROGRAM}`,
    { lang, slug },
    () => {
      const program = fx.program(lang, slug);
      return (program?.linkTo ?? "self") === "self" ? program : null;
    },
  );

/* The program whose card leads to the podcasts index, which shows its page.
   Its chosen podcasts come first, in its order, then every other published
   podcast, so none is left unreachable. Without such a program the index
   still lists them all. */
export const getPodcastsProgram = async (lang: Lang): Promise<Program> => {
  const [program, all] = await Promise.all([
    load<Program | null>(
      `*[${IS_PROGRAM} && linkTo == "podcasts"][0]${PROGRAM}`,
      { lang },
      () => fx.program(lang, "podcasts"),
    ),
    getPodcasts(lang),
  ]);
  const chosen = program?.podcasts ?? [];
  const ids = new Set(chosen.map((p) => p._id));
  const podcasts = [...chosen, ...all.filter((p) => !ids.has(p._id))];
  if (program) return { ...program, podcasts };
  return {
    _id: "podcasts",
    title: t(lang).podcasts,
    slug: "podcasts",
    linkTo: "podcasts",
    articles: [],
    musicVideos: [],
    podcasts,
    alumni: [],
    translations: [],
  };
};

/* ---- Pages -------------------------------------------------------------- */

export const getAbout = (lang: Lang) =>
  load<AboutData>(
    `*[_id == "aboutPage"][0]{
      "title": title[$lang], image ${IMG}, "intro": ${RICH("intro")}, "seo": ${SEO()},
      "statements": coalesce(statements[defined(text[$lang])]{ _key, "text": text[$lang], "cta": ${CTA()} }, []),
      principlesImage ${IMG},
      "principles": coalesce(principles[defined(title[$lang])]{ _key, "title": title[$lang], "body": ${RICH("body")} }, []),
      "valuesTitle": valuesTitle[$lang],
      "values": coalesce(values[defined(title[$lang])]{ _key, "title": title[$lang], "text": text[$lang] }, []),
      "team": coalesce(team[]->${PERSON}, []),
      "collaborators": coalesce(collaborators[]->${PERSON}, []),
      "sections": coalesce(sections[defined(title[$lang])]{
        _key, "title": title[$lang], kind, "body": ${RICH("body")},
        "articles": select(kind == "series" => *[_type == "article" && ${PUB} && series._ref == ^.series._ref] | order(publishedAt desc) ${ARTICLE_CARD}),
        "positions": select(kind == "positions" => *[_type == "position" && ${PUB} && open != false] | order(order asc) ${POSITION})
      }, []),
      "partners": coalesce(partners[]{ name, url, logo ${IMG} }, [])
    }`,
    { lang },
    () => fx.about(lang),
  ).then((d) => d ?? fx.about(lang));

export const getDonate = (lang: Lang) =>
  load<DonateData | null>(
    `*[_id == "donatePage"][0]{
      "title": title[$lang], image ${IMG}, "intro": ${RICH("intro")}, "seo": ${SEO()},
      "support": support{ "title": title[$lang], "text": text[$lang] },
      "sections": coalesce(sections[defined(label[$lang])]{ _key, "label": label[$lang], "body": ${RICH("body")} }, []),
      "zeffyForms": coalesce(zeffyForms{ monthly, annually, once }, {}),
      "zeffyUrl": coalesce(zeffyUrl, *[_id == "siteSettings"][0].donateUrl),
      goal, "presets": { "monthly": coalesce(presets.monthly, []), "annually": coalesce(presets.annually, []), "once": coalesce(presets.once, []) }
    }`,
    { lang },
    () => fx.donate(lang),
  )
    .then((d) => d ?? fx.donate(lang))
    .then(async (d) => {
      const f = d.zeffyForms ?? {};
      const zeffy = await getZeffyTotals([f.monthly, f.annually, f.once, d.zeffyUrl], d.goal);
      return zeffy ? { ...d, raised: zeffy.raised, goal: zeffy.goal } : d;
    });

export const getStudio = (lang: Lang) =>
  load<StudioData | null>(
    `*[_id == "studioPage"][0]{
      "title": title[$lang], image ${IMG}, "kicker": kicker[$lang], "intro": intro[$lang], "seo": ${SEO()},
      "studios": coalesce(studios[defined(name[$lang])]{ _key, "name": name[$lang], "text": text[$lang], image ${IMG}, bookUrl }, [])
    }`,
    { lang },
    () => fx.studio(lang),
  ).then((d) => d ?? fx.studio(lang));

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
      "positions": *[_type == "position" && ${PUB} && open != false] | order(order asc) ${POSITION}
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
    `*[_type == "partnerStory" && defined(title[$lang])] | order(publishedAt desc)[0...8] ${PARTNER_STORY}`,
    { lang },
    () => fx.home(lang).partnerStories,
  );

export type { Position };
