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
  poster?: Img | null;
  duration?: number | null;
  publishedAt?: string | null;
  categories: CategoryRef[];
}

export interface Video extends VideoCard {
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
  form?: { title?: string | null; text?: string | null } | null;
  translations: Translation[];
  seo?: Seo | null;
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

export interface Card {
  title?: string | null;
  image?: Img | null;
  text?: string | null;
  cta?: Cta | null;
  ctaStyle?: "link" | "button" | null;
}

export interface HomeData {
  lead: ArticleCard | null;
  topStories: ArticleCard[];
  videos: VideoCard[];
  podcasts: PodcastCard[];
  partnerStories: PartnerStory[];
  categories: (CategoryRef & { count: number })[];
  support?: { title?: string | null; text?: string | null; cta?: Cta | null } | null;
  ecole?: {
    title?: string | null;
    image?: Img | null;
    text?: string | null;
    program?: { slug: string } | null;
  } | null;
  seo?: Seo | null;
}

export interface AboutData {
  title?: string | null;
  image?: Img | null;
  intro?: RichText | null;
  team: Person[];
  collaborators: Person[];
  sections: { _key: string; title: string; body?: RichText | null }[];
  partners: { name: string; logo?: Img | null; url?: string | null }[];
  seo?: Seo | null;
}

export interface LaReleveData {
  title?: string | null;
  intro?: RichText | null;
  cta?: Cta | null;
  programs: ProgramCard[];
  seo?: Seo | null;
}

export interface GetInvolvedData {
  title?: string | null;
  intro?: string | null;
  cards: Card[];
  donate?: { title?: string | null; text?: string | null; options: Cta[] } | null;
  cardsAfter: Card[];
  volunteer?: {
    title?: string | null;
    intro?: string | null;
    items: { title: string; text?: string | null }[];
    cta?: Cta | null;
  } | null;
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
