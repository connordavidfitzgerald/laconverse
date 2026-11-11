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
  DonateData,
  StudioData,
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
  { _id: "program-mc", title: "MC Converse", slug: "mc-converse", image: null, linkTo: "self" },
  { _id: "program-podcasts", title: "Podcasts", slug: "podcasts", image: null, linkTo: "podcasts" },
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

const ALUMNI = ["lela-savic", "nouri-nesrouche", "labib-benslama", "aya-boucenna"];

const PROGRAM_COPY: Record<string, L<{ intro: string[]; about: string[] }>> = {
  journalism: {
    en: {
      intro: [
        "A founding pillar of École Converse since 2020, the journalism program aims to open up access to the profession and to change how journalism is practised.",
        "Rooted in La Converse’s dialogue journalism and inspired by participatory approaches, the training encourages young people to develop their critical thinking, question dominant narratives and produce stories with communities.",
      ],
      about: [
        "Through hands-on workshops and immersion in our newsroom, young people learn to research, verify and dig deeper into information, conduct interviews and develop their own story ideas. They discover a journalism that starts in the field, encourages public participation and brings the media closer to the communities it serves.",
      ],
    },
    fr: {
      intro: [
        "Pilier fondateur de l’École Converse depuis 2020, le programme de journalisme vise à ouvrir l’accès à la profession et à changer la façon dont le journalisme se pratique.",
        "Ancrée dans le journalisme de dialogue de La Converse et inspirée des approches participatives, la formation encourage les jeunes à développer leur esprit critique, à questionner les récits dominants et à produire des reportages avec les communautés.",
      ],
      about: [
        "À travers des ateliers pratiques et une immersion dans notre salle de rédaction, les jeunes apprennent à chercher, vérifier et approfondir l’information, à mener des entrevues et à développer leurs propres idées de reportage. Ils et elles découvrent un journalisme qui part du terrain, encourage la participation du public et rapproche le média des communautés qu’il sert.",
      ],
    },
  },
  "mc-converse": {
    en: {
      intro: [
        "MC Converse is the rap program of École Converse. Inspired by Kery James’s song Banlieusards, it invites young people to use rap to tell their lived experience, question injustice and take a critical look at the realities of their communities.",
      ],
      about: [
        "Each cohort brings together seven young people with mentor artists — Raccoon in 2023 and 2024, then Meryem Saci and Birdzontrack since 2025 — around a shared project: writing a song and making a music video.",
        "Through rap-writing workshops centred on listening, dialogue and sensitivity, the participants draw on their own experiences and those of their neighbourhoods to address realities often left out of the mainstream media.",
        "With MC Converse, rap becomes a tool for expression, dialogue and social change.",
      ],
    },
    fr: {
      intro: [
        "MC Converse est le volet rap de l’École Converse. Inspiré de la chanson Banlieusards de Kery James, il invite les jeunes à utiliser le rap pour raconter leur vécu, questionner les injustices et porter un regard critique sur les réalités de leurs communautés.",
      ],
      about: [
        "Chaque cohorte réunit sept jeunes et des artistes mentors — Raccoon en 2023 et 2024, puis Meryem Saci et Birdzontrack depuis 2025 — autour d’un projet commun : écrire une chanson et réaliser un vidéoclip.",
        "À travers des ateliers d’écriture rap axés sur l’écoute, le dialogue et la sensibilité, les participant·e·s puisent dans leur propre vécu et celui de leur quartier pour aborder des réalités souvent laissées de côté par les médias traditionnels.",
        "Avec MC Converse, le rap devient un outil d’expression, de dialogue et de changement social.",
      ],
    },
  },
  podcasts: {
    en: {
      intro: [
        "École Converse’s podcast program introduces young people to audio documentary journalism. Alongside experienced journalists, they learn the art of the interview, how to explore a subject in depth and how to build stories that bring different perspectives to the ear. Because of the closeness it creates and the room it gives to people’s voices, the podcast lets us approach human realities with nuance, sensitivity and depth.",
      ],
      about: [
        "Each cohort brings together young people around a shared project: researching, recording and producing a documentary series, from the first interview to the final mix.",
        "Through workshops on interviewing, sound and storytelling, the participants draw on their own experiences and those of their neighbourhoods to address realities often left out of the mainstream media.",
      ],
    },
    fr: {
      intro: [
        "Le programme balado de l’École Converse initie les jeunes au journalisme documentaire audio. Aux côtés de journalistes d’expérience, ils et elles apprennent l’art de l’entrevue, à explorer un sujet en profondeur et à construire des récits qui font entendre d’autres perspectives. Par la proximité qu’il crée et la place qu’il laisse aux voix, le balado permet d’aborder les réalités humaines avec nuance, sensibilité et profondeur.",
      ],
      about: [
        "Chaque cohorte réunit des jeunes autour d’un projet commun : rechercher, enregistrer et produire une série documentaire, de la première entrevue au mixage final.",
        "À travers des ateliers d’entrevue, de son et de narration, les participant·e·s puisent dans leur propre vécu et celui de leur quartier pour aborder des réalités souvent laissées de côté par les médias traditionnels.",
      ],
    },
  },
};

