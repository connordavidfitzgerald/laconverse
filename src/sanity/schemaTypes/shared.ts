import { defineArrayMember, defineField, defineType, type FieldDefinition } from "sanity";

import { LANGUAGES } from "../languages";

export const figureType = defineType({
  name: "figure",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alternative text",
      type: "string",
      description: "What the image shows, for screen readers.",
    }),
    defineField({ name: "caption", type: "string" }),
    defineField({ name: "credit", type: "string" }),
  ],
});

/* Bilingual fields. Every document is shared by both languages: one box per
   language, stored as `{ fr, en }` so GROQ picks a side with `title[$lang]`.
   Short fields sit side by side; longer ones stack. Each pair gets a
   "Translate" button (src/sanity/translate). */
export const localeStringType = defineType({
  name: "localeString",
  title: "Localized string",
  type: "object",
  options: { columns: 2 },
  fields: LANGUAGES.map(({ id, title }) => defineField({ name: id, title, type: "string" })),
});

export const localeTextType = defineType({
  name: "localeText",
  title: "Localized text",
  type: "object",
  fields: LANGUAGES.map(({ id, title }) => defineField({ name: id, title, type: "text", rows: 4 })),
});

export const localeRichTextType = defineType({
  name: "localeRichText",
  title: "Localized rich text",
  type: "object",
  fields: LANGUAGES.map(({ id, title }) => defineField({ name: id, title, type: "richText" })),
});

/* A list of short lines per language (a position's responsibilities). */
export const localeStringListType = defineType({
  name: "localeStringList",
  title: "Localized list",
  type: "object",
  fields: LANGUAGES.map(({ id, title }) =>
    defineField({ name: id, title, type: "array", of: [defineArrayMember({ type: "string" })] }),
  ),
});

/* A short note: paragraphs with bold, italic and links, nothing else (an
   article's transparency box). */
const noteBlock = defineArrayMember({
  type: "block",
  styles: [{ title: "Normal", value: "normal" }],
  lists: [],
  marks: {
    decorators: [
      { title: "Bold", value: "strong" },
      { title: "Italic", value: "em" },
    ],
    annotations: [
      defineArrayMember({
        name: "link",
        type: "object",
        fields: [defineField({ name: "href", type: "string" })],
      }),
    ],
  },
});

export const localeNoteType = defineType({
  name: "localeNote",
  title: "Localized note",
  type: "object",
  fields: LANGUAGES.map(({ id, title }) =>
    defineField({ name: id, title, type: "array", of: [noteBlock] }),
  ),
});

/* A button whose label and link both change with the language (the English
   site's paths live under /en). */
export const localeCtaType = defineType({
  name: "localeCta",
  title: "Call to action",
  type: "object",
  fields: [
    defineField({ name: "label", type: "localeString" }),
    defineField({
      name: "url",
      title: "URL",
      type: "localeString",
      description: "Full URL, or a site path like /engagez-vous (FR) and /en/get-involved (EN).",
    }),
  ],
  preview: {
    select: { fr: "label.fr", en: "label.en" },
    prepare: ({ fr, en }) => ({ title: fr ?? en ?? "Call to action" }),
  },
});

export const localeSeoType = defineType({
  name: "localeSeo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: "title", type: "localeString" }),
    defineField({ name: "description", type: "localeText" }),
    defineField({ name: "image", title: "Share image", type: "image" }),
  ],
});

/* One value per language of any field type that isn't text, like an
   article's audio version. */
export const perLanguage = (
  name: string,
  field: (lang: string) => Omit<FieldDefinition, "name"> | FieldDefinition,
  options: { title?: string; description?: string } = {},
) =>
  defineField({
    name,
    type: "object",
    ...options,
    fields: LANGUAGES.map(
      ({ id, title }) => ({ ...field(id), name: id, title }) as FieldDefinition,
    ),
  });

/* Whether another document of the type already uses `slug` in `lang`. Also
   used by Auto-translate when it makes a slug from a translated title. */
export const slugTaken = (
  client: { fetch: <T>(query: string, params: Record<string, unknown>) => Promise<T> },
  { type, lang, slug, id }: { type?: string; lang: string; slug: string; id?: string },
) =>
  client
    .fetch<number>(
      `count(*[_type == $type && slug[$lang].current == $slug && !(_id in [$id, "drafts." + $id])])`,
      { type, lang, slug, id: id?.replace(/^drafts\./, "") ?? "" },
    )
    .then((count) => count > 0);

type SlugValue = Partial<Record<string, { current?: string }>>;

