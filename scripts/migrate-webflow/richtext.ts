/* Webflow rich text (HTML) → Portable Text, using the site's own `richText`
   schema so the output only ever contains block styles and marks the Studio
   knows. Figures, video embeds and custom-code embeds become the matching
   custom blocks. */
import { htmlToBlocks, type DeserializerRule } from "@portabletext/block-tools";
import { Schema } from "@sanity/schema";
import { JSDOM } from "jsdom";

import { key } from "./lib";

/* The converter only needs to know which block styles, marks and object types
   the body allows — the same ones as `richText` in src/sanity/schemaTypes/
   shared.ts. Images are declared as plain objects here because the
   stand-alone schema compiler has no built-in image/hotspot types. */
const schema = Schema.compile({
  name: "migration",
  types: [
    {
      name: "holder",
      type: "object",
      fields: [
        {
          name: "body",
          type: "array",
          of: [
            {
              type: "block",
              styles: [
                { title: "Normal", value: "normal" },
                { title: "Heading", value: "h2" },
                { title: "Subheading", value: "h3" },
                { title: "Quote", value: "blockquote" },
              ],
              lists: [
                { title: "Bullet", value: "bullet" },
                { title: "Numbered", value: "number" },
              ],
              marks: {
                decorators: [
                  { title: "Bold", value: "strong" },
                  { title: "Italic", value: "em" },
                  { title: "Superscript", value: "sup" },
                ],
                annotations: [
                  { name: "link", type: "object", fields: [{ name: "href", type: "string" }] },
                ],
              },
            },
            {
              name: "figure",
              type: "object",
              fields: [
                { name: "alt", type: "string" },
                { name: "caption", type: "string" },
              ],
            },
            {
              name: "embed",
              type: "object",
              fields: [
                { name: "url", type: "string" },
                { name: "html", type: "text" },
              ],
            },
          ],
        },
      ],
    },
  ],
});
const blockContentType = (
  schema.get("holder") as { fields: { name: string; type: never }[] }
).fields.find((f) => f.name === "body")!.type;

export interface RichTextIssue {
  kind: string;
  detail: string;
}

/* Embedly wraps some embeds (TikTok): keep the real player URL. */
function unwrapEmbed(src: string) {
  const url = src.startsWith("//") ? `https:${src}` : src;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("embedly.com") && u.searchParams.get("src"))
      return u.searchParams.get("src")!;
  } catch {}
  return url;
}

/* The body schema has two heading levels; fold Webflow's six into them and
   drop the empty id="" attributes Webflow sprinkles everywhere. */
const normalizeHtml = (html: string) =>
  html
    .replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2")
    .replace(/<(\/?)h[4-6](\s|>)/gi, "<$1h3$2")
    .replace(/\sid=""/g, "");

const rules = (issues: RichTextIssue[]): DeserializerRule[] => [
  {
    deserialize(el, _next, block) {
      const node = el as HTMLElement;
      if (node.tagName?.toLowerCase() !== "figure") return undefined;
      const iframe = node.querySelector("iframe");
      if (iframe?.getAttribute("src"))
        return block({ _type: "embed", url: unwrapEmbed(iframe.getAttribute("src")!) });
      const img = node.querySelector("img");
      if (img?.getAttribute("src")) {
        const caption = node.querySelector("figcaption")?.textContent?.trim();
        return block({
          _type: "figure",
          _sanityAsset: `image@${img.getAttribute("src")}`,
          ...(img.getAttribute("alt") ? { alt: img.getAttribute("alt") } : {}),
          ...(caption ? { caption } : {}),
        });
      }
      issues.push({ kind: "figure", detail: node.outerHTML.slice(0, 200) });
      return undefined;
    },
  },
  {
    // Webflow custom-code embeds: <div class="w-embed">…</div>
    deserialize(el, _next, block) {
      const node = el as HTMLElement;
      if (node.tagName?.toLowerCase() !== "div" || !node.classList?.contains("w-embed"))
        return undefined;
      const iframe = node.querySelector("iframe")?.getAttribute("src");
      return block(
        iframe
          ? { _type: "embed", url: unwrapEmbed(iframe) }
          : { _type: "embed", html: node.innerHTML.trim() },
      );
    },
  },
  {
    deserialize(el, _next, block) {
      const node = el as HTMLElement;
      if (node.tagName?.toLowerCase() !== "iframe" || !node.getAttribute("src")) return undefined;
      return block({ _type: "embed", url: unwrapEmbed(node.getAttribute("src")!) });
    },
  },
  {
    // A lone <img> outside a figure.
    deserialize(el, _next, block) {
      const node = el as HTMLElement;
      if (node.tagName?.toLowerCase() !== "img" || !node.getAttribute("src")) return undefined;
      return block({
        _type: "figure",
        _sanityAsset: `image@${node.getAttribute("src")}`,
        ...(node.getAttribute("alt") ? { alt: node.getAttribute("alt") } : {}),
      });
    },
  },
];