const PILE_OU_FACE: L<string> = {
  en: "For this fourth cohort, six young artists come together around Pile ou face (“Heads or Tails”), a cypher about personal hardship, choices and the paths taken to keep moving forward. In their lyrics they take on struggles that are sometimes invisible, and remind us that every person has a story. A collective work driven by resilience and hope for better days.",
  fr: "Pour cette quatrième cohorte, six jeunes artistes se réunissent autour de Pile ou face, un cypher sur les épreuves personnelles, les choix et les chemins empruntés pour continuer d’avancer. Dans leurs textes, ils et elles abordent des luttes parfois invisibles et nous rappellent que chaque personne a une histoire. Une œuvre collective portée par la résilience et l’espoir de jours meilleurs.",
};

export function program(lang: Lang, slug: string): Program | null {
  const card = programs(lang).find((x) => x.slug === slug);
  const copy = PROGRAM_COPY[slug]?.[lang];
  if (!card || !copy) return null;
  const en = lang === "en";
  return {
    ...card,
    tagline: null,
    body: paras(...copy.intro),
    about: paras(...copy.about),
    cta: {
      label: en ? "Join École Converse" : "Rejoindre l’École Converse",
      url: "mailto:info@laconverse.com?subject=%C3%89cole%20Converse",
    },
    quote: null,
    video: null,
    articles: slug === "journalism" ? articles(lang).slice(0, 3) : [],
    musicVideos:
      slug === "mc-converse"
        ? [0, 1].map((i) => ({
            _key: `mv${i}`,
            title: "Pile ou face",
            year: "2025",
            url: "https://www.youtube.com/watch?v=JGBQ7N8UTNY",
            text: PILE_OU_FACE[lang],
            artists: en
              ? "De Lafe, Zdouki, Lex, Kevynx, Robin and JMK"
              : "De Lafe, Zdouki, Lex, Kevynx, Robin et JMK",
            mentor: "Meryem Saci",
            poster: null,
          }))
        : [],
    podcasts: slug === "podcasts" ? podcasts(lang) : [],
    alumni: people(lang).filter((x) => ALUMNI.includes(x.slug)),
    support: false,
    form: null,
    translations: [{ language: (en ? "fr" : "en") as Lang, slug }],
    seo: null,
  };
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
    ecole: null,
    seo: null,
  };
};

export const VALUES_TITLE: L<string> = {
  fr: "Nos 10 valeurs pour un journalisme dialogue",
  en: "Our 10 values for a journalism of dialogue",
};

