import { defineArrayMember, defineField, defineType } from "sanity";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { TagIcon } from "@sanity/icons/Tag";
import { TagsIcon } from "@sanity/icons/Tags";
import { StackIcon } from "@sanity/icons/Stack";
import { UserIcon } from "@sanity/icons/User";
import { PlayIcon } from "@sanity/icons/Play";
import { MicrophoneIcon } from "@sanity/icons/Microphone";
import { RocketIcon } from "@sanity/icons/Rocket";
import { CaseIcon } from "@sanity/icons/Case";
import { LinkIcon } from "@sanity/icons/Link";
import { EnvelopeIcon } from "@sanity/icons/Envelope";

import { LANGUAGES } from "../languages";
import { frenchRequired, localeSlugField, perLanguage } from "./shared";
import { FORMATS } from "../../lib/formats";

const hiddenWebflowId = defineField({
  name: "webflowId",
  title: "Webflow ID",
  type: "string",
  readOnly: true,
  hidden: ({ value }) => !value,
  description: "Set by the Webflow import. Used for re-imports and redirects.",
});

/* Set by Auto-translate (and the Webflow import) on the language it filled
   in; the page then says it was translated. Editors clear it once the
   translation has been reviewed. */
const machineTranslated = defineField({
  name: "machineTranslated",
  title: "Machine-translated",
  type: "string",
  description: "This language was translated automatically. Clear it once reviewed.",
  options: {
    list: LANGUAGES.map(({ id, title }) => ({ value: id, title })),
    layout: "radio",
    direction: "horizontal",
  },
  hidden: ({ value }) => !value,
});

/* Articles, videos, podcasts, programs and positions are one document for
   both languages. A document is on the site in each language whose slug is
   set, so an article can be French only until its English side is filled. */
const title = defineField({
  name: "title",
  type: "localeString",
  validation: (r) =>
    r.custom((value: { fr?: string; en?: string } | undefined) =>
      value?.fr || value?.en ? true : "A French or an English title is required.",
    ),
});
const slug = localeSlugField("title", { require: "any" });
const seo = defineField({ name: "seo", type: "localeSeo" });

/* French title first; the subtitle says which languages the document is
   published in. Partner stories have no slug, so their titles say it. */
const bilingualPreview = (extra: Record<string, string> = {}, by: "slug" | "title" = "slug") => ({
  select: {
    fr: "title.fr",
    en: "title.en",
    hasFr: by === "slug" ? "slug.fr.current" : "title.fr",
    hasEn: by === "slug" ? "slug.en.current" : "title.en",
    ...extra,
  },
  prepare: ({ fr, en, hasFr, hasEn, media, date }: Record<string, string | undefined>) => ({
    title: fr ?? en ?? "Untitled",
    media: media as never,
    subtitle: [
      [hasFr && "FR", hasEn && "EN"].filter(Boolean).join(" · ") || "No language yet",
      date?.slice(0, 10),
    ]
      .filter(Boolean)
      .join(" — "),
  }),
});

export const articleType = defineType({
  name: "article",
  title: "Article",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    title,
    slug,
    defineField({ name: "dek", title: "Summary", type: "localeText" }),
    defineField({ name: "image", title: "Main image", type: "figure" }),
    defineField({
      name: "category",
      title: "Section",
      description: "The rubrique the story is filed under. Leave empty for La Converse's own news.",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "tags",
      title: "Topics",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "tag" }],
        }),
      ],
    }),
    defineField({
      name: "authors",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
    }),
    defineField({
      name: "format",
      type: "string",
      options: { list: FORMATS.map(({ value, fr, en }) => ({ value, title: `${fr} / ${en}` })) },
    }),
    defineField({
      name: "series",
      type: "reference",
      to: [{ type: "series" }],
    }),
    defineField({
      name: "photographers",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
    }),
    defineField({
      name: "illustrators",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: "authorsNote",
      title: "Transparency box",
      description: "A note from the journalist on how the story came about.",
      type: "localeNote",
    }),
    defineField({ name: "trending", type: "boolean", initialValue: false }),
    defineField({
      name: "localJournalismInitiative",
      title: "Local Journalism Initiative",
      description: "Shows the LJI credit line on the article.",
      type: "boolean",
      initialValue: false,
    }),
    perLanguage("listen", () => ({ type: "file", options: { accept: "audio/*" } }), {
      title: "Audio version",
      description:
        "Shown as “Listen to the article”. Generated by `npm run tts`; upload a file here to use a human reading instead.",
    }),
    defineField({
      name: "listenSource",
      title: "Audio source hash",
      type: "object",
      readOnly: true,
      hidden: true,
      description: "Set by `npm run tts`: which version of the text each audio file reads.",
      fields: LANGUAGES.map(({ id }) => defineField({ name: id, type: "string" })),
    }),
    defineField({ name: "body", type: "localeRichText" }),
    seo,
    machineTranslated,
    hiddenWebflowId,
  ],
  orderings: [
    { title: "Newest", name: "newest", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
  preview: bilingualPreview({ media: "image", date: "publishedAt" }),
});

