import { defineArrayMember, defineField, defineType } from "sanity";
import { CogIcon } from "@sanity/icons/Cog";
import { HomeIcon } from "@sanity/icons/Home";
import { InfoOutlineIcon } from "@sanity/icons/InfoOutline";
import { UsersIcon } from "@sanity/icons/Users";
import { HeartIcon } from "@sanity/icons/Heart";
import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { EnvelopeIcon } from "@sanity/icons/Envelope";

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
      name: "support",
      title: "Support band",
      type: "object",
      fields: [title, text, cta()],
    }),
    defineField({
      name: "ecole",
      title: "École Converse block",
      type: "object",
      fields: [
        title,
        defineField({ name: "image", type: "figure" }),
        text,
        defineField({ name: "program", type: "reference", to: [{ type: "program" }] }),
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
      description: "News, Careers, Policies, Funding, Alumni…",
      type: "array",
      of: [
        defineArrayMember({
          name: "section",
          type: "object",
          fields: [title, defineField({ name: "body", type: "localeRichText" })],
          preview: { select: { title: "title.fr" } },
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

export const laRelevePageType = defineType({
  name: "laRelevePage",
  title: "La Relève",
  type: "document",
  icon: BulbOutlineIcon,
  fields: [
    title,
    defineField({ name: "intro", type: "localeRichText" }),
    cta(),
    defineField({
      name: "programs",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "program" }] })],
      description: "Leave empty to list every program in its menu order.",
    }),
    seo,
  ],
});

const card = defineArrayMember({
  name: "card",
  type: "object",
  fields: [
    title,
    defineField({ name: "image", type: "figure" }),
    text,
    cta(),
    defineField({
      name: "ctaStyle",
      type: "string",
      options: { list: ["link", "button"], layout: "radio" },
      initialValue: "link",
    }),
  ],
  preview: { select: { title: "title.fr", media: "image" } },
});

export const getInvolvedPageType = defineType({
  name: "getInvolvedPage",
  title: "Get involved",
  type: "document",
  icon: HeartIcon,
  fields: [
    title,
    defineField({ name: "intro", type: "localeText" }),
    defineField({ name: "cards", title: "Sections before Donate", type: "array", of: [card] }),
    defineField({
      name: "donate",
      type: "object",
      fields: [
        title,
        text,
        defineField({
          name: "options",
          type: "array",
          of: [defineArrayMember({ type: "localeCta" })],
        }),
      ],
    }),
    defineField({ name: "cardsAfter", title: "Sections after Donate", type: "array", of: [card] }),
    defineField({
      name: "volunteer",
      type: "object",
      fields: [
        title,
        defineField({ name: "intro", type: "localeText" }),
        defineField({
          name: "items",
          type: "array",
          of: [
            defineArrayMember({
              name: "item",
              type: "object",
              fields: [title, defineField({ name: "text", type: "localeString" })],
              preview: { select: { title: "title.fr" } },
            }),
          ],
        }),
        cta(),
      ],
    }),
    seo,
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