export const VALUES: L<[string, string][]> = {
  fr: [
    [
      "Un journalisme respectueux",
      "En tant que média, nous sommes conscients que nos choix ont des répercussions sur la vie des gens. Pour nous, les mots et les actions ont leur importance. À La Converse, vous n’êtes pas des sujets d’articles, vous faites partie d’une communauté. Nous prenons le temps de vous écouter et nous travaillons avec vous avant, pendant et après la publication de nos reportages.",
    ],
    [
      "Un journalisme propulsé par vos besoins",
      "Nous ne croyons pas à la pornographie de la pauvreté. Nos reportages doivent répondre aux besoins, questions et préoccupations des collectivités. Notre équipe pratique un journalisme anti-oppressif, sensible au trauma, et elle comprend qu’il y a souvent des sous-courants historiques et politiques qui affectent les communautés d’aujourd’hui.",
    ],
    [
      "Un journalisme relationnel",
      "Nous ne nous contentons pas de survoler un sujet pour en extraire une histoire ; nous nous engageons à avoir des conversations consensuelles, à établir des relations humaines ainsi qu’à partager des histoires nuancées et inédites qui révèlent une palette de vérités.",
    ],
    [
      "Un journalisme transparent",
      "Les journalistes sont parmi les personnes dont on se méfie le plus aujourd’hui. Nous voulons regagner votre confiance en partageant avec vous la façon dont nous élaborons nos articles. Pourquoi choisit-on un sujet ? Comment effectue-t-on nos recherches ? Quelle est notre position ? Qu’est-ce qu’on ignore ? Quelles sont nos erreurs ? Qu’a-t-on appris ?",
    ],
    [
      "Une approche ascendante",
      "Nos sujets partent de vous. Nous nous concentrons sur les systèmes – et non sur les symptômes. Nous ne voulons pas parler des gens, nous voulons que les gens nous parlent de sujets importants pour eux.",
    ],
    [
      "Une structure équitable",
      "Être journaliste vient avec beaucoup de responsabilités. À La Converse, nous tenons à honorer cet engagement et à construire une équipe de journalistes représentatifs de notre société. Nous allons mettre en pratique la diversité et l’inclusion au-delà des mots-clés et des photos de groupe.",
    ],
    [
      "L’impact avant les clics",
      "Notre raison d’être est la recherche d’histoires non virales. Nous voulons prendre le temps de fouiller des sujets qui sont d’intérêt pour vous.",
    ],
    [
      "L’introspection",
      "À La Converse, nous essayerons toujours de mieux faire et de ne jamais partir du principe que nous avons toutes les réponses. Nous nous engageons à toujours remettre en question l’impact de nos choix afin de méditer sur les meilleures façons de vous servir.",
    ],
    [
      "Une constante évolution",
      "Nous valorisons les idées et écoutons les préoccupations de tous. Nous nous efforçons de créer une communauté dans laquelle le désaccord est accepté, la prise de risque encouragée, et l’échec considéré comme un apprentissage précieux. Participez à cette évolution avec nous.",
    ],
    [
      "Collaborer pour avoir plus d’impact",
      "Nous collaborons avec des organes de presse et d’autres organisations qui partagent nos valeurs afin de regrouper nos ressources, nos données et nos histoires. Dans la mesure du possible, nous mettons à la disposition du public les données à l’origine de nos enquêtes.",
    ],
  ],
  en: [
    [
      "Respectful journalism",
      "As a media outlet, we know our choices affect people’s lives. To us, words and actions matter. At La Converse, you are not the subjects of articles; you are part of a community. We take the time to listen to you, and we work with you before, during and after our stories are published.",
    ],
    [
      "Journalism driven by your needs",
      "We do not believe in poverty porn. Our reporting must answer the needs, questions and concerns of communities. Our team practises anti-oppressive, trauma-informed journalism, and understands that historical and political undercurrents often shape communities today.",
    ],
    [
      "Relational journalism",
      "We don’t skim the surface of a subject to extract a story; we commit to consensual conversations, to building human relationships, and to sharing nuanced, untold stories that reveal a range of truths.",
    ],
    [
      "Transparent journalism",
      "Journalists are among the most distrusted people today. We want to win back your trust by sharing how we put our stories together. Why do we choose a subject? How do we research it? Where do we stand? What don’t we know? What mistakes have we made? What have we learned?",
    ],
    [
      "A bottom-up approach",
      "Our stories start with you. We focus on systems, not symptoms. We don’t want to talk about people; we want people to talk to us about the issues that matter to them.",
    ],
    [
      "An equitable structure",
      "Being a journalist comes with great responsibility. At La Converse, we are determined to honour that commitment and build a team of journalists who reflect our society. We will put diversity and inclusion into practice beyond keywords and group photos.",
    ],
    [
      "Impact before clicks",
      "Our purpose is to seek out stories that aren’t viral. We want to take the time to dig into the subjects that matter to you.",
    ],
    [
      "Introspection",
      "At La Converse, we will always try to do better and never assume we have all the answers. We commit to always questioning the impact of our choices, so we can reflect on the best ways to serve you.",
    ],
    [
      "Constant evolution",
      "We value ideas and listen to everyone’s concerns. We strive to build a community where disagreement is accepted, risk-taking encouraged, and failure seen as a valuable lesson. Join us in this evolution.",
    ],
    [
      "Collaborating for greater impact",
      "We work with news organizations and other groups that share our values to pool our resources, data and stories. Wherever possible, we make the data behind our investigations available to the public.",
    ],
  ],
};

