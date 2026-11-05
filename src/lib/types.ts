import type { PortableTextBlock } from "@portabletext/types";

import type { Lang } from "../i18n";

/* Shapes returned by the queries in content.ts (and mirrored by fixtures.ts). */

export interface Img {
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
  hotspot?: { x: number; y: number; width: number; height: number } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  asset?: {
    _id: string;
    url: string;
    metadata?: { dimensions?: { width: number; height: number }; lqip?: string | null } | null;
  } | null;
}

export type RichText =
  PortableTextBlock[] | (Record<string, unknown> & { _type: string; _key: string })[];

export interface Cta {
  label?: string | null;
  url?: string | null;
}

export interface CategoryRef {
  title: string;
  slug: string;
}

export interface PersonRef {
  name: string;
  slug: string;
}

export interface ArticleCard {
  _id: string;
  title: string;
  slug: string;
  dek?: string | null;
  publishedAt: string;
  image?: Img | null;
  /** The article's section, as a list so cards can take the first one. */
  categories: CategoryRef[];
  tags?: CategoryRef[];
  authors: PersonRef[];
}

export interface Translation {
  language: Lang;
  slug: string;
}

export interface Article extends ArticleCard {
  body?: RichText | null;
  listen?: string | null;
  authorsNote?: RichText | null;
  /** The question on the in-body call for readers' stories. */
  storyPrompt?: string | null;
  photographers?: PersonRef[];
  illustrators?: PersonRef[];
  trending?: boolean | null;
  localJournalismInitiative?: boolean | null;
  format?: string | null;
  series?: CategoryRef | null;
  machineTranslated?: boolean | null;
  seo?: Seo | null;
  translations: Translation[];
  authorsFull: Person[];
}

export interface Category extends CategoryRef {
  description?: string | null;
}

/** A section or topic page, with its slug in each language for the switch. */
export interface TaxonomyPage extends Category {
  alternates?: Partial<Record<"fr" | "en", string | null>> | null;
  total: number;
  articles: ArticleCard[];
}

export interface Person {
  name: string;
  slug: string;
  image?: Img | null;
  role?: string | null;
  bio?: string | null;
  email?: string | null;
}

export interface VideoCard {
  _id: string;
  title: string;
  slug: string;
  /** The language the title and text are in (the page's, else the other). */
  lang?: "fr" | "en";
  /** culture-g | actu | entrevues | dialogues (src/lib/videoKinds.ts). */
  kind?: string | null;
  poster?: Img | null;
  duration?: number | null;
  publishedAt?: string | null;
  categories: CategoryRef[];
}

export interface Video extends VideoCard {
  /** Mux playback ID: streams from https://stream.mux.com/<id>.m3u8. */
  playbackId?: string | null;
  src?: string | null;
  videoUrl?: string | null;
  body?: RichText | null;
  authorsFull: Person[];
  translations: Translation[];
  seo?: Seo | null;
}

export interface PodcastCard {
  _id: string;
  title: string;
  slug: string;
  cover?: Img | null;
  description?: string | null;
  episodeCount: number;
}

export interface Episode {
  _key: string;
  title: string;
  description?: string | null;
  src?: string | null;
  duration?: number | null;
  publishedAt?: string | null;
}

export interface Podcast extends PodcastCard {
  image?: Img | null;
  intro?: string | null;
  episodes: Episode[];
  credits: { role: string; names: string }[];
  note?: string | null;
  translations: Translation[];
  seo?: Seo | null;
}

export interface PartnerStory {
  _id: string;
  title: string;
  url: string;
  image?: Img | null;
  partner?: string | null;
  partnerLogo?: Img | null;
  publishedAt?: string | null;
}

export interface ProgramCard {
  _id: string;
  title: string;
  slug: string;
  image?: Img | null;
  linkTo?: "self" | "podcasts" | null;
}

export interface Program extends ProgramCard {
  tagline?: string | null;
  body?: RichText | null;
  cta?: Cta | null;
  quote?: {
    image?: Img | null;
    text?: string | null;
    attribution?: string | null;
    source?: string | null;
  } | null;
  video?: {
    title?: string | null;
    text?: string | null;
    url?: string | null;
    moreUrl?: string | null;
    moreLabel?: string | null;
  } | null;
  /** "About" copy beside its label, above the CTA. */
  about?: RichText | null;
  /** Latest articles from the program's series. */
  articles: ArticleCard[];
  /** MC Converse: the cohorts' music videos (YouTube). */
  musicVideos: MusicVideo[];
  /** Podcasts program: the shows its cohorts made. */
  podcasts: PodcastCard[];
  alumni: Person[];
  support?: boolean | null;
  form?: { title?: string | null; text?: string | null } | null;
  translations: Translation[];
  seo?: Seo | null;
}

export interface MusicVideo {
  _key: string;
  title: string;
  year?: string | null;
  url: string;
  text?: string | null;
  artists?: string | null;
  mentor?: string | null;
  poster?: Img | null;
}

