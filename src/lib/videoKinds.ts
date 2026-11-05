/* What a video is (the client's list) — a fixed set, so it lives in code
   like the article formats. Shared by the Sanity schema and the site. */
export const VIDEO_KINDS = [
  { value: "culture-g", fr: "Culture G", en: "Explainers" },
  { value: "actu", fr: "Actu", en: "News" },
  { value: "entrevues", fr: "Entrevues", en: "Interviews" },
  { value: "dialogues", fr: "Dialogues", en: "Conversations" },
] as const;

export type VideoKind = (typeof VIDEO_KINDS)[number]["value"];

export const videoKindLabel = (value: string | null | undefined, lang: "fr" | "en") =>
  VIDEO_KINDS.find((k) => k.value === value)?.[lang] ?? null;
