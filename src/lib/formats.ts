/* Editorial formats — a fixed list, so they live in code rather than the CMS.
   Shared by the Sanity schema, the site and the Webflow import. */
export const FORMATS = [
  { value: "reportage", fr: "Reportage", en: "Report" },
  { value: "portrait", fr: "Portrait", en: "Profile" },
  { value: "enquete", fr: "Enquête", en: "Investigation" },
  { value: "dialogue", fr: "Dialogue", en: "Dialogue" },
  { value: "balado", fr: "Balado", en: "Podcast" },
  { value: "en-direct", fr: "En direct", en: "Live" },
] as const;

export type Format = (typeof FORMATS)[number]["value"];

export const formatLabel = (value: string | null | undefined, lang: "fr" | "en") =>
  FORMATS.find((f) => f.value === value)?.[lang] ?? null;
