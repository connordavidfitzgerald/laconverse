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
  red: "bg-cat-red",
} as const;
const PALETTE = Object.keys(DOT) as (keyof typeof DOT)[];
// Known categories: Sanity and fixture slugs, both locales. Anything else hashes into the palette.
const KNOWN: Record<string, keyof typeof DOT> = {
  "que-du-love": "yellow",
  "nothing-but-love": "yellow",
  quartiers: "green",
  neighbourhoods: "green",
  monde: "blue",
  world: "blue",
  migrations: "violet",
  migration: "violet",
  societe: "pink",
  society: "pink",
  "democratie-pouvoir": "orange",
  "democracy-power": "orange",
  solutions: "red",
};

/** The dot's background class for a category slug. */
export function dotClass(slug: string): string {
  const hash = [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return DOT[KNOWN[slug] ?? PALETTE[hash % PALETTE.length]];
}
