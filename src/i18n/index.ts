/* Locales and routes. French is the default and owns the root (as on the
   Webflow site this replaces); English lives under /en. Every internal link
   goes through `href()` so a page never hard-codes a path in either language. */

export const langs = ["fr", "en"] as const;
export type Lang = (typeof langs)[number];
export const defaultLang: Lang = "fr";

export const htmlLang: Record<Lang, string> = { en: "en-CA", fr: "fr-CA" };

/* Static routes. Dynamic ones take a slug: `href(lang, "article", slug)`. */
const routes = {
  home: { fr: "/", en: "/en" },
  search: { fr: "/recherche", en: "/en/search" },
  article: { fr: "/articles/:slug", en: "/en/articles/:slug" },
  category: { fr: "/categorie/:slug", en: "/en/category/:slug" },
  tag: { fr: "/sujet/:slug", en: "/en/topic/:slug" },
  author: { fr: "/auteur/:slug", en: "/en/author/:slug" },
  videos: { fr: "/videos", en: "/en/videos" },
  laReleve: { fr: "/la-releve", en: "/en/la-releve" },
  program: { fr: "/la-releve/:slug", en: "/en/la-releve/:slug" },
  podcasts: { fr: "/balados", en: "/en/podcasts" },
  podcast: { fr: "/balados/:slug", en: "/en/podcasts/:slug" },
  about: { fr: "/a-propos", en: "/en/about" },
  getInvolved: { fr: "/engagez-vous", en: "/en/get-involved" },
  giveYourVoice: { fr: "/engagez-vous/donnez-votre-voix", en: "/en/get-involved/give-your-voice" },
  position: {
    fr: "/engagez-vous/donnez-votre-voix/:slug",
    en: "/en/get-involved/give-your-voice/:slug",
  },
  contact: { fr: "/contact", en: "/en/contact" },
} as const;

export type RouteKey = keyof typeof routes;

export function href(lang: Lang, key: RouteKey, slug?: string): string {
  const pattern: string = routes[key][lang];
  return slug ? pattern.replace(":slug", encodeURIComponent(slug)) : pattern;
}

export const otherLang = (lang: Lang): Lang => (lang === "en" ? "fr" : "en");

/* Interface strings — the labels baked into the design. Editorial copy lives in
   Sanity; these are only the words the chrome itself needs. */