/* Sections, topics and series are one document for both languages: the
   title, slug and description each have a French and an English box. */
const taxonomyFields = [
  defineField({
    name: "title",
    type: "localeString",
    validation: (r) => r.custom(frenchRequired),
  }),
  localeSlugField(),
  defineField({ name: "description", type: "localeText" }),
];
const taxonomyPreview = {
  select: { fr: "title.fr", en: "title.en" },
  prepare: ({ fr, en }: { fr?: string; en?: string }) => ({
    title: fr ?? en,
    subtitle: en && en !== fr ? en : undefined,
  }),
};

/* Sections (rubriques): Société, Quartiers, Démocratie & pouvoir… */
export const categoryType = defineType({
  name: "category",
  title: "Section",
  type: "document",
  icon: TagIcon,
  fields: [
    ...taxonomyFields,
    defineField({
      name: "order",
      type: "number",
      description: "Position in the menu and filters.",
    }),
    hiddenWebflowId,
  ],
  preview: taxonomyPreview,
  orderings: [{ title: "Menu order", name: "order", by: [{ field: "order", direction: "asc" }] }],
});

/* Topics that cut across sections (Jeunesse, Racisme, Élections…). */
export const tagType = defineType({
  name: "tag",
  title: "Topic",
  type: "document",
  icon: TagsIcon,
  fields: [...taxonomyFields, hiddenWebflowId],
  preview: taxonomyPreview,
  orderings: [{ title: "Title", name: "title", by: [{ field: "title.fr", direction: "asc" }] }],
});

/* Recurring series: Hood Heroes, Dialogues, Lettres de La Converse… */
export const seriesType = defineType({
  name: "series",
  title: "Series",
  type: "document",
  icon: StackIcon,
  fields: taxonomyFields,
  preview: taxonomyPreview,
});

/* Journalists, team members and collaborators — one record per person, shared
   by both languages; only the role and bio are translated. */
export const personType = defineType({
  name: "person",
  title: "Person",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "image", title: "Portrait", type: "figure" }),
    defineField({ name: "role", type: "localeString" }),
    defineField({ name: "bio", type: "localeText" }),
    defineField({ name: "email", type: "string" }),
    defineField({
      name: "group",
      title: "Shown on the About page as",
      type: "string",
      options: {
        list: [
          { title: "Team", value: "team" },
          { title: "Collaborator", value: "collaborator" },
        ],
        layout: "radio",
      },
    }),
    defineField({ name: "order", type: "number" }),
    hiddenWebflowId,
  ],
  preview: { select: { title: "name", subtitle: "role.en", media: "image" } },
});

