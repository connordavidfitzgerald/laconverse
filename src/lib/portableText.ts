/* Portable Text → HTML for article bodies and rich page copy. */
import { toHTML, escapeHTML, uriLooksSafe } from "@portabletext/to-html";

import { imageUrl } from "./sanity";
import type { Img, RichText } from "./types";

/* Turn a share URL into an embeddable player where we know how. */
export function embedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com")
      return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`;
    if (host === "open.spotify.com") return `https://open.spotify.com/embed${u.pathname}`;
    if (host === "soundcloud.com")
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}`;
    // Already a player URL from a known host (imported Webflow iframes).
    if (
      /(^|\.)(tiktok\.com|arena\.im|spotify\.com|youtube-nocookie\.com|player\.vimeo\.com)$/.test(
        host,
      ) &&
      /embed|player|\/v\//.test(u.pathname + u.hostname)
    )
      return url;
  } catch {}
  return null;
}

export function renderRichText(value?: RichText | null): string {
  if (!value?.length) return "";
  return toHTML(value as never, {
    onMissingComponent: false,
    components: {
      types: {
        figure: ({ value }: { value: Img }) => {
          const src = imageUrl(value, 1400);
          if (!src) return "";
          const w = value.asset?.metadata?.dimensions?.width;
          const h = value.asset?.metadata?.dimensions?.height;
          const cap = [
            value.caption && `<span>${escapeHTML(value.caption)}</span>`,
            value.credit &&
              `<span class="block uppercase text-[0.5rem] mt-1 opacity-80">${escapeHTML(value.credit)}</span>`,
          ]
            .filter(Boolean)
            .join("");
          return `<figure class="mx-auto max-w-[263px] md:max-w-none"><img src="${src}" alt="${escapeHTML(value.alt ?? "")}" loading="lazy" decoding="async"${w && h ? ` width="${w}" height="${h}"` : ""} />${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
        },
        embed: ({ value }: { value: { url?: string; html?: string } }) => {
          const src = value.url ? embedSrc(value.url) : null;
          if (src)
            return `<div class="embed"><iframe src="${src}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Embedded media"></iframe></div>`;
          if (value.html) return `<div class="embed">${value.html}</div>`;
          if (value.url && uriLooksSafe(value.url))
            return `<p><a href="${escapeHTML(value.url)}" target="_blank" rel="noopener">${escapeHTML(value.url)}</a></p>`;
          return "";
        },
        pullQuote: ({ value }: { value: { text?: string; attribution?: string } }) =>
          `<blockquote><p>${escapeHTML(value.text ?? "")}</p>${value.attribution ? `<footer class="mt-2 text-sm">${escapeHTML(value.attribution)}</footer>` : ""}</blockquote>`,
        callout: ({
          value,
        }: {
          value: { body?: RichText; cta?: { label?: string; url?: string } };
        }) => {
          const button =
            value.cta?.url && value.cta.label && uriLooksSafe(value.cta.url)
              ? `<p class="not-prose"><a href="${escapeHTML(value.cta.url)}" class="label inline-block rounded-[10px] border border-ink px-6 py-3 text-sm no-underline hover:bg-ink hover:text-yellow">${escapeHTML(value.cta.label)}</a></p>`
              : "";
          return `<aside class="callout">${renderRichText(value.body)}${button}</aside>`;
        },
        audio: ({ value }: { value: { src?: string; title?: string } }) =>
          value.src
            ? `<figure><audio controls preload="none" src="${value.src}" class="w-full"></audio>${value.title ? `<figcaption>${escapeHTML(value.title)}</figcaption>` : ""}</figure>`
            : "",
      },
      marks: {
        link: ({ children, value }: { children: string; value?: { href?: string } }) => {
          const url = value?.href ?? "";
          if (!uriLooksSafe(url)) return children;
          const external = /^https?:\/\//.test(url);
          return `<a href="${escapeHTML(url)}"${external ? ' target="_blank" rel="noopener"' : ""}>${children}</a>`;
        },
      },
    },
  });
}

/** Plain text of a body, for reading time and search. */
export function plainText(value?: RichText | null): string {
  if (!value) return "";
  return value
    .map((b) =>
      "children" in b && Array.isArray(b.children)
        ? (b.children as { text?: string }[]).map((c) => c.text ?? "").join("")
        : "",
    )
    .join(" ");
}

export const readingMinutes = (value?: RichText | null) =>
  Math.max(1, Math.round(plainText(value).split(/\s+/).filter(Boolean).length / 220));