const PRINCIPLES: L<[string, string[]][]> = {
  en: [
    [
      "Nothing but journalism",
      [
        "We do not publish opinion columns or open letters. We believe public debate has no shortage of opinions; what it too often lacks is journalism to inform them. Our work is to investigate, check the facts, bring in more perspectives and ask the questions that need asking, including of the institutions that hold power.",
        "We do not try to tell people what to think, but to give them the means to form their own opinions.",
      ],
    ],
    [
      "No advertising. No sponsored content.",
      [
        "La Converse is an independent media outlet, with no advertising and no sponsored journalism.",
        "We are funded by donations, philanthropy, some public grants, tax credits for journalism organizations and revenue from our activities, including talks, professional engagements and partnerships with École Converse.",
        "No donor, partner or funder can intervene in our editorial decisions.",
      ],
    ],
    [
      "Our journalism starts on your doorstep",
      [
        "We believe story ideas should not be decided only in a newsroom. We go out to meet people in their neighbourhoods and communities to understand their concerns and the questions they want explored.",
        "Doing journalism with communities is not just handing them a microphone. It means letting them shape the questions we ask, while keeping our responsibility to check the facts and hold institutions to account.",
      ],
    ],
    [
      "Not just reporting what is wrong",
      [
        "Injustice and inequality are more than statistics. Behind them are people, journeys and stories that deserve to be understood.",
        "We explain systemic problems and their consequences, but we also shine a light on the people who act, create and open up new possibilities. And our work does not stop at reporting: we create spaces for meeting and dialogue around the issues facing our society.",
      ],
    ],
    [
      "Changing who tells the story, not just what is told",
      [
        "We believe changing journalism also means changing who practises it. Journalists’ experiences, knowledge and questions shape what becomes news in the public interest.",
        "Through École Converse, we train young people from underrepresented communities to investigate, understand the issues facing their society and produce their own stories.",
        "Our goal goes beyond training: we want them to see themselves as people who can inform, question institutions and contribute to public debate. Because changing who becomes a journalist also changes how our realities are seen.",
      ],
    ],
  ],
  fr: [
    [
      "Rien que du journalisme",
      [
        "Nous ne publions ni chroniques d’opinion ni lettres ouvertes. Le débat public ne manque pas d’opinions; ce qui lui manque trop souvent, c’est du journalisme pour les éclairer. Notre travail consiste à enquêter, vérifier les faits, ajouter des perspectives et poser les questions qui doivent l’être, y compris aux institutions qui détiennent le pouvoir.",
        "Nous ne cherchons pas à dire aux gens quoi penser, mais à leur donner les moyens de se forger leur propre opinion.",
      ],
    ],
    [
      "Pas de publicité. Pas de contenu commandité.",
      [
        "La Converse est un média indépendant, sans publicité et sans journalisme commandité.",
        "Nous sommes financés par des dons, la philanthropie, certaines subventions publiques, des crédits d’impôt pour les organisations journalistiques et les revenus de nos activités, dont des conférences, des mandats professionnels et des partenariats avec l’École Converse.",
        "Aucun donateur, partenaire ou bailleur de fonds ne peut intervenir dans nos décisions éditoriales.",
      ],
    ],
    [
      "Notre journalisme commence au coin de votre rue",
      [
        "Nous croyons que les idées de reportage ne devraient pas se décider uniquement dans une salle de rédaction. Nous allons à la rencontre des gens dans leurs quartiers et leurs communautés pour comprendre leurs préoccupations et les questions qu’ils veulent voir explorées.",
        "Faire du journalisme avec les communautés, ce n’est pas seulement leur tendre un micro. C’est les laisser façonner les questions que nous posons, tout en gardant notre responsabilité de vérifier les faits et de demander des comptes aux institutions.",
      ],
    ],
    [
      "Pas seulement rapporter ce qui ne va pas",
      [
        "L’injustice et les inégalités sont plus que des statistiques. Derrière elles, il y a des personnes, des parcours et des histoires qui méritent d’être compris.",
        "Nous expliquons les problèmes systémiques et leurs conséquences, mais nous mettons aussi en lumière les personnes qui agissent, créent et ouvrent de nouveaux possibles. Et notre travail ne s’arrête pas au reportage : nous créons des espaces de rencontre et de dialogue autour des enjeux qui traversent notre société.",
      ],
    ],
    [
      "Changer qui raconte, pas seulement ce qui est raconté",
      [
        "Nous croyons que changer le journalisme, c’est aussi changer qui le pratique. Les expériences, les savoirs et les questions des journalistes façonnent ce qui devient une nouvelle d’intérêt public.",
        "À travers l’École Converse, nous formons des jeunes issus de communautés sous-représentées à enquêter, à comprendre les enjeux de leur société et à produire leurs propres reportages.",
        "Notre objectif va au-delà de la formation : nous voulons qu’ils et elles se voient comme des personnes capables d’informer, de questionner les institutions et de contribuer au débat public. Parce que changer qui devient journaliste change aussi la façon dont nos réalités sont vues.",
      ],
    ],
  ],
};