export const videoType = defineType({
  name: "video",
  title: "Video",
  type: "document",
  icon: PlayIcon,
  fields: [
    title,
    slug,
    defineField({ name: "poster", type: "figure" }),
    defineField({
      name: "file",
      title: "Video file",
      type: "file",
      options: { accept: "video/*" },
    }),
    defineField({
      name: "videoUrl",
      title: "Or video URL",
      type: "url",
      description: "YouTube, Vimeo or a direct .mp4 link.",
    }),
    defineField({ name: "duration", title: "Duration (seconds)", type: "number" }),
    defineField({
      name: "category",
      title: "Section",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({ name: "series", type: "reference", to: [{ type: "series" }] }),
    defineField({
      name: "authors",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({ name: "body", type: "localeRichText" }),
    seo,
    machineTranslated,
    hiddenWebflowId,
  ],
  orderings: [
    { title: "Newest", name: "newest", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
  preview: bilingualPreview({ media: "poster", date: "publishedAt" }),
});

export const podcastType = defineType({
  name: "podcast",
  title: "Podcast",
  type: "document",
  icon: MicrophoneIcon,
  fields: [
    title,
    slug,
    defineField({ name: "cover", title: "Square cover", type: "figure" }),
    defineField({ name: "image", title: "Header photo", type: "figure" }),
    defineField({ name: "description", title: "Short description", type: "localeText" }),
    defineField({ name: "intro", type: "localeText" }),
    defineField({
      name: "episodes",
      type: "array",
      of: [
        defineArrayMember({
          name: "episode",
          type: "object",
          fields: [
            defineField({ name: "title", type: "localeString" }),
            defineField({ name: "description", type: "localeText" }),
            defineField({ name: "audio", type: "file", options: { accept: "audio/*" } }),
            defineField({ name: "audioUrl", title: "Or audio URL", type: "url" }),
            defineField({ name: "duration", title: "Duration (seconds)", type: "number" }),
            defineField({ name: "publishedAt", type: "date" }),
          ],
          preview: {
            select: { fr: "title.fr", en: "title.en", subtitle: "publishedAt" },
            prepare: ({ fr, en, subtitle }) => ({ title: fr ?? en, subtitle }),
          },
        }),
      ],
    }),
    defineField({
      name: "credits",
      type: "array",
      of: [
        defineArrayMember({
          name: "credit",
          type: "object",
          fields: [
            defineField({ name: "role", type: "localeString" }),
            defineField({ name: "names", type: "string" }),
          ],
          preview: { select: { title: "role.fr", subtitle: "names" } },
        }),
      ],
    }),
    defineField({ name: "note", title: "Funding note", type: "localeText" }),
    defineField({ name: "order", type: "number" }),
    seo,
    machineTranslated,
    hiddenWebflowId,
  ],
  preview: bilingualPreview({ media: "cover" }),
});

/* La Relève programs: École Converse, MC Converse, Podcasts, Events… */
export const programType = defineType({
  name: "program",
  title: "Program",
  type: "document",
  icon: RocketIcon,
  fields: [
    title,
    slug,
    defineField({ name: "image", type: "figure" }),
    defineField({
      name: "tagline",
      type: "localeText",
      description: "Bold line under the image.",
    }),
    defineField({ name: "body", type: "localeRichText" }),
    defineField({ name: "cta", type: "localeCta" }),
    defineField({
      name: "quote",
      type: "object",
      fields: [
        defineField({ name: "image", type: "figure" }),
        defineField({ name: "text", type: "localeText" }),
        defineField({ name: "attribution", type: "string" }),
        defineField({ name: "source", type: "localeString" }),
      ],
    }),
    defineField({
      name: "form",
      title: "Sign-up form",
      type: "object",
      description: "Leave empty for no form.",
      fields: [
        defineField({ name: "title", type: "localeString" }),
        defineField({ name: "text", type: "localeText" }),
      ],
    }),
    defineField({
      name: "linkTo",
      title: "Card links to",
      type: "string",
      description: "Where the La Relève card goes. Defaults to this program's own page.",
      options: {
        list: [
          { title: "This program page", value: "self" },
          { title: "Podcasts index", value: "podcasts" },
        ],
        layout: "radio",
      },
      initialValue: "self",
    }),
    defineField({ name: "order", type: "number" }),
    seo,
    machineTranslated,
  ],
  preview: bilingualPreview({ media: "image" }),
});

export const positionType = defineType({
  name: "position",
  title: "Open position",
  type: "document",
  icon: CaseIcon,
  fields: [
    title,
    slug,
    defineField({
      name: "meta",
      title: "Type · location",
      type: "localeString",
      description: "e.g. Full-time · Montréal",
    }),
    defineField({ name: "summary", type: "localeText" }),
    defineField({ name: "responsibilities", type: "localeStringList" }),
    defineField({ name: "profile", title: "Ideal profile", type: "localeStringList" }),
    defineField({ name: "open", type: "boolean", initialValue: true }),
    defineField({ name: "order", type: "number" }),
    machineTranslated,
  ],
  preview: bilingualPreview(),
});

/* Stories from partner outlets, shown in the Independent Media Portal rail
   of each language whose title is filled in. */
export const partnerStoryType = defineType({
  name: "partnerStory",
  title: "Partner story",
  type: "document",
  icon: LinkIcon,
  fields: [
    title,
    defineField({ name: "url", title: "URL", type: "url", validation: (r) => r.required() }),
    defineField({ name: "image", type: "figure" }),
    defineField({ name: "partner", type: "string", title: "Outlet name" }),
    defineField({ name: "partnerLogo", type: "image" }),
    defineField({ name: "publishedAt", type: "date" }),
  ],
  preview: bilingualPreview({ media: "image", date: "publishedAt" }, "title"),
});

/* Inbox: voice notes, written stories, applications and contact messages sent
   from the site. Created by the API routes, never by hand. */
export const submissionType = defineType({
  name: "submission",
  title: "Submission",
  type: "document",
  icon: EnvelopeIcon,
  readOnly: ({ currentUser }) => !currentUser?.roles.some((r) => r.name === "administrator"),
  fields: [
    defineField({
      name: "kind",
      type: "string",
      options: {
        list: [
          { title: "Voice note", value: "voice" },
          { title: "Written story", value: "text" },
          { title: "Application", value: "application" },
          { title: "Program sign-up", value: "program" },
          { title: "Contact", value: "contact" },
        ],
      },
    }),
    defineField({
      name: "status",
      type: "string",
      options: { list: ["new", "read", "archived"], layout: "radio" },
      initialValue: "new",
      readOnly: false,
    }),
    defineField({ name: "audio", type: "file" }),
    defineField({ name: "cv", title: "CV", type: "file" }),
    defineField({ name: "message", type: "text" }),
    defineField({ name: "name", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "phone", type: "string" }),
    defineField({ name: "interests", type: "string" }),
    defineField({
      name: "context",
      type: "string",
      description: "Which form or position it came from.",
    }),
    defineField({ name: "language", type: "string" }),
    defineField({ name: "submittedAt", type: "datetime" }),
  ],
  orderings: [
    { title: "Newest", name: "newest", by: [{ field: "submittedAt", direction: "desc" }] },
  ],
  preview: {
    select: {
      kind: "kind",
      name: "name",
      context: "context",
      date: "submittedAt",
      status: "status",
    },
    prepare: ({ kind, name, context, date, status }) => ({
      title: `${status === "new" ? "● " : ""}${name || "Anonymous"}`,
      subtitle: [kind, context, date?.slice(0, 10)].filter(Boolean).join(" · "),
    }),
  },
});