export interface Position {
  _id: string;
  title: string;
  slug: string;
  meta?: string | null;
  summary?: string | null;
  responsibilities: string[];
  profile: string[];
  translations: Translation[];
}

export interface Seo {
  title?: string | null;
  description?: string | null;
  image?: Img | null;
}

export interface Settings {
  email: string;
  donateUrl?: string | null;
  newsletterAction?: string | null;
  socials: { platform: string; url: string }[];
  menuCategories: CategoryRef[];
  voicePrompt?: string | null;
  seo?: Seo | null;
}

export interface HomeData {
  lead: ArticleCard | null;
  topStories: ArticleCard[];
  videos: VideoCard[];
  podcasts: PodcastCard[];
  partnerStories: PartnerStory[];
  categories: (CategoryRef & { count: number })[];
  ecole?: {
    title?: string | null;
    image?: Img | null;
    text?: string | null;
  } | null;
  seo?: Seo | null;
}

export interface AboutData {
  title?: string | null;
  image?: Img | null;
  intro?: RichText | null;
  /** The two offset paragraphs under the intro; a link closes the second. */
  statements: { _key: string; text: string; cta?: Cta | null }[];
  principlesImage?: Img | null;
  principles: { _key: string; title: string; body?: RichText | null }[];
  /** The numbered values carousel under the principles. */
  valuesTitle?: string | null;
  values: { _key: string; title: string; text?: string | null }[];
  team: Person[];
  collaborators: Person[];
  sections: {
    _key: string;
    title: string;
    kind?: "text" | "series" | "positions" | null;
    body?: RichText | null;
    articles?: ArticleCard[] | null;
    positions?: Position[] | null;
  }[];
  partners: { name: string; logo?: Img | null; url?: string | null }[];
  seo?: Seo | null;
}

export interface EcoleData {
  title?: string | null;
  kicker?: string | null;
  image?: Img | null;
  intro?: RichText | null;
  cta?: Cta | null;
  why?: {
    title?: string | null;
    body?: RichText | null;
    image?: Img | null;
    /** The copy beside the image, over the CTA. */
    aside?: RichText | null;
  } | null;
  approach?: { title?: string | null; body?: RichText | null; image?: Img | null } | null;
  /** Key figures, e.g. { value: "50+", label: "alumni" }. */
  stats: { value: string; label: string }[];
  steps: { title: string; text?: string | null }[];
  programs: ProgramCard[];
  cohorts: { year: number; track: string; count?: number | null }[];
  support?: {
    title?: string | null;
    body?: RichText | null;
    ctas: Cta[];
    partners: { name: string; logo?: Img | null; url?: string | null }[];
  } | null;
  form?: { title?: string | null; text?: string | null } | null;
  seo?: Seo | null;
}

export interface GiveYourVoiceData {
  title?: string | null;
  intro?: string | null;
  openApplication?: { title?: string | null; text?: string | null } | null;
  culture?: { title?: string | null; image?: Img | null; text?: string | null } | null;
  apply?: { title?: string | null; text?: string | null } | null;
  positions: Position[];
  seo?: Seo | null;
}

export interface ContactData {
  title?: string | null;
  subtitle?: string | null;
  links: { prompt?: string | null; cta?: Cta | null }[];
  seo?: Seo | null;
}

/* The slimmed-down card served to search / "load more" as JSON. */
export interface IndexEntry {
  id: string;
  t: string;
  s: string;
  d?: string | null;
  p: string;
  i?: string | null;
  c: CategoryRef[];
  /** Topic slugs. */
  g?: string[];
  a: PersonRef[];
}

export interface DonateData {
  title?: string | null;
  image?: Img | null;
  intro?: RichText | null;
  support?: { title?: string | null; text?: string | null } | null;
  sections: { _key: string; label: string; body?: RichText | null }[];
  /** One Zeffy form per frequency; `zeffyUrl` stands in for any missing. */
  zeffyForms: ZeffyForms;
  zeffyUrl?: string | null;
  /** Dollars: Zeffy's goal for a single form, else the one set on the page. */
  goal?: number | null;
  /** Dollars raised on the Zeffy form (null without the API key). */
  raised?: number | null;
  /** Preset amounts per frequency (dollars), as on the Zeffy form. */
  presets: DonatePresets;
  seo?: Seo | null;
}

export interface ZeffyForms {
  monthly?: string | null;
  annually?: string | null;
  once?: string | null;
}

export interface DonatePresets {
  monthly: number[];
  annually: number[];
  once: number[];
}

export interface StudioData {
  title?: string | null;
  image?: Img | null;
  kicker?: string | null;
  intro?: string | null;
  studios: { _key: string; name: string; text?: string | null; image?: Img | null; bookUrl?: string | null }[];
  seo?: Seo | null;
}