export const about = (lang: Lang): AboutData => ({
  title: lang === "en" ? "About us" : "À propos",
  image: null,
  intro: paras(
    lang === "en"
      ? "Founded in Montréal in 2020, La Converse is an independent non-profit media outlet that puts historically marginalized communities at the heart of its dialogue journalism. We believe in the power of journalism to help us understand the world, question power relations and contribute to social change."
      : "Fondée à Montréal en 2020, La Converse est un média indépendant à but non lucratif qui place les communautés historiquement marginalisées au cœur de son journalisme de dialogue. Nous croyons au pouvoir du journalisme pour nous aider à comprendre le monde, questionner les rapports de pouvoir et contribuer au changement social.",
  ),
  statements:
    lang === "en"
      ? [
          {
            _key: "s1",
            text: "We believe in journalism built with communities, not just about them. Through our reporting, investigations and initiatives, we work to deepen understanding of social realities, question power relations and create spaces for dialogue between people who rarely get the chance to meet.",
          },
          {
            _key: "s2",
            text: "We also believe journalism should be more accessible. That is why, through École Converse, we train young people from underrepresented communities and encourage them to take part in producing the news.",
            cta: { label: "Learn more about École Converse", url: "/en/ecole-converse" },
          },
        ]
      : [
          {
            _key: "s1",
            text: "Nous croyons en un journalisme fait avec les communautés, et pas seulement à leur sujet. Par nos reportages, nos enquêtes et nos initiatives, nous travaillons à approfondir la compréhension des réalités sociales, à questionner les rapports de pouvoir et à créer des espaces de dialogue entre des personnes qui ont rarement l’occasion de se rencontrer.",
          },
          {
            _key: "s2",
            text: "Nous croyons aussi que le journalisme doit être plus accessible. C’est pourquoi, à travers l’École Converse, nous formons des jeunes issus de communautés sous-représentées et les encourageons à prendre part à la production de l’information.",
            cta: { label: "En savoir plus sur l’École Converse", url: "/ecole-converse" },
          },
        ],
  principlesImage: null,
  principles: PRINCIPLES[lang].map(([title, body], i) => ({
    _key: `p${i}`,
    title,
    body: paras(...body),
  })),
  valuesTitle: VALUES_TITLE[lang],
  values: VALUES[lang].map(([title, text], i) => ({ _key: `v${i}`, title, text })),
  team: people(lang).filter((_, i) => PEOPLE[i].group === "team"),
  collaborators: people(lang).filter((_, i) => PEOPLE[i].group === "collaborator"),
  sections: [
    {
      _key: "news",
      title: lang === "en" ? "News" : "Nouvelles",
      kind: "series",
      articles: articles(lang).slice(0, 3),
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
    intro: paras(
      en
        ? "École Converse is a training space designed by and for people from communities that are underrepresented in the media. Through training in journalism, podcasting, video and journalistic rap, the school supports a new generation of journalists and artists who want to reclaim their stories and explore new ways of telling the world."
        : "L’École Converse est un espace de formation pensé par et pour les personnes issues de communautés sous-représentées dans les médias. À travers des formations en journalisme, en balado, en vidéo et en rap journalistique, elle accompagne une nouvelle génération de journalistes et d’artistes qui souhaitent se réapproprier leurs récits et explorer de nouvelles façons de raconter le monde.",
    ),
    cta: {
      label: en ? "Join École Converse" : "Rejoindre l’École Converse",
      url: "mailto:info@laconverse.com?subject=%C3%89cole%20Converse",
    },
    approach: {
      title: en ? "Approach" : "Approche",
      image: null,
      body: en
        ? paras(
            "Our approach is based on learning by doing. Young people learn to produce stories with communities, through workshops, meetings with experienced journalists and time in the field.",
            "We believe community involvement should not be a privilege — École Converse offers participation stipends that recognize the value of young people’s time and commitment. Their work is visible on La Converse’s platforms. For some, the experience also opens the door to professional collaborations or a place in our newsroom.",
          )
        : paras(
            "Notre approche repose sur l’apprentissage par la pratique. Les jeunes apprennent à produire des reportages avec les communautés, à travers des ateliers, des rencontres avec des journalistes d’expérience et du temps sur le terrain.",
            "Nous croyons que l’engagement communautaire ne devrait pas être un privilège — l’École Converse offre des allocations de participation qui reconnaissent la valeur du temps et de l’engagement des jeunes. Leur travail est diffusé sur les plateformes de La Converse. Pour certain·e·s, l’expérience ouvre aussi la porte à des collaborations professionnelles ou à une place dans notre salle de rédaction.",
          ),
    },
    why: {
      title: en ? "Why École Converse?" : "Pourquoi l’École Converse?",
      image: null,
      body: en
        ? paras(
            "It all started with a conviction: the communities at the centre of the news should also have a say in how their realities are told. Yet their perspectives are still too often missing from newsrooms and from the decisions that shape the news.",
            "With École Converse, we want to open new doors into journalism, and also rethink how it is practised. We believe in community-rooted journalism, built on listening, dialogue and collaboration with communities.",
          )
        : paras(
            "Tout a commencé par une conviction : les communautés au cœur de l’actualité devraient aussi avoir leur mot à dire sur la façon dont leurs réalités sont racontées. Pourtant, leurs perspectives sont encore trop souvent absentes des salles de rédaction et des décisions qui façonnent l’information.",
            "Avec l’École Converse, nous voulons ouvrir de nouvelles portes vers le journalisme, et aussi repenser la façon dont il se pratique. Nous croyons en un journalisme ancré dans les communautés, fondé sur l’écoute, le dialogue et la collaboration.",
          ),
      aside: en
        ? paras(
            "Beyond journalistic technique, we encourage young people to develop their curiosity, their critical thinking and their sense of responsibility toward the people whose stories they tell.",
            "Our goal: Train a new generation able to tell the world in all its complexity and to contribute to journalism that is more representative, accessible and rooted in communities.",
          )
        : paras(
            "Au-delà de la technique journalistique, nous encourageons les jeunes à développer leur curiosité, leur esprit critique et leur sens des responsabilités envers les personnes dont ils et elles racontent les histoires.",
            "Notre objectif : former une nouvelle génération capable de raconter le monde dans toute sa complexité et de contribuer à un journalisme plus représentatif, accessible et ancré dans les communautés.",
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
          url: en ? "/en/donate" : "/donner",
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
    image: null,
    intro: null,
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

export const donate = (lang: Lang): DonateData => {
  const en = lang === "en";
  const list = (items: [string, string][]) =>
    items.map(([lead, rest]) => ({
      _type: "block",
      _key: key(),
      style: "normal",
      listItem: "bullet",
      level: 1,
      markDefs: [],
      children: [
        { _type: "span", _key: key(), text: lead, marks: ["strong"] },
        { _type: "span", _key: key(), text: ` ${rest}`, marks: [] },
      ],
    }));
  return {
    title: en ? "Donate" : "Je donne",
    image: null,
    intro: en
      ? paras(
          "Every contribution brings us closer to a stronger, more independent media outlet, able to continue its work for the long term.",
          "Since we started, we have listened, told stories, created spaces for dialogue and brought other perspectives and solutions to light. Our journalism is rooted in marginalized communities and gives a voice to those we hear from too rarely. Since 2020, École Converse has also trained more than 100 young people in journalism, opening the profession to people from communities underrepresented in the media.",
          "That is thanks to you. ♥",
        )
      : paras(
          "Chaque contribution nous rapproche d’un média plus fort, plus indépendant, capable de poursuivre son travail à long terme.",
          "Depuis nos débuts, nous avons écouté, raconté, créé des espaces de dialogue et mis en lumière d’autres perspectives et solutions. Notre journalisme est ancré dans les communautés marginalisées et donne la parole à celles et ceux qu’on entend trop rarement. Depuis 2020, l’École Converse a aussi formé plus de 100 jeunes au journalisme, ouvrant la profession aux personnes issues de communautés sous-représentées dans les médias.",
          "C’est grâce à vous. ♥",
        ),
    support: {
      title: en ? "Support La Converse" : "Soutenez La Converse",
      text: en
        ? "Every contribution brings us closer to a stronger, more independent media outlet, able to continue its work for the long term."
        : "Chaque contribution nous rapproche d’un média plus fort, plus indépendant, capable de poursuivre son travail à long terme.",
    },
    sections: [
      {
        _key: "support",
        label: en ? "What will your donation support?" : "Que soutiendra votre don?",
        body: [
          ...paras(
            en
              ? "All of La Converse’s revenue is reinvested in our mission and in running our organization. Your contribution allows us to:"
              : "Tous les revenus de La Converse sont réinvestis dans notre mission et dans le fonctionnement de notre organisme. Votre contribution nous permet de :",
          ),
          ...list(
            en
              ? [
                  ["Investigate and inform.", "Pay our journalists, dig deeper into issues, check the facts and question institutions."],
                  ["Keep the dialogue going.", "Meet with communities and create spaces where people can talk about the issues that affect them."],
                  ["Train the next generation.", "Support École Converse youth as they learn journalism and produce their own stories."],
                  ["Build a lasting media outlet.", "Invest in the people, tools and resources our organization needs."],
                ]
              : [
                  ["Enquêter et informer.", "Rémunérer nos journalistes, approfondir les enjeux, vérifier les faits et questionner les institutions."],
                  ["Faire vivre le dialogue.", "Aller à la rencontre des communautés et créer des espaces où l’on peut parler des enjeux qui les touchent."],
                  ["Former la relève.", "Soutenir les jeunes de l’École Converse dans leur apprentissage du journalisme et la production de leurs propres reportages."],
                  ["Bâtir un média durable.", "Investir dans les personnes, les outils et les ressources dont notre organisme a besoin."],
                ],
          ),
        ] as RichText,
      },
      {
        _key: "about",
        label: en ? "About us" : "À propos",
        body: en
          ? paras(
              "La Converse is an independent non-profit media outlet. We do not run any advertising or sponsored journalism. We are funded by public donations, foundations, some government grants, tax credits for journalism organizations and revenue from our activities. No donor, partner or funder can choose our topics, steer our reporting or intervene in our editorial decisions.",
              "The more we can count on direct support from our readers, the stronger our independence.",
            )
          : paras(
              "La Converse est un média indépendant à but non lucratif. Nous ne diffusons aucune publicité ni aucun journalisme commandité. Nous sommes financés par les dons du public, des fondations, certaines subventions gouvernementales, des crédits d’impôt pour les organisations journalistiques et les revenus de nos activités. Aucun donateur, partenaire ou bailleur de fonds ne peut choisir nos sujets, orienter nos reportages ou intervenir dans nos décisions éditoriales.",
              "Plus nous pouvons compter sur le soutien direct de nos lecteur·rice·s, plus notre indépendance est forte.",
            ),
      },
    ],
    zeffyForms: {},
    zeffyUrl: null,
    goal: 50000,
    raised: 22135,
    presets: { monthly: [5, 10, 15, 25], annually: [120, 200, 350, 500], once: [50, 100, 150, 200] },
    seo: null,
  };
};

const STUDIOS: { name: L<string>; text: L<string> }[] = [
  {
    name: { en: "Studio A", fr: "Studio A" },
    text: {
      en: "Surrounded by glass walls, this studio is bright and warm. With professional-grade equipment and a creative space to bring your vision to life, it gives your content better sound quality.",
      fr: "Entouré de murs vitrés, ce studio est lumineux et chaleureux. Avec son équipement de qualité professionnelle et un espace créatif pour donner vie à votre vision, il offre à votre contenu une meilleure qualité sonore.",
    },
  },
  {
    name: { en: "Studio B", fr: "Studio B" },
    text: {
      en: "This private, spacious, fully equipped studio lets you do your best work. In a space designed for creators like you, you will find the comfort your ideas need to come to life.",
      fr: "Privé, spacieux et entièrement équipé, ce studio vous permet de donner le meilleur de vous-même. Dans un espace pensé pour les créateur·rice·s comme vous, vous trouverez le confort dont vos idées ont besoin pour prendre vie.",
    },
  },
  {
    name: { en: "Chill space", fr: "Espace détente" },
    text: {
      en: "Get away from it all in our chill space. Designed for you to unwind, it leaves room for creativity and reflection, so you can create in comfort.",
      fr: "Évadez-vous dans notre espace détente. Pensé pour décrocher, il laisse place à la créativité et à la réflexion, pour créer en tout confort.",
    },
  },
  {
    name: { en: "Shared workspace", fr: "Espace de travail partagé" },
    text: {
      en: "Our shared workspace offers a lively way to work. Designed to inspire, it lets you be productive while enjoying a collaborative space that makes your workday anything but ordinary.",
      fr: "Notre espace de travail partagé offre une façon vivante de travailler. Pensé pour inspirer, il vous permet d’être productif·ve tout en profitant d’un espace collaboratif qui rend vos journées tout sauf ordinaires.",
    },
  },
];

export const studio = (lang: Lang): StudioData => ({
  title: "Studio Converse",
  image: null,
  kicker:
    lang === "en"
      ? "Podcast studio in the heart of Little Italy, Montréal"
      : "Studio de balado au cœur de la Petite Italie, Montréal",
  intro:
    lang === "en"
      ? "Our state-of-the-art recording studios are now available for rental, production support and full production. Step into the studio of your choice, get comfortable and let the space carry you."
      : "Nos studios d’enregistrement à la fine pointe sont maintenant offerts en location, en soutien à la production et en production complète. Entrez dans le studio de votre choix, installez-vous et laissez l’espace vous porter.",
  studios: STUDIOS.map((x, i) => ({
    _key: `studio${i}`,
    name: x.name[lang],
    text: x.text[lang],
    image: null,
    bookUrl: "mailto:info@laconverse.com?subject=Studio%20Converse",
  })),
  seo: null,
});
