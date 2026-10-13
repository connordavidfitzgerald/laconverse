/* Stand-in content, lifted from the Figma frames, served whenever no Sanity
   project is configured (see content.ts). Once the Webflow import has run the
   site never reads this file. Images are left empty on purpose — cards render
   their placeholder tone instead. */
import type { Lang } from "../i18n";
import type {
  AboutData,
  Article,
  ArticleCard,
  Category,
  ContactData,
  GetInvolvedData,
  GiveYourVoiceData,
  HomeData,
  EcoleData,
  Person,
  Podcast,
  PodcastCard,
  Program,
  ProgramCard,
  Settings,
  Video,
  RichText,
} from "./types";

type L<T> = Record<Lang, T>;

let k = 0;
const key = () => `k${(k++).toString(36)}`;
const p = (text: string, style = "normal") => ({
  _type: "block",
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: "span", _key: key(), text, marks: [] }],
});
const paras = (...texts: string[]): RichText => texts.map((t) => p(t)) as RichText;

/* ---- Categories --------------------------------------------------------- */

const CATS: { slug: L<string>; title: L<string> }[] = [
  {
    slug: { en: "democracy-power", fr: "democratie-pouvoir" },
    title: { en: "Democracy & Power", fr: "Démocratie & pouvoir" },
  },
  { slug: { en: "society", fr: "societe" }, title: { en: "Society", fr: "Société" } },
  { slug: { en: "migration", fr: "migrations" }, title: { en: "Migration", fr: "Migrations" } },
  {
    slug: { en: "neighbourhoods", fr: "quartiers" },
    title: { en: "Neighbourhoods", fr: "Quartiers" },
  },
  { slug: { en: "world", fr: "monde" }, title: { en: "World", fr: "Monde" } },
  {
    slug: { en: "nothing-but-love", fr: "que-du-love" },
    title: { en: "Nothing but Love", fr: "Que du love" },
  },
  { slug: { en: "solutions", fr: "solutions" }, title: { en: "Solutions", fr: "Solutions" } },
];
const cat = (i: number, lang: Lang) => ({ title: CATS[i].title[lang], slug: CATS[i].slug[lang] });

/* ---- People ------------------------------------------------------------- */

const PEOPLE: {
  name: string;
  slug: string;
  role: L<string>;
  bio?: L<string>;
  group: "team" | "collaborator";
}[] = [
  {
    name: "Lela Savić",
    slug: "lela-savic",
    role: { en: "Editor-in-chief", fr: "Rédactrice en chef" },
    group: "team",
  },
  {
    name: "Aya Boucenna",
    slug: "aya-boucenna",
    role: { en: "Video journalist", fr: "Journaliste vidéo" },
    group: "team",
  },
  {
    name: "Nouri Nesrouche",
    slug: "nouri-nesrouche",
    group: "team",
    role: { en: "Senior journalist", fr: "Journaliste sénior" },
    bio: {
      en: "Active in community and cultural development, Nouri draws on more than twenty years of journalism experience.",
      fr: "Actif dans le développement communautaire et culturel, Nouri s’appuie sur plus de vingt ans d’expérience en journalisme.",
    },
  },
  {
    name: "Labib Benslama",
    slug: "labib-benslama",
    role: { en: "Videographer", fr: "Vidéaste" },
    group: "team",
  },
  {
    name: "Nada Kheddiem",
    slug: "nada-kheddiem",
    role: { en: "Journalist", fr: "Journaliste" },
    group: "team",
  },
  {
    name: "María Gabriela Aguzzi",
    slug: "maria-gabriela-aguzzi",
    role: { en: "Freelance journalist", fr: "Journaliste pigiste" },
    group: "collaborator",
  },
  {
    name: "Pablo A. Ortiz",
    slug: "pablo-a-ortiz",
    role: { en: "Photographer", fr: "Photographe" },
    group: "collaborator",
  },
  {
    name: "Sonia Ekiyor-Katimi",
    slug: "sonia-ekiyor-katimi",
    role: { en: "Illustrator", fr: "Illustratrice" },
    group: "collaborator",
  },
];

export const people = (lang: Lang): Person[] =>
  PEOPLE.map((x) => ({
    name: x.name,
    slug: x.slug,
    role: x.role[lang],
    bio: x.bio?.[lang] ?? null,
    image: null,
  }));

const nouri = { name: "Nouri Nesrouche", slug: "nouri-nesrouche" };

/* ---- Articles ----------------------------------------------------------- */

