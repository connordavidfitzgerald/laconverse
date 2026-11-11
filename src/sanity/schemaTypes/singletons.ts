import { defineArrayMember, defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons/Cog";
import { HomeIcon } from "@sanity/icons/Home";
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { UsersIcon } from "@sanity/icons/Users";
import { HeartIcon } from "@sanity/icons/Heart";
import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { PinIcon } from "@sanity/icons/Pin";

/* One document per page, shared by both languages, with a fixed ID (the type
   name) that the Studio structure opens directly and the frontend fetches.
   Every piece of copy has a French and an English box; images, people,
   settings and picks of articles and programs are shared (each language's
   page skips a pick that isn't published in it). */

const title = defineField({ name: "title", type: "localeString" });
const text = defineField({ name: "text", type: "localeText" });
const cta = (name = "cta") => defineField({ name, type: "localeCta" });
const seo = defineField({ name: "seo", type: "localeSeo" });

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({ name: "email", type: "string", initialValue: "info@laconverse.com" }),
    defineField({ name: "donateUrl", title: "Donate URL", type: "url" }),
    defineField({
      name: "newsletterAction",
      title: "Newsletter form action URL",
      type: "url",
      description: "Mailchimp / Brevo / Substack form endpoint.",
    }),
    defineField({
      name: "socials",
      type: "array",
      of: [
        defineArrayMember({
          name: "social",
          type: "object",
          fields: [
            defineField({
              name: "platform",
              type: "string",
              options: {
                list: ["instagram", "tiktok", "whatsapp", "linkedin", "facebook", "youtube", "x"],
              },
            }),
            defineField({ name: "url", type: "url" }),
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "menuCategories",
      title: "Categories in the menu",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "category" }] })],
    }),
    defineField({ name: "voicePrompt", title: "Menu voice-note prompt", type: "localeString" }),
    seo,
  ],
});

export const homePageType = defineType({
  name: "homePage",
  title: "Home",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({
      name: "lead",
      title: "Lead story",
      type: "reference",
      to: [{ type: "article" }],
      description:
        "Defaults to the latest article. A language it isn't published in shows its latest article instead.",
    }),
    defineField({
      name: "topStories",
      title: "Top stories",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "article" }] })],
      validation: (r) => r.max(12),
      description: "Leave empty to show the latest articles.",
    }),
    defineField({
      name: "ecole",
      title: "École Converse block",
      type: "object",
      fields: [
        title,
        defineField({ name: "image", type: "figure" }),
        text,
      ],
    }),
    seo,
  ],
});

export const aboutPageType = defineType({
  name: "aboutPage",
  title: "About",
  type: "document",
  icon: InfoOutlineIcon,
  fields: [
    title,
    defineField({ name: "image", type: "figure" }),
    defineField({ name: "intro", type: "localeRichText" }),
    defineField({
      name: "statements",
      description: "The two offset paragraphs under the intro. A link can close each.",
      type: "array",
      of: [
        defineArrayMember({
          name: "statement",
          type: "object",
          fields: [text, cta()],
          preview: { select: { title: "text.fr" } },
        }),
      ],
      validation: (r) => r.max(2),
    }),
    defineField({ name: "principlesImage", title: "Principles image", type: "figure" }),
    defineField({
      name: "principles",
      description: "Numbered in order: 01, 02…",
      type: "array",
      of: [
        defineArrayMember({
          name: "principle",
          type: "object",
          fields: [title, defineField({ name: "body", type: "localeRichText" })],
          preview: { select: { title: "title.fr" } },
        }),
      ],
    }),
    defineField({
      name: "valuesTitle",
      title: "Values title",
      description: "Heading over the values carousel, under the principles.",
      type: "localeString",
    }),
    defineField({
      name: "values",
      description: "The values carousel, numbered in order: 01, 02…",
      type: "array",
      of: [
        defineArrayMember({
          name: "value",
          type: "object",
          fields: [title, text],
          preview: { select: { title: "title.fr", subtitle: "text.fr" } },
        }),
      ],
    }),
    defineField({
      name: "team",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
    }),
    defineField({
      name: "collaborators",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }] })],
    }),
    defineField({
      name: "sections",
      title: "Expanding sections",
      description: "News, Careers, Funding…",
      type: "array",
      of: [
        defineArrayMember({
          name: "section",
          type: "object",
          fields: [
            title,
            defineField({
              name: "kind",
              title: "Lists",
              type: "string",
              description: "What the section lists under its text.",
              options: {
                list: [
                  { title: "Nothing (text only)", value: "text" },
                  { title: "A series' articles", value: "series" },
                  { title: "Open positions", value: "positions" },
                ],
                layout: "radio",
              },
              initialValue: "text",
            }),
            defineField({
              name: "series",
              type: "reference",
              to: [{ type: "series" }],
              hidden: ({ parent }) => parent?.kind !== "series",
            }),
            defineField({ name: "body", type: "localeRichText" }),
          ],
          preview: { select: { title: "title.fr", subtitle: "kind" } },
        }),
      ],
    }),
    defineField({
      name: "partners",
      type: "array",
      of: [
        defineArrayMember({
          name: "partner",
          type: "object",
          fields: [
            defineField({ name: "name", type: "string" }),
            defineField({ name: "logo", type: "image" }),
            defineField({ name: "url", type: "url" }),
          ],
          preview: { select: { title: "name", media: "logo" } },
        }),
      ],
    }),
    seo,
  ],
});