const strings = {
  en: {
    skip: "Skip to content",
    menu: "Menu",
    close: "Close",
    search: "Search",
    favourites: "Support us",
    articles: "Articles",
    media: "Media",
    about: "About",
    getInvolved: "Get involved",
    contact: "Contact",
    donate: "Donate",
    videos: "Videos",
    podcasts: "Podcasts",
    laReleve: "La Relève",
    topStories: "Top stories",
    seeAll: "See all",
    seeAllStories: "See all stories",
    learnMore: "Learn more",
    previous: "Previous",
    next: "Next",
    loadMore: "Load more",
    all: "All",
    sortLatest: "Sort by latest",
    results: "results",
    articlesCount: "articles",
    articlesBy: "Articles by",
    by: "by",
    episodes: "episodes",
    episodesHeading: "Episodes",
    latestEpisode: "Latest episode",
    otherPodcasts: "Other podcasts",
    allPodcasts: "All podcasts",
    credits: "Credits",
    share: "Share",
    linkCopied: "Link copied",
    listen: "Listen to the article",
    authorsNote: "A note from the journalist",
    topics: "Topics",
    series: "Series",
    translatedFrom: "Translated from the French original.",
    photo: "Photos",
    illustration: "Illustration",
    lji: "This article was produced through the Local Journalism Initiative.",
    readingTime: "min reading time",
    related: "Related stories",
    applyCohort: "Apply for our next cohort",
    more: "more",
    less: "less",
    mute: "Sound on",
    unmute: "Sound off",
    independentMedia: "Independent media portal",
    ourTeam: "Our team",
    collaborators: "Collaborators",
    ourPrograms: "Our programs",
    openPositions: "Open positions",
    responsibilities: "Responsibilities",
    idealProfile: "Ideal profile",
    apply: "Apply",
    attachCv: "Attach your CV",
    submit: "Submit",
    submitApplication: "Submit application",
    name: "Name",
    email: "Email",
    phone: "Phone",
    interests: "Your interests",
    aboutYou: "Tell us about yourself",
    subscribe: "Subscribe",
    newsletter: "Subscribe to our newsletter and stay up to date on our stories",
    socials: "Socials",
    supportUs: "Support La Converse",
    writeDirectly: "Or write to us directly",
    sent: "Thanks. It’s on its way to the newsroom.",
    error: "Something went wrong. Please try again or email us.",
    back: "Back",
    searchPlaceholder: "Search",
    noResults: "No results.",
    // Voice note
    vnTitle: "Got a story to tell? We’d love to hear it!",
    vnWrite: "I’d rather write",
    vnRecord: "I’d rather record",
    vnTap: "Tap to record",
    vnRecording: "Recording… tap to stop",
    vnRedo: "Redo",
    vnSubmit: "Submit",
    vnReach: "What’s the best way to reach you? (optional)",
    vnSend: "Send to the newsroom",
    vnMessage: "Write your message…",
    vnPrivacy:
      "Your voice note goes directly to our newsroom and is never shared with third parties. You remain completely anonymous unless you tell us otherwise.",
    vnEsc: "Esc",
    vnNoMic: "We couldn’t access your microphone. You can write to us instead.",
    vnPlay: "Play",
    vnPause: "Pause",
    vnOpen: "Record a voice note for the newsroom",
    vnFab: "Got a story?",
    // In-article calls to action
    ctaDonateTitle: "Keep La Converse independent",
    ctaDonateText:
      "Community support is what keeps our reporting free and independent. Help us continue covering what matters.",
    ctaStoryText:
      "Send the newsroom a voice note or a written message. You stay anonymous unless you tell us otherwise.",
    language: "Français",
  },
  fr: {
    skip: "Aller au contenu",
    menu: "Menu",
    close: "Fermer",
    search: "Recherche",
    favourites: "Soutenez-nous",
    articles: "Articles",
    media: "Média",
    about: "À propos",
    getInvolved: "Engagez-vous",
    contact: "Contact",
    donate: "Faire un don",
    videos: "Vidéos",
    podcasts: "Balados",
    laReleve: "La Relève",
    topStories: "À la une",
    seeAll: "Voir tout",
    seeAllStories: "Tous les articles",
    learnMore: "En savoir plus",
    previous: "Précédent",
    next: "Suivant",
    loadMore: "Voir plus",
    all: "Tous",
    sortLatest: "Plus récents",
    results: "résultats",
    articlesCount: "articles",
    articlesBy: "Articles de",
    by: "par",
    episodes: "épisodes",
    episodesHeading: "Épisodes",
    latestEpisode: "Dernier épisode",
    otherPodcasts: "Autres balados",
    allPodcasts: "Tous les balados",
    credits: "Crédits",
    share: "Partager",
    linkCopied: "Lien copié",
    listen: "Écouter l’article",
    authorsNote: "Un mot du ou de la journaliste",
    topics: "Sujets",
    series: "Série",
    translatedFrom: "Traduit de l’original anglais.",
    photo: "Photos",
    illustration: "Illustration",
    lji: "Cet article a été produit dans le cadre de l’Initiative de journalisme local.",
    readingTime: "min de lecture",
    related: "À lire aussi",
    applyCohort: "Postulez pour la prochaine cohorte",
    more: "plus",
    less: "moins",
    mute: "Activer le son",
    unmute: "Couper le son",
    independentMedia: "Portail des médias indépendants",
    ourTeam: "Notre équipe",
    collaborators: "Collaborateur·rice·s",
    ourPrograms: "Nos programmes",
    openPositions: "Postes ouverts",
    responsibilities: "Responsabilités",
    idealProfile: "Profil recherché",
    apply: "Postuler",
    attachCv: "Joindre votre CV",
    submit: "Envoyer",
    submitApplication: "Envoyer ma candidature",
    name: "Nom",
    email: "Courriel",
    phone: "Téléphone",
    interests: "Vos intérêts",
    aboutYou: "Parlez-nous de vous",
    subscribe: "S’abonner",
    newsletter: "Abonnez-vous à notre infolettre pour suivre nos reportages",
    socials: "Réseaux",
    supportUs: "Soutenir La Converse",
    writeDirectly: "Ou écrivez-nous directement",
    sent: "Merci. Votre message est en route vers la rédaction.",
    error: "Une erreur est survenue. Réessayez ou écrivez-nous.",
    back: "Retour",
    searchPlaceholder: "Recherche",
    noResults: "Aucun résultat.",
    vnTitle: "Avez-vous une histoire à raconter? Nous serions ravis d’en discuter!",
    vnWrite: "Je préfère écrire",
    vnRecord: "Je préfère enregistrer",
    vnTap: "Appuyez pour enregistrer",
    vnRecording: "Enregistrement… appuyez pour arrêter",
    vnRedo: "Recommencer",
    vnSubmit: "Envoyer",
    vnReach: "Comment vous joindre? (facultatif)",
    vnSend: "Envoyer à la rédaction",
    vnMessage: "Écrivez votre message…",
    vnPrivacy:
      "Votre note vocale est envoyée directement à notre rédaction et n’est jamais partagée avec des tiers. Vous restez anonyme, à moins de nous indiquer le contraire.",
    vnEsc: "Échap",
    vnNoMic: "Impossible d’accéder à votre micro. Vous pouvez nous écrire à la place.",
    vnPlay: "Lecture",
    vnPause: "Pause",
    vnOpen: "Enregistrer une note vocale pour la rédaction",
    vnFab: "Une histoire à raconter?",
    ctaDonateTitle: "Gardons La Converse indépendante",
    ctaDonateText:
      "C’est le soutien de la communauté qui garde nos reportages libres et indépendants. Aidez-nous à continuer de couvrir ce qui compte.",
    ctaStoryText:
      "Envoyez une note vocale ou un message écrit à la rédaction. Vous restez anonyme, à moins de nous indiquer le contraire.",
    language: "English",
  },
} as const;

export type Strings = { [K in keyof (typeof strings)["en"]]: string };

export const t = (lang: Lang): Strings => strings[lang];

const dateFmt = {
  en: new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "long", year: "numeric" }),
  fr: new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long", year: "numeric" }),
};

export const formatDate = (lang: Lang, iso?: string | null) =>
  iso ? dateFmt[lang].format(new Date(iso)) : "";

export function formatDuration(seconds?: number | null) {
  if (!seconds && seconds !== 0) return "";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}