const NOORAN_BODY: L<RichText> = {
  en: [
    p(
      "It was one year ago today that a 15-year-old boy was fatally shot by a Longueuil, Que., police officer responding to a 911 call reporting masked and armed individuals.",
    ),
    p(
      "Nooran Rezayi was with friends, sitting on the curb of a residential street in the Longueuil borough of Saint-Hubert, when officers arrived at the scene.",
    ),
    p("Nooran was shot and killed barely 10 seconds after police showed up."),
    p("He was unarmed."),
    p(
      "The shooting led to three separate investigations, but still the family is looking for answers as to what really happened on that day.",
    ),
    p("A demonstration in front of city hall", "h2"),
    p(
      "“There’s a lot of frustration,” said Fernando Belton, a lawyer representing the Rezayi family.",
    ),
    p(
      "On Monday evening, the family is holding a vigil in honour of Nooran and will walk from the local police station to the quiet street where their son was shot.",
    ),
    p("Many investigations but few answers", "h2"),
    p(
      "The Bureau des enquêtes indépendantes (BEI) was tasked with investigating the circumstances of Nooran’s death and the actions of police officers that day.",
    ),
    p(
      "It’s yet to be determined whether the police officer who shot and killed the teen will be charged.",
    ),
  ] as RichText,
  fr: [
    p(
      "Il y a un an jour pour jour, un garçon de 15 ans était abattu par un policier de Longueuil qui répondait à un appel au 911 signalant des individus masqués et armés.",
    ),
    p(
      "Nooran Rezayi était assis avec des amis sur le bord d’une rue résidentielle de Saint-Hubert lorsque les policiers sont arrivés sur les lieux.",
    ),
    p("Nooran a été tué à peine 10 secondes après l’arrivée de la police."),
    p("Il n’était pas armé."),
    p(
      "Trois enquêtes distinctes ont été ouvertes, mais la famille cherche toujours à comprendre ce qui s’est réellement passé ce jour-là.",
    ),
    p("Une manifestation devant l’hôtel de ville", "h2"),
    p("« Il y a beaucoup de frustration », affirme Fernando Belton, avocat de la famille Rezayi."),
    p(
      "Lundi soir, la famille tiendra une vigile en l’honneur de Nooran et marchera du poste de police jusqu’à la rue tranquille où leur fils a été abattu.",
    ),
    p("Beaucoup d’enquêtes, peu de réponses", "h2"),
    p(
      "Le Bureau des enquêtes indépendantes (BEI) a été chargé d’enquêter sur les circonstances de la mort de Nooran et sur les agissements des policiers ce jour-là.",
    ),
    p("Il reste à déterminer si le policier qui a abattu l’adolescent sera accusé."),
  ] as RichText,
};

const ARTS: { slug: L<string>; title: L<string>; dek?: L<string>; cat: number; date: string }[] = [
  {
    slug: {
      en: "montreal-adopts-amended-motion-on-gaza",
      fr: "montreal-adopte-une-motion-amendee-sur-gaza",
    },
    title: {
      en: "Montreal adopts amended motion on Gaza following a divisive debate",
      fr: "Montréal adopte une motion amendée sur Gaza après un débat qui divise",
    },
    dek: {
      en: "Projet Montréal’s tabled motion was ultimately adopted, but not without some significant amendments.",
      fr: "La motion déposée par Projet Montréal a finalement été adoptée, mais non sans amendements importants.",
    },
    cat: 0,
    date: "2026-09-24",
  },
  {
    slug: { en: "montreal-nord-post-39-scandal", fr: "montreal-nord-scandale-du-poste-39" },
    title: {
      en: "“We’ve been saying it for years” – In Montréal-Nord, the Post 39 scandal surprises no one",
      fr: "« On le dit depuis des années » – À Montréal-Nord, le scandale du poste 39 ne surprend personne",
    },
    cat: 0,
    date: "2026-09-20",
  },
  {
    slug: {
      en: "domestic-violence-beyond-the-bruises",
      fr: "violence-conjugale-au-dela-des-bleus",
    },
    title: {
      en: "Domestic violence – beyond the bruises, the fear of losing your children",
      fr: "Violence conjugale – au-delà des bleus, la peur de perdre ses enfants",
    },
    cat: 1,
    date: "2026-09-17",
  },
  {
    slug: {
      en: "liza-hammar-reframes-the-debate-on-the-veil",
      fr: "liza-hammar-recadre-le-debat-sur-le-voile",
    },
    title: {
      en: "Researcher Liza Hammar reframes the debate on the veil",
      fr: "La chercheuse Liza Hammar recadre le débat sur le voile",
    },
    cat: 5,
    date: "2026-09-12",
  },
  {
    slug: { en: "law-94-confusion-and-fear", fr: "loi-94-confusion-et-peur" },
    title: {
      en: "Law 94: Confusion and fear over inconsistent application",
      fr: "Loi 94 : confusion et peur face à une application incohérente",
    },
    cat: 2,
    date: "2026-09-08",
  },
  {
    slug: { en: "responses-to-police-racism", fr: "reponses-au-racisme-policier" },
    title: {
      en: "Why do responses to police racism struggle to take hold?",
      fr: "Pourquoi les réponses au racisme policier peinent-elles à s’imposer?",
    },
    cat: 0,
    date: "2026-09-02",
  },
  {
    slug: { en: "moose-cree-dictionary", fr: "dictionnaire-cri-de-moose" },
    title: {
      en: "New community-led dictionary helps endangered Moose Cree language thrive",
      fr: "Un dictionnaire communautaire aide la langue crie de Moose, menacée, à survivre",
    },
    cat: 5,
    date: "2026-08-28",
  },
  {
    slug: { en: "one-year-after-nooran-rezayis-death", fr: "un-an-apres-la-mort-de-nooran-rezayi" },
    title: {
      en: "One year after Nooran Rezayi’s death, family and friends demand answers",
      fr: "Un an après la mort de Nooran Rezayi, ses proches réclament des réponses",
    },
    cat: 0,
    date: "2026-08-25",
  },
];