/* École Converse. The type and ID are still `laRelevePage` (the page's old
   name) so the existing document didn't have to be migrated. */
export const laRelevePageType = defineType({
  name: "laRelevePage",
  title: "École Converse",
  type: "document",
  icon: BulbOutlineIcon,
  groups: [
    { name: "students", title: "Students", default: true },
    { name: "funders", title: "Funders" },
  ],
  fields: [
    { ...title, group: ["students", "funders"] },
    defineField({
      name: "kicker",
      type: "localeString",
      description: "One line under the title.",
      group: "students",
    }),
    defineField({
      name: "image",
      title: "Hero image",
      type: "figure",
      description: "Full-width photo behind the title.",
      group: "students",
    }),
    defineField({ name: "intro", type: "localeRichText", group: "students" }),
    { ...cta(), group: "students" },
    defineField({
      name: "why",
      title: "Why École Converse",
      type: "object",
      group: ["students", "funders"],
      fields: [
        title,
        defineField({ name: "body", title: "Lead", type: "localeRichText" }),
        defineField({ name: "image", type: "figure" }),
        defineField({
          name: "aside",
          title: "Text beside the image",
          description: "Sits over the page's button (Call to action above).",
          type: "localeRichText",
        }),
      ],
    }),
    defineField({
      name: "approach",
      type: "object",
      group: "students",
      fields: [
        title,
        defineField({ name: "body", type: "localeRichText" }),
        defineField({ name: "image", type: "figure" }),
      ],
    }),
    defineField({
      name: "stats",
      title: "Key figures",
      type: "array",
      group: "funders",
      of: [
        defineArrayMember({
          name: "stat",
          type: "object",
          fields: [
            defineField({ name: "value", type: "string", description: "e.g. 50+" }),
            defineField({ name: "label", type: "localeString" }),
          ],
          preview: { select: { title: "value", subtitle: "label.fr" } },
        }),
      ],
      validation: (r) => r.max(4),
    }),
    defineField({
      name: "steps",
      title: "How it works",
      type: "array",
      group: "students",
      of: [
        defineArrayMember({
          name: "step",
          type: "object",
          fields: [title, text],
          preview: { select: { title: "title.fr" } },
        }),
      ],
    }),
    defineField({
      name: "programs",
      type: "array",
      group: "students",
      of: [defineArrayMember({ type: "reference", to: [{ type: "program" }] })],
      description: "Leave empty to list every program in its menu order.",
    }),
    defineField({
      name: "cohorts",
      title: "Past cohorts",
      type: "array",
      group: "funders",
      of: [
        defineArrayMember({
          name: "cohort",
          type: "object",
          fields: [
            defineField({ name: "year", type: "number" }),
            defineField({ name: "track", type: "localeString", description: "e.g. Journalism" }),
            defineField({ name: "count", title: "Participants", type: "number" }),
          ],
          preview: { select: { title: "track.fr", subtitle: "year" } },
        }),
      ],
    }),
    defineField({
      name: "support",
      title: "Support the school",
      type: "object",
      group: "funders",
      fields: [
        title,
        defineField({ name: "body", type: "localeRichText" }),
        defineField({
          name: "ctas",
          title: "Buttons",
          type: "array",
          of: [defineArrayMember({ type: "localeCta" })],
          validation: (r) => r.max(2),
        }),
        defineField({
          name: "partners",
          type: "array",
          of: [
            defineArrayMember({
              name: "partner",
              type: "object",
              fields: [
                defineField({ name: "name", type: "string" }),
                defineField({ name: "logo", type: "image" }),
                defineField({ name: "url", type: "url" }),
              ],
              preview: { select: { title: "name", media: "logo" } },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "form",
      title: "Sign-up form",
      type: "object",
      group: "students",
      fields: [
        defineField({ name: "title", type: "localeString" }),
        defineField({ name: "text", type: "localeText" }),
      ],
    }),
    { ...seo, group: ["students", "funders"] },
  ],
});

export const giveYourVoicePageType = defineType({
  name: "giveYourVoicePage",
  title: "Give your voice (careers)",
  type: "document",
  icon: UsersIcon,
  fields: [
    title,
    defineField({ name: "intro", type: "localeText" }),
    defineField({ name: "openApplication", type: "object", fields: [title, text] }),
    defineField({
      name: "culture",
      type: "object",
      fields: [title, defineField({ name: "image", type: "figure" }), text],
    }),
    defineField({
      name: "apply",
      title: "Position page form",
      type: "object",
      fields: [title, text],
    }),
    seo,
  ],
});

export const contactPageType = defineType({
  name: "contactPage",
  title: "Contact",
  type: "document",
  icon: EnvelopeIcon,
  fields: [
    title,
    defineField({ name: "subtitle", type: "localeString" }),
    defineField({
      name: "image",
      type: "figure",
      description: "The illustration under the title (defaults to the tin-can phones).",
    }),
    defineField({ name: "intro", type: "localeText", description: "The lead under the illustration." }),
    defineField({
      name: "links",
      type: "array",
      of: [
        defineArrayMember({
          name: "contactLink",
          type: "object",
          fields: [defineField({ name: "prompt", type: "localeString" }), cta()],
          preview: { select: { title: "cta.label.fr", subtitle: "prompt.fr" } },
        }),
      ],
    }),
    seo,
  ],
});

export const donatePageType = defineType({
  name: "donatePage",
  title: "Donate",
  type: "document",
  icon: HeartIcon,
  groups: [
    { name: "page", title: "Page", default: true },
    { name: "zeffy", title: "Zeffy" },
  ],
  fields: [
    { ...title, group: "page" },
    defineField({ name: "image", type: "figure", group: "page" }),
    defineField({
      name: "intro",
      type: "localeRichText",
      group: "page",
      description: "A ♥ at the end of a paragraph shows as the pink heart.",
    }),
    defineField({
      name: "support",
      title: "Donate box",
      description: "Also shown on the homepage.",
      type: "object",
      group: "page",
      fields: [title, text],
    }),
    defineField({
      name: "sections",
      description: "Label on the left, text on the right (What will your donation support?, About us…).",
      type: "array",
      group: "page",
      of: [
        defineArrayMember({
          name: "section",
          type: "object",
          fields: [
            defineField({ name: "label", type: "localeString" }),
            defineField({ name: "body", type: "localeRichText" }),
          ],
          preview: { select: { title: "label.fr" } },
        }),
      ],
    }),
    defineField({
      name: "zeffyForms",
      title: "Zeffy forms, one per frequency",
      description:
        "Each form's public link, e.g. https://www.zeffy.com/fr-CA/donation-form/…. Give each form only its own frequency in Zeffy: the site opens the one matching the donor's choice, with the amount filled in.",
      type: "object",
      group: "zeffy",
      options: { columns: 3 },
      fields: [
        defineField({ name: "monthly", title: "Monthly form", type: "url" }),
        defineField({ name: "annually", title: "Annual form", type: "url" }),
        defineField({ name: "once", title: "One-time form", type: "url" }),
      ],
    }),
    defineField({
      name: "zeffyUrl",
      title: "Fallback Zeffy form",
      description: "Used for any frequency without its own form above.",
      type: "url",
      group: "zeffy",
    }),
    defineField({
      name: "goal",
      title: "Goal ($)",
      description:
        "The bar fills toward this; the amount raised is the forms' total, from Zeffy. With a single form, that form's own Zeffy goal wins; with several, this one does.",
      type: "number",
      validation: (r) => r.min(1),
      group: "zeffy",
    }),
    defineField({
      name: "presets",
      title: "Preset amounts ($)",
      description:
        "Up to four per frequency. Keep them the same as each Zeffy form's suggested amounts so the two match.",
      type: "object",
      group: "zeffy",
      options: { columns: 3 },
      fields: (
        [
          ["monthly", "Monthly", [5, 10, 15, 25]],
          ["annually", "Annually", [120, 200, 350, 500]],
          ["once", "One time", [50, 100, 150, 200]],
        ] as const
      ).map(([name, title, initialValue]) =>
        defineField({
          name,
          title,
          type: "array",
          of: [defineArrayMember({ type: "number", validation: (r) => r.min(1) })],
          initialValue: [...initialValue],
          validation: (r) => r.max(4),
        }),
      ),
    }),
    { ...seo, group: "page" },
  ],
});

export const studioPageType = defineType({
  name: "studioPage",
  title: "Studio Converse",
  type: "document",
  icon: PinIcon,
  fields: [
    title,
    defineField({ name: "image", type: "figure" }),
    defineField({ name: "kicker", type: "localeString", description: "The first line of the intro." }),
    defineField({ name: "intro", type: "localeText" }),
    defineField({
      name: "studios",
      type: "array",
      of: [
        defineArrayMember({
          name: "studio",
          type: "object",
          fields: [
            defineField({ name: "name", type: "localeString" }),
            defineField({ name: "image", type: "figure" }),
            text,
            defineField({ name: "bookUrl", title: "Booking link", type: "url" }),
          ],
          preview: { select: { title: "name.fr", media: "image" } },
        }),
      ],
    }),
    seo,
  ],
});