export function htmlToPortableText(html: string | undefined, seed: string) {
  const issues: RichTextIssue[] = [];
  if (!html?.trim()) return { blocks: undefined, issues };
  let n = 0;
  const blocks = htmlToBlocks(normalizeHtml(html), blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
    rules: rules(issues),
    keyGenerator: () => key(seed, String(n++)),
  }) as Record<string, unknown>[];
  // Drop empty paragraphs Webflow leaves behind (<p>‍</p>).
  const cleaned = blocks.filter((b) => {
    if (b._type !== "block") return true;
    const kids = (b.children as { text?: string }[] | undefined) ?? [];
    return kids.some((c) => (c.text ?? "").replace(/[​-‍\s]/g, ""));
  });
  return { blocks: cleaned.length ? cleaned : undefined, issues };
}

/** Blocks for a narrower field (call-out, transparency box): only paragraphs
    and, where allowed, one heading level. Anything else is flattened. */
export function restrictBlocks(blocks: Record<string, unknown>[] | undefined, headings: boolean) {
  return blocks
    ?.filter((b) => b._type === "block")
    .map((b) => ({ ...b, style: headings && /^h[1-6]$/.test(String(b.style)) ? "h3" : "normal" }));
}

/** First paragraph / list items out of an HTML field (for positions). */
export function htmlLists(html: string | undefined) {
  if (!html) return { paragraphs: [] as string[], lists: [] as string[][] };
  const doc = new JSDOM(html).window.document;
  const items = (els: NodeListOf<Element>) =>
    [...els].map((li) => li.textContent?.trim() ?? "").filter(Boolean);
  // Some fields hold bare <li>s with no list around them: one list.
  const lists = [...doc.querySelectorAll("ul, ol")].map((l) => items(l.querySelectorAll("li")));
  return {
    paragraphs: [...doc.querySelectorAll("p")]
      .map((p) => p.textContent?.trim() ?? "")
      .filter(Boolean),
    lists: lists.length
      ? lists
      : items(doc.querySelectorAll("li")).length
        ? [items(doc.querySelectorAll("li"))]
        : [],
  };
}

/** Plain text out of an HTML field. Paragraphs are kept apart — with a blank
    line when `multiline`, a space otherwise — and zero-width characters go. */
export function htmlToText(html?: string, multiline = false) {
  if (!html) return undefined;
  const doc = new JSDOM(html).window.document;
  const body = doc.body;
  body.querySelectorAll("br").forEach((br) => br.replaceWith(doc.createTextNode("\n")));
  const blocks = [...body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote")];
  const parts = (
    blocks.length ? blocks.filter((b) => !b.parentElement?.closest("p, li, blockquote")) : [body]
  )
    .map((b) =>
      b.textContent
        ?.replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(multiline ? /[^\S\n]+/g : /\s+/g, " ")
        .replace(/ *\n */g, "\n")
        .trim(),
    )
    .filter(Boolean);
  return parts.join(multiline ? "\n\n" : " ") || undefined;
}