const cardFor = (i: number, lang: Lang): ArticleCard => {
  const a = ARTS[i];
  return {
    _id: `article-${i}-${lang}`,
    title: a.title[lang],
    slug: a.slug[lang],
    dek: a.dek?.[lang] ?? null,
    publishedAt: `${a.date}T12:00:00Z`,
    image: null,
    categories: [cat(a.cat, lang)],
    authors: [nouri],
  };
};

/* Enough cards to exercise "load more". */
export const articles = (lang: Lang): ArticleCard[] =>
  Array.from({ length: 16 }, (_, n) => {
    const i = n % ARTS.length;
    const c = cardFor(i, lang);
    return n < ARTS.length ? c : { ...c, _id: `${c._id}-${n}`, slug: `${c.slug}-${n}` };
  });

export function article(lang: Lang, slug: string): Article | null {
  const card = articles(lang).find((a) => a.slug === slug);
  if (!card) return null;
  const i = ARTS.findIndex((a) => slug.startsWith(a.slug[lang]));
  const other: Lang = lang === "en" ? "fr" : "en";
  return {
    ...card,
    body: NOORAN_BODY[lang],
    storyPrompt:
      lang === "en"
        ? "Have you ever been racially profiled?"
        : "Avez-vous déjà été victime de profilage racial?",
    seo: null,
    translations: [{ language: other, slug: ARTS[i].slug[other] }],
    authorsFull: people(lang).filter((x) => x.slug === "nouri-nesrouche"),
  };
}

export const categories = (lang: Lang): (Category & { count: number })[] =>
  CATS.map((_, i) => ({
    ...cat(i, lang),
    description: null,
    count: articles(lang).filter((a) => a.categories[0].slug === cat(i, lang).slug).length,
  }));

export function category(lang: Lang, slug: string) {
  const c = categories(lang).find((x) => x.slug === slug);
  if (!c) return null;
  const list = articles(lang).filter((a) => a.categories.some((x) => x.slug === slug));
  return { ...c, total: list.length, articles: list.slice(0, 12) };
}

export function author(lang: Lang, slug: string) {
  const person = people(lang).find((x) => x.slug === slug);
  if (!person) return null;
  const list = articles(lang).filter((a) => a.authors.some((x) => x.slug === slug));
  return { ...person, total: list.length, articles: list.slice(0, 12) };
}

/* ---- Videos ------------------------------------------------------------- */

export const videos = (lang: Lang): Video[] =>
  [7, 5, 1, 2].map((i, n) => ({
    _id: `video-${n}-${lang}`,
    title: ARTS[i].title[lang],
    slug: ARTS[i].slug[lang],
    poster: null,
    duration: 94,
    publishedAt: `${ARTS[i].date}T12:00:00Z`,
    categories: [cat(ARTS[i].cat, lang)],
    src: null,
    videoUrl: null,
    body: NOORAN_BODY[lang],
    authorsFull: people(lang).filter((x) => x.slug === "nouri-nesrouche"),
    translations: [
      { language: lang === "en" ? "fr" : "en", slug: ARTS[i].slug[lang === "en" ? "fr" : "en"] },
    ],
    seo: null,
  }));

/* ---- Podcasts ----------------------------------------------------------- */