/* A French and an English slug, each generated from its own title and unique
   among documents of the same type in that language. `require: "fr"`
   (sections, topics, series) always needs the French one; `"any"` (articles
   and the other editorial types) needs at least one, and a slug only in a
   language whose title is filled in. */
export const localeSlugField = (source = "title", { require = "fr" as "fr" | "any" } = {}) =>
  defineField({
    name: "slug",
    type: "object",
    options: { columns: 2 },
    fields: LANGUAGES.map(({ id, title }) =>
      defineField({
        name: id,
        title,
        type: "slug",
        options: {
          source: `${source}.${id}`,
          maxLength: 120,
          isUnique: async (slug, { document, getClient }) =>
            !(await slugTaken(getClient({ apiVersion: "2026-09-01" }), {
              type: document?._type,
              lang: id,
              slug,
              id: document?._id,
            })),
        },
        validation: require === "fr" && id === "fr" ? (rule) => rule.required() : undefined,
      }),
    ),
    validation:
      require === "any"
        ? (rule) =>
            rule.custom((value: SlugValue | undefined, { document }) => {
              const langs = LANGUAGES.filter(({ id }) => value?.[id]?.current);
              if (!langs.length) return "Give the document a French or an English slug.";
              const titles = (document as Record<string, SlugValue> | undefined)?.[source] as
                Partial<Record<string, string>> | undefined;
              const missing = langs.find(({ id }) => !titles?.[id]);
              return missing ? `The ${missing.title} slug needs a ${missing.title} title.` : true;
            })
        : undefined,
  });

/* For `rule.custom()`: the French side is the one every page needs. */
export const frenchRequired = (value: unknown) =>
  (value as { fr?: string } | undefined)?.fr ? true : "The French version is required.";

export const seoType = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: "title", type: "string" }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({ name: "image", title: "Share image", type: "image" }),
  ],
});

export const ctaType = defineType({
  name: "cta",
  title: "Call to action",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string" }),
    defineField({
      name: "url",
      title: "URL",
      type: "string",
      description: "Full URL, or a site path like /get-involved.",
    }),
  ],
});

/* Article/page body. Headings, lists, links, images, embeds, pull quotes and
   audio — everything the Webflow rich text fields produced. */
export const richTextType = defineType({
  name: "richText",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
          { title: "Superscript", value: "sup" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            type: "object",
            fields: [
              defineField({ name: "href", type: "string", validation: (r) => r.required() }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({ type: "figure" }),
    defineArrayMember({
      name: "embed",
      type: "object",
      fields: [
        defineField({
          name: "url",
          title: "URL",
          type: "url",
          description: "YouTube, Vimeo, Spotify, SoundCloud, Instagram…",
        }),
        defineField({
          name: "html",
          title: "Raw embed HTML",
          type: "text",
          rows: 4,
          description: "Only when there is no URL (imported Webflow embeds).",
        }),
      ],
      preview: { select: { title: "url" }, prepare: ({ title }) => ({ title: title ?? "Embed" }) },
    }),
    defineArrayMember({
      name: "pullQuote",
      type: "object",
      fields: [
        defineField({ name: "text", type: "text", rows: 3 }),
        defineField({ name: "attribution", type: "string" }),
      ],
      preview: { select: { title: "text" } },
    }),
    /* Webflow's “CTA Box”: a boxed aside (resources, a donate or newsletter
       ask) that sits between two parts of the story. */
    defineArrayMember({
      name: "callout",
      title: "Call-out box",
      type: "object",
      fields: [
        defineField({
          name: "body",
          type: "array",
          of: [
            defineArrayMember({
              type: "block",
              styles: [
                { title: "Normal", value: "normal" },
                { title: "Heading", value: "h3" },
              ],
              marks: {
                decorators: [
                  { title: "Bold", value: "strong" },
                  { title: "Italic", value: "em" },
                ],
                annotations: [
                  defineArrayMember({
                    name: "link",
                    type: "object",
                    fields: [defineField({ name: "href", type: "string" })],
                  }),
                ],
              },
            }),
          ],
        }),
        defineField({ name: "cta", title: "Button", type: "cta" }),
      ],
      preview: {
        select: { title: "cta.label" },
        prepare: ({ title }) => ({ title: "Call-out box", subtitle: title }),
      },
    }),
    defineArrayMember({
      name: "audio",
      type: "object",
      fields: [
        defineField({ name: "file", type: "file", options: { accept: "audio/*" } }),
        defineField({ name: "title", type: "string" }),
      ],
    }),
  ],
});
