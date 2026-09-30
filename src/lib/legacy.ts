/* Old Webflow item URLs whose new home is not a 1:1 slug swap (so they can't
   be plain Astro redirects): authors, whose slugs had spaces, and item pages
   that now collapse into an index. Each section has its own tiny route file
   under src/pages/<section>/[slug].ts (and /en/…). */
import type { APIContext } from "astro";

import { href, type Lang } from "../i18n";
import { slugify } from "./slugify";

const collapse: Record<string, Parameters<typeof href>[1]> = {
  categorytag: "search",
  // Old topic tags with a known successor are in src/redirects.json.
  tag: "search",
  "video-tags": "videos",
  videos: "videos",
  "balados-episodes": "podcasts",
};

export type LegacySection = "people" | keyof typeof collapse;

export function legacyRedirect(
  lang: Lang,
  section: LegacySection,
  { params, redirect }: APIContext,
) {
  const slug = decodeURIComponent(params.slug ?? "");
  if (section === "people") return redirect(href(lang, "author", slugify(slug)), 301);
  return redirect(href(lang, collapse[section as keyof typeof collapse]), 301);
}