const PODS = [
  {
    slug: "ma-colere-et-moi",
    title: "Ma colère et moi",
    description: {
      en: "A four-episode podcast where Neelam, Fatima, Alexey and Matteo talk about anger, unfiltered.",
      fr: "Ma colère et moi, c’est un podcast de 4 épisodes animé par Neelam, Fatima, Alexey et Matteo qui jasent de cette émotion-là sans filtre.",
    },
    episodes: [
      {
        title: "L’homme ou l’ours?",
        description:
          "Dans ce premier épisode du balado Elle veut, elle veut, quatre jeunes journalistes — Melissa, Abigael, Razane et Malika — partent d’une question virale : « L’homme ou l’ours? »",
        duration: 1609,
      },
      {
        title: "Du primaire jusqu’à l’université",
        description:
          "Dans ce deuxième épisode, au tour des jeunes femmes de partager leurs expériences vécues à l’école et sur les réseaux sociaux.",
        duration: 2063,
      },
      {
        title: "Être supérieur(e)",
        description:
          "Les garçons prennent la parole pour ce 3e épisode, où ils partagent leurs perspectives sur la masculinité, examinent les stéréotypes et déconstruisent les attentes.",
        duration: 2496,
      },
      {
        title: "C’est quoi un vrai homme?",
        description:
          "Pour conclure la série, cet épisode cherche à comprendre ce qui se joue réellement derrière ces expériences — et pourquoi ces enjeux prennent aujourd’hui autant de place.",
        duration: 1695,
      },
    ],
  },
  {
    slug: "elle-veut-elle-veut",
    title: "Elle veut, elle veut",
    description: {
      en: "At the crossroads of media, social and cultural realities, Elle veut, elle veut explores the rise of masculinism and its impact on girls.",
      fr: "Au croisement des réalités médiatiques, sociales et culturelles, Elle veut, elle veut explore la montée du masculinisme et ses impacts sur les filles.",
    },
    episodes: [],
  },
  {
    slug: "pas-tout-montreal",
    title: "Pas tout Montréal",
    description: {
      en: "Is a racialized 16-year-old living in Montréal’s neighbourhoods allowed to dream?",
      fr: "Est-ce qu’on s’autorise à rêver quand on est un.e jeune « racisé.e » de 16 ans qui vit dans les quartiers montréalais?",
    },
    episodes: [],
  },
  {
    slug: "unboxed",
    title: "Unboxed",
    description: {
      en: "Hosted in English by Rena, Gheerti, Maiya and Charlie.",
      fr: "Animé en anglais par Rena, Gheerti, Maiya et Charlie.",
    },
    episodes: [],
  },
];

export const podcasts = (lang: Lang): PodcastCard[] =>
  PODS.map((x, i) => ({
    _id: `podcast-${i}-${lang}`,
    title: x.title,
    slug: x.slug,
    cover: null,
    description: x.description[lang],
    episodeCount: x.episodes.length || 12,
  }));

export function podcast(lang: Lang, slug: string): Podcast | null {
  const i = PODS.findIndex((x) => x.slug === slug);
  if (i < 0) return null;
  const x = PODS[i];
  return {
    ...podcasts(lang)[i],
    image: null,
    intro: x.description[lang],
    episodes: x.episodes.map((e, n) => ({ _key: `e${n}`, ...e, src: null, publishedAt: null })),
    credits: [
      { role: "Journalistes", names: "Melissa, Abigael, Razane et Malika" },
      { role: "Réalisation", names: "Lela Savić" },
      { role: "Montage et narration", names: "Nancy Pettinicchio" },
      { role: "Prise de son", names: "Paloma Daris" },
      { role: "Mixage", names: "Paloma Daris & Taylor Wilson" },
      { role: "Illustration", names: "Kassandra Duchesne" },
    ],
    note: "Ce projet a été réalisé grâce au soutien du ministère de la Culture et des Communications du Québec (MCCQ).",
    translations: [],
    seo: null,
  };
}

/* ---- Programs ----------------------------------------------------------- */

const PROGRAMS: (ProgramCard & { lang?: never })[] = [
  { _id: "program-journalism", title: "Journalism", slug: "journalism", image: null, linkTo: "self" },
  { _id: "program-podcasts", title: "Podcasts", slug: "podcasts", image: null, linkTo: "podcasts" },
  { _id: "program-mc", title: "MC Converse", slug: "mc-converse", image: null, linkTo: "self" },
];

export const programs = (lang: Lang): ProgramCard[] =>
  PROGRAMS.map((x) => ({
    ...x,
    title:
      lang === "fr" && x.slug === "podcasts"
        ? "Balados"
        : lang === "fr" && x.slug === "journalism"
          ? "Journalisme"
          : x.title,
  }));

