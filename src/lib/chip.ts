/* Category chip colours, shared by Chip.astro and the browser-side card
   template (searchClient.ts). */

// Full class names so Tailwind sees them (it drops theme colours no class uses).
export const DOT = {
  yellow: "bg-cat-yellow",
  green: "bg-cat-green",
  blue: "bg-cat-blue",
  violet: "bg-cat-violet",
  pink: "bg-cat-pink",
  orange: "bg-cat-orange",
} as const;
const PALETTE = Object.keys(DOT) as (keyof typeof DOT)[];
// Known categories: Sanity and fixture slugs, both locales. Anything else hashes into the palette.
const KNOWN: Record<string, keyof typeof DOT> = {
  cultures: "yellow",
  culture: "yellow",
  "nos-quartiers": "green",
  "our-neighbourhoods": "green",
  "le-meilleur-du-hood": "green",
  "best-of-the-hood": "green",
  "regards-du-monde": "blue",
  "world-perspectives": "blue",
  "les-voix-dailleurs": "blue",
  "voices-from-elsewhere": "blue",
  migrations: "violet",
  migration: "violet",
  "nos-realites": "pink",
  "our-realities": "pink",
  "politique-justice": "orange",
  "politics-justice": "orange",
  "politique-justice-sociale": "orange",
  "social-justice": "orange",
};

/** The dot's background class for a category slug. */
export function dotClass(slug: string): string {
  const hash = [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return DOT[KNOWN[slug] ?? PALETTE[hash % PALETTE.length]];
}
