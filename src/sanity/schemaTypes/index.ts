import type { SchemaTypeDefinition } from "sanity";

import {
  ctaType,
  figureType,
  localeCtaType,
  localeRichTextType,
  localeSeoType,
  localeStringType,
  localeTextType,
  richTextType,
  seoType,
} from "./shared";
import {
  articleType,
  categoryType,
  tagType,
  seriesType,
  partnerStoryType,
  personType,
  podcastType,
  positionType,
  programType,
  submissionType,
  videoType,
} from "./documents";
import {
  aboutPageType,
  contactPageType,
  getInvolvedPageType,
  giveYourVoicePageType,
  homePageType,
  laRelevePageType,
  siteSettingsType,
} from "./singletons";

/* Translated as whole documents (linked with the translation plugin). People,
   sections, topics, series and the page singletons are instead one document
   with a French and an English box per field. */
export const translatedTypes = [
  "article",
  "video",
  "podcast",
  "program",
  "position",
  "partnerStory",
];

/* One fixed document each, with the type name as its ID. */
export const singletonTypes = [
  "siteSettings",
  "homePage",
  "aboutPage",
  "laRelevePage",
  "getInvolvedPage",
  "giveYourVoicePage",
  "contactPage",
] as const;

export const schemaTypes: SchemaTypeDefinition[] = [
  articleType,
  categoryType,
  tagType,
  seriesType,
  personType,
  videoType,
  podcastType,
  programType,
  positionType,
  partnerStoryType,
  submissionType,
  siteSettingsType,
  homePageType,
  aboutPageType,
  laRelevePageType,
  getInvolvedPageType,
  giveYourVoicePageType,
  contactPageType,
  figureType,
  localeStringType,
  localeTextType,
  localeRichTextType,
  localeCtaType,
  localeSeoType,
  seoType,
  ctaType,
  richTextType,
];