export function program(lang: Lang, slug: string): Program | null {
  const card = programs(lang).find((x) => x.slug === slug);
  if (!card) return null;
  const base = {
    ...card,
    translations: [{ language: (lang === "en" ? "fr" : "en") as Lang, slug }],
    seo: null,
  };
  const apply = {
    label: lang === "en" ? "Apply for our next cohort" : "Postulez pour la prochaine cohorte",
    url: "#form",
  };
  if (slug === "mc-converse")
    return {
      ...base,
      tagline: lang === "en" ? "Rap is journalism." : "Le rap, c’est du journalisme.",
      body:
        lang === "en"
          ? paras(
              "MC Converse is the rap stream of École Converse. Each cohort brings together seven young people and a mentor artist — Raccoon in 2023, Meryem Saci in 2025 — to write a song and shoot a video.",
              "The workshops are built on sensitivity: participants draw on their own lives and their neighbourhoods to speak about realities mainstream media leave out. Rap becomes a space for dialogue and social change.",
            )
          : paras(
              "MC Converse est le volet rap de l’École Converse. Chaque cohorte réunit sept jeunes et un·e artiste mentor — Raccoon en 2023, Meryem Saci en 2025 — pour écrire une chanson et tourner un clip.",
              "Les ateliers misent sur la sensibilité : les participant·e·s puisent dans leur vécu et celui de leur quartier pour parler des réalités que les médias traditionnels laissent de côté. Le rap devient un espace de dialogue et de changement social.",
            ),
      cta: apply,
      quote: {
        image: null,
        text:
          lang === "en"
            ? "“I aim to pass on a passion for words and writing to those younger and less experienced than myself. Through writing workshops — something I’ve been doing for years in various contexts — I teach everything I’ve learned and mastered since I first got into rap.”"
            : "« Je veux transmettre la passion des mots et de l’écriture aux plus jeunes et aux moins expérimentés. À travers des ateliers d’écriture — ce que je fais depuis des années dans divers contextes — j’enseigne tout ce que j’ai appris et maîtrisé depuis mes débuts dans le rap. »",
        attribution: "— Raccoon",
        source:
          lang === "en"
            ? "(Shamyr Daléus-Louis in conversation with Melissa Haouari from La Converse)"
            : "(Shamyr Daléus-Louis en conversation avec Melissa Haouari de La Converse)",
      },
      video: {
        title: lang === "en" ? "Pioneers of journalistic rap" : "Les pionniers du rap journalistique",
        text:
          lang === "en"
            ? "Since 2020, La Converse has been giving under-represented communities the tools to tell their own stories — through journalism, podcasting and rap."
            : "Depuis 2020, La Converse outille les communautés invisibilisées pour qu’elles racontent leurs propres histoires — en journalisme, en balado et en rap.",
        url: "https://www.youtube.com/watch?v=JGBQ7N8UTNY",
        moreUrl: "https://www.youtube.com/playlist?list=PLqNdNoPxQBnb1cK649QXDhoDEo2FfQd5U",
        moreLabel: lang === "en" ? "See all MC Converse videos" : "Voir toutes les vidéos MC Converse",
      },
      articles: articles(lang).slice(0, 3),
      support: true,
      form: {
        title: lang === "en" ? "Join the next cohort" : "Rejoignez la prochaine cohorte",
        text:
          lang === "en"
            ? "Got something to say? Tell us about yourself."
            : "Vous avez quelque chose à dire ? Parlez-nous de vous.",
      },
    };
  return { ...base, tagline: null, body: null, cta: null, quote: null, articles: [], form: null };
}

/* ---- Singletons --------------------------------------------------------- */

export const settings = (lang: Lang): Settings => ({
  email: "info@laconverse.com",
  donateUrl: null,
  newsletterAction: null,
  // From the live Webflow site. The design also shows WhatsApp and Facebook;
  // add them in Site settings once the accounts are confirmed.
  socials: [
    { platform: "instagram", url: "https://www.instagram.com/conversecommunaute/" },
    { platform: "tiktok", url: "https://www.tiktok.com/@laconversemedia" },
    { platform: "linkedin", url: "https://www.linkedin.com/company/laconversemedia/" },
    { platform: "youtube", url: "https://www.youtube.com/channel/UCoygPvRVMFlixEecSAErqlw" },
  ],
  menuCategories: CATS.map((_, i) => cat(i, lang)),
  voicePrompt: null,
  seo: {
    title: "La Converse",
    description:
      lang === "en"
        ? "La Converse is an independent, non-profit news outlet in Montréal."
        : "La Converse est un média indépendant et sans but lucratif à Montréal.",
  },
});

export const home = (lang: Lang): HomeData => {
  const list = articles(lang);
  return {
    lead: list[0],
    topStories: list.slice(1, 7),
    videos: videos(lang),
    podcasts: podcasts(lang),
    partnerStories: [6, 7].map((i, n) => ({
      _id: `partner-${n}`,
      title: ARTS[i].title[lang],
      url: "https://example.com",
      image: null,
      partner: "Media partner",
      partnerLogo: null,
      publishedAt: ARTS[i].date,
    })),
    categories: categories(lang),
    support: null,
    ecole: null,
    seo: null,
  };
};

export const about = (lang: Lang): AboutData => ({
  title: lang === "en" ? "About" : "À propos",
  image: null,
  intro:
    lang === "en"
      ? paras(
          "La Converse is an independent, non-profit news outlet in Montréal. We believe in the power of a people-first approach rooted in listening, understanding, and respect.",
          "For us, transparent and fair news coverage means first and foremost that everyone’s stories are heard. In the service of our community, our reporting focuses not only on information, but also on proposing solutions and ideas to bridge the gaps in the issues we cover.",
        )
      : paras(
          "La Converse est un média indépendant et sans but lucratif à Montréal. Nous croyons en la force d’une approche humaine, ancrée dans l’écoute, la compréhension et le respect.",
          "Pour nous, une couverture transparente et juste signifie d’abord et avant tout que toutes les histoires soient entendues. Au service de notre communauté, nos reportages ne se limitent pas à informer : ils proposent aussi des pistes de solution pour combler les écarts dans les enjeux que nous couvrons.",
        ),
  team: people(lang).filter((_, i) => PEOPLE[i].group === "team"),
  collaborators: people(lang).filter((_, i) => PEOPLE[i].group === "collaborator"),
  sections: [
    {
      _key: "news",
      title: lang === "en" ? "News" : "Nouvelles",
      kind: "series",
      articles: articles(lang).slice(0, 3),
    },
    {
      _key: "careers",
      title: lang === "en" ? "Careers" : "Carrières",
      kind: "positions",
      positions: giveYourVoice(lang).positions,
    },
    {
      _key: "funding",
      title: lang === "en" ? "Funding" : "Financement",
      body: paras(lang === "en" ? "Content coming from the CMS." : "Contenu à venir du CMS."),
    },
  ],
  partners: [],
  seo: null,
});

