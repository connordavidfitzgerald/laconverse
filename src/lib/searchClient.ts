/* Browser side of the article index: fetched once per page, shared by search
   and "load more". */
import { DOT, dotClass } from "./chip";
import type { IndexEntry } from "./types";

export type Entry = IndexEntry;

const cache = new Map<string, Promise<Entry[]>>();

export function loadIndex(lang: string): Promise<Entry[]> {
  if (!cache.has(lang))
    cache.set(
      lang,
      fetch(lang === "en" ? "/en/index.json" : "/index.json").then((r) => r.json()),
    );
  return cache.get(lang)!;
}

const paths = {
  fr: { article: "/articles/", category: "/categorie/" },
  en: { article: "/en/articles/", category: "/en/category/" },
} as const;

const dates = {
  en: new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "long", year: "numeric" }),
  fr: new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long", year: "numeric" }),
};

/** Fill a cloned card template with an index entry. */
export function cardLinks(node: DocumentFragment, e: Entry, lang: string) {
  const p = paths[lang as "en" | "fr"] ?? paths.fr;
  const img = node.querySelector("img")!;
  if (e.i) img.src = e.i;
  else img.remove();
  const title = node.querySelector<HTMLAnchorElement>("[data-title]")!;
  title.href = p.article + e.s;
  title.textContent = e.t;
  const chip = node.querySelector<HTMLAnchorElement>("[data-chip]")!;
  if (e.c[0]) {
    chip.href = p.category + e.c[0].slug;
    chip.querySelector("[data-label]")!.textContent = e.c[0].title;
    const dot = chip.querySelector("[data-dot]")!;
    dot.classList.remove(...Object.values(DOT));
    dot.classList.add(dotClass(e.c[0].slug));
  } else chip.remove();
  node.querySelector("[data-author]")!.textContent = e.a[0]?.name ?? "";
  const time = node.querySelector<HTMLTimeElement>("[data-date]")!;
  time.dateTime = e.p;
  time.textContent = dates[lang as "en" | "fr"].format(new Date(e.p));
}

/** Accent- and case-insensitive text for matching. */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