export const ecole = (lang: Lang): EcoleData => {
  const en = lang === "en";
  return {
    title: "École Converse",
    image: null,
    kicker: en
      ? "A program combining training, sensitivity and community."
      : "Une école qui allie formation, sensibilité et communauté.",
    intro: en
      ? paras(
          "École Converse is a training program that brings communities into the conversation by training apprentice journalists to produce stories with the community, not just about it.",
          "With streams in journalism, podcasting and creative writing, the school pays its participants for their work and creativity. Afterwards, they can go on to join the La Converse newsroom.",
        )
      : paras(
          "L’École Converse est une école de formation qui inclut les communautés dans la réflexion en formant des apprenti·e·s journalistes à produire des reportages avec la communauté, et pas seulement à son sujet.",
          "Avec des volets en journalisme, en balado et en écriture créative, l’École Converse rémunère ses participant·e·s pour leur travail et leur créativité. Par la suite, ils et elles peuvent se joindre à la salle de presse de La Converse.",
        ),
    cta: {
      label: en ? "Apply for our next cohort" : "Postulez pour la prochaine cohorte",
      url: "#form",
    },
    why: {
      title: en ? "Why École Converse?" : "Pourquoi une École Converse?",
      body: en
        ? paras(
            "It all started with the desire to give overlooked communities the tools they need to reclaim their power in a media landscape where they are often silenced.",
            "With École Converse, we want to give power back to communities left out of the discussions that concern them, and a platform to tell their own stories. Through sensitivity-based training, the school prepares the next generation of journalists to serve and cover communities traditionally left out of important conversations.",
          )
        : paras(
            "Tout a commencé avec la volonté de donner aux communautés invisibilisées les outils dont elles ont besoin pour reprendre leur pouvoir dans un espace médiatique où elles sont souvent réduites au silence.",
            "Avec l’École Converse, nous voulons redonner du pouvoir aux communautés exclues des discussions qui les concernent, et leur offrir une plateforme pour raconter leurs propres histoires. Grâce à une formation axée sur la sensibilité, l’École Converse forme la relève journalistique à servir et à couvrir les communautés traditionnellement laissées à l’écart des grandes conversations.",
          ),
    },
    stats: en
      ? [
          { value: "8", label: "cohorts since 2021" },
          { value: "50+", label: "young people trained" },
          { value: "3", label: "streams: journalism, podcasting, creative writing" },
          { value: "100%", label: "of participants paid" },
        ]
      : [
          { value: "8", label: "cohortes depuis 2021" },
          { value: "50+", label: "jeunes formé·e·s" },
          { value: "3", label: "volets : journalisme, balado, écriture créative" },
          { value: "100%", label: "des participant·e·s rémunéré·e·s" },
        ],
    steps: en
      ? [
          {
            title: "Apply",
            text: "Tell us about yourself and the stories that matter in your community.",
          },
          {
            title: "Train, paid",
            text: "Join a cohort and learn through a series of hands-on workshops with mentors from the newsroom and the arts. Every participant is paid.",
          },
          {
            title: "Report with your community",
            text: "Produce reports, portraits, podcasts and creative projects with people largely unseen in mainstream media, published on La Converse.",
          },
          {
            title: "Join the newsroom",
            text: "After the program, participants can go on to join the La Converse newsroom.",
          },
        ]
      : [
          {
            title: "Postulez",
            text: "Parlez-nous de vous et des histoires qui comptent dans votre communauté.",
          },
          {
            title: "Formez-vous, rémunéré·e",
            text: "Joignez une cohorte et apprenez au fil d’ateliers pratiques avec des mentors de la salle de presse et du milieu artistique. Chaque participant·e est rémunéré·e.",
          },
          {
            title: "Racontez avec votre communauté",
            text: "Produisez des reportages, des portraits, des balados et des projets créatifs avec des personnes invisibles dans les médias traditionnels, publiés sur La Converse.",
          },
          {
            title: "Joignez la salle de presse",
            text: "Après le programme, les participant·e·s peuvent se joindre à la salle de presse de La Converse.",
          },
        ],
    programs: programs(lang),
    cohorts: (
      [
        [2025, "MC Converse", "MC Converse", 7],
        [2024, "Journalism", "Journalisme", 6],
        [2024, "MC Converse", "MC Converse", 4],
        [2024, "Podcasts", "Balados", 9],
        [2023, "MC Converse", "MC Converse", 7],
        [2023, "Podcasts", "Balados", 4],
        [2022, "Journalism", "Journalisme", 10],
        [2021, "Journalism", "Journalisme", 5],
      ] as const
    ).map(([year, trackEn, trackFr, count]) => ({ year, track: en ? trackEn : trackFr, count })),
    support: {
      title: en ? "Support École Converse" : "Soutenez l’École Converse",
      body: en
        ? paras(
            "Every participant at École Converse is paid for their work, so the school depends on the foundations, institutions and individuals who fund it. Your support goes directly to paying participants and mentors, and to producing the stories, podcasts and songs each cohort publishes.",
            "Past cohorts have produced the podcasts Pas tout Montréal and Ma colère et moi, the MC Converse rap song “Jamais trop tard” and reporting published on La Converse. To fund a cohort or propose a partnership, write to us.",
          )
        : paras(
            "Chaque participant·e de l’École Converse est rémunéré·e pour son travail : l’école dépend donc des fondations, des institutions et des personnes qui la financent. Votre soutien sert directement à rémunérer les participant·e·s et les mentors, et à produire les reportages, balados et chansons que publie chaque cohorte.",
            "Les cohortes passées ont produit les balados Pas tout Montréal et Ma colère et moi, la chanson rap « Jamais trop tard » de MC Converse et des reportages publiés sur La Converse. Pour financer une cohorte ou proposer un partenariat, écrivez-nous.",
          ),
      ctas: [
        {
          label: en ? "Fund a cohort" : "Financez une cohorte",
          url: "mailto:info@laconverse.com?subject=%C3%89cole%20Converse",
        },
        {
          label: en ? "Donate" : "Faire un don",
          url: en ? "/en/get-involved#donate" : "/engagez-vous#donate",
        },
      ],
      partners: [{ name: "Fondation Filles d’Action", logo: null, url: null }],
    },
    form: en
      ? {
          title: "Join École Converse",
          text: "Tell us a little about yourself and we will be in touch before the next cohort begins.",
        }
      : {
          title: "Rejoignez l’École Converse",
          text: "Parlez-nous un peu de vous et nous vous écrirons avant le début de la prochaine cohorte.",
        },
    seo: null,
  };
};

export const getInvolved = (lang: Lang): GetInvolvedData => {
  const en = lang === "en";
  const blurb = en
    ? "Paid apprenticeships in journalism, podcasting and creative writing for young people who want to tell their community’s stories."
    : "Des stages rémunérés en journalisme, en balado et en création littéraire pour les jeunes qui veulent raconter les histoires de leur communauté.";
  return {
    title: en ? "Get involved" : "Engagez-vous",
    image: null,
    intro: en
      ? "La Converse is built with the communities it covers. Give, share your story, join the team or lend a hand — every contribution keeps independent journalism alive."
      : "La Converse se construit avec les communautés qu’elle couvre. Donnez, racontez votre histoire, joignez l’équipe ou donnez un coup de main — chaque contribution garde le journalisme indépendant vivant.",
    cards: [
      {
        title: en ? "Share your story" : "Racontez votre histoire",
        image: null,
        text: blurb,
        cta: { label: en ? "Learn more" : "En savoir plus", url: "#voice" },
        ctaStyle: "link",
      },
      {
        title: en ? "Give your voice" : "Donnez votre voix",
        image: null,
        text: null,
        cta: {
          label: en ? "Join the team" : "Joignez l’équipe",
          url: en ? "/en/get-involved/give-your-voice" : "/engagez-vous/donnez-votre-voix",
        },
        ctaStyle: "button",
      },
    ],
    donate: {
      title: en ? "Donate" : "Faire un don",
      text: en
        ? "Independent journalism can’t exist without its readers. Every donation funds reporting on the stories that go unheard."
        : "Le journalisme indépendant ne peut exister sans ses lecteur·rice·s. Chaque don finance des reportages sur les histoires qu’on n’entend pas.",
      options: [
        { label: en ? "Monthly" : "Mensuel", url: "#" },
        { label: en ? "Annual" : "Annuel", url: "#" },
        { label: en ? "One-time" : "Unique", url: "#" },
      ],
    },
    cardsAfter: [
      {
        title: "École Converse",
        image: null,
        text: blurb,
        cta: {
          label: en ? "Learn more" : "En savoir plus",
          url: en ? "/en/ecole-converse" : "/ecole-converse",
        },
        ctaStyle: "link",
      },
    ],
    volunteer: {
      title: en ? "Volunteer" : "Bénévolat",
      intro: en
        ? "Lend us your time and skills. Here is where we need help the most."
        : "Offrez-nous votre temps et vos talents. Voici où nous avons le plus besoin d’aide.",
      items: en
        ? [
            { title: "Translation", text: "Making our articles accessible in more languages." },
            { title: "Events", text: "Helping out at our public gatherings." },
            { title: "Mentorship", text: "Supporting young journalists at École Converse." },
          ]
        : [
            { title: "Traduction", text: "Rendre nos articles accessibles dans plus de langues." },
            { title: "Événements", text: "Donner un coup de main lors de nos rassemblements." },
            { title: "Mentorat", text: "Accompagner les jeunes journalistes de l’École Converse." },
          ],
      cta: {
        label: en ? "Become a volunteer" : "Devenir bénévole",
        url: en ? "/en/contact" : "/contact",
      },
    },
    seo: null,
  };
};

export const giveYourVoice = (lang: Lang): GiveYourVoiceData => {
  const en = lang === "en";
  const pos = (slug: string, title: string, meta: string) => ({
    _id: `position-${slug}`,
    slug,
    title,
    meta,
    summary: en
      ? "Report on the neighbourhoods, people and issues that mainstream media too often overlook — working hand in hand with the communities concerned."
      : "Couvrir les quartiers, les gens et les enjeux que les grands médias négligent trop souvent — main dans la main avec les communautés concernées.",
    responsibilities: en
      ? [
          "Develop story ideas with community members and partners",
          "Report, write and fact-check articles in French or English",
          "Collaborate with our video and podcast teams",
          "Take part in public events and editorial meetings",
        ]
      : [
          "Développer des idées de reportages avec la communauté et nos partenaires",
          "Enquêter, rédiger et vérifier des articles en français ou en anglais",
          "Collaborer avec nos équipes vidéo et balado",
          "Participer aux événements publics et aux réunions de rédaction",
        ],
    profile: en
      ? [
          "Rooted in, or closely connected to, a Montréal community",
          "Curious, rigorous and a strong listener",
          "Experience in journalism is an asset, not a requirement",
        ]
      : [
          "Ancré·e dans une communauté montréalaise, ou proche d’elle",
          "Curieux·se, rigoureux·se et à l’écoute",
          "Une expérience en journalisme est un atout, pas une exigence",
        ],
    translations: [],
  });
  return {
    title: en ? "Give your voice" : "Donnez votre voix",
    intro: en
      ? "We are looking for journalists, freelancers and collaborators from the communities we cover. Help us tell the stories that too often go unheard."
      : "Nous cherchons des journalistes, pigistes et collaborateur·rice·s issu·e·s des communautés que nous couvrons. Aidez-nous à raconter les histoires qu’on entend trop peu.",
    openApplication: en
      ? {
          title: "Can’t find your profile?",
          text: "We are always looking for motivated journalists and collaborators. Send us an open application.",
        }
      : {
          title: "Vous ne trouvez pas votre profil?",
          text: "Nous sommes toujours à la recherche de journalistes et collaborateur·rice·s motivé·e·s. Envoyez-nous une candidature spontanée.",
        },
    culture: {
      title: "Culture",
      image: null,
      text: en
        ? "La Converse is a small, close-knit newsroom. We work in French and English, share our editorial decisions openly and make space for every voice around the table."
        : "La Converse est une petite rédaction tissée serré. Nous travaillons en français et en anglais, partageons ouvertement nos décisions éditoriales et faisons de la place à chaque voix autour de la table.",
    },
    apply: en
      ? { title: "Apply", text: "Tell us who you are and why this role speaks to you." }
      : { title: "Postuler", text: "Dites-nous qui vous êtes et pourquoi ce poste vous parle." },
    positions: en
      ? [
          pos("community-journalist", "Community journalist", "Full-time · Montréal"),
          pos("freelance-reporter", "Freelance reporter", "Freelance · Remote"),
          pos("video-producer", "Video producer", "Contract · Montréal"),
          pos("social-media-coordinator", "Social media coordinator", "Part-time · Hybrid"),
        ]
      : [
          pos("journaliste-communautaire", "Journaliste communautaire", "Temps plein · Montréal"),
          pos("journaliste-pigiste", "Journaliste pigiste", "Pige · À distance"),
          pos("producteur-video", "Producteur·rice vidéo", "Contrat · Montréal"),
          pos(
            "coordination-medias-sociaux",
            "Coordination médias sociaux",
            "Temps partiel · Hybride",
          ),
        ],
    seo: null,
  };
};

export const contact = (lang: Lang): ContactData => {
  const en = lang === "en";
  return {
    title: "Contact",
    subtitle: en ? "Questions? Leave us a message." : "Des questions? Laissez-nous un message.",
    links: [
      {
        prompt: en ? "Want to write for La Converse?" : "Envie d’écrire pour La Converse?",
        cta: {
          label: en ? "Careers" : "Carrières",
          url: en ? "/en/get-involved/give-your-voice" : "/engagez-vous/donnez-votre-voix",
        },
      },
      {
        prompt: en
          ? "Want to learn more about journalism?"
          : "Envie d’en apprendre plus sur le journalisme?",
        cta: {
          label: "École Converse",
          url: en ? "/en/ecole-converse" : "/ecole-converse",
        },
      },
    ],
    seo: null,
  };
};
