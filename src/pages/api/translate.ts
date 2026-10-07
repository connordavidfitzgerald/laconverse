import type { APIRoute } from "astro";

export const prerender = false;

/* The Studio's Auto-translate (src/sanity/translate) posts the strings of a
   field or a whole document here; they go to Langbly with the server's key.
   Langbly speaks Google Translate's v2 API. Its free tier is 500,000
   characters a month and it bills beyond that, so a monthly spending cap in
   the Langbly dashboard is the real limit; the same-origin check keeps other
   sites' pages from calling this route. */

const LANGS = ["fr", "en"] as const;
type Lang = (typeof LANGS)[number];
const ENDPOINT = "https://api.langbly.com/language/translate/v2";
const MAX_BODY = 512 * 1024;
/* The model behind Langbly is several times faster on one paragraph per call,
   in parallel, than on a batch, so each string is its own call. The Studio
   sends a few strings per request, so a request stays well under the
   function time limit. */
const MAX_TEXTS = 16;
const PARALLEL = 8;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

class LangblyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function translate(key: string, texts: string[], source: Lang, target: Lang, html: boolean) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, source, target, format: html ? "html" : "text" }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    data?: { translations: { translatedText: string }[] };
    error?: { message?: string };
  };
  if (!res.ok || !data.data) {
    console.error("Langbly", res.status, data.error);
    throw new LangblyError(
      res.status === 401 || res.status === 403
        ? "Langbly refused the API key. Check LANGBLY_API_KEY."
        : res.status === 402
          ? "The Langbly account is out of credit or over its spending cap."
          : res.status === 429
            ? "Langbly is busy or the monthly limit is reached. Try again in a moment."
            : `Langbly error ${res.status}${data.error?.message ? `: ${data.error.message}` : "."}`,
      res.status,
    );
  }
  return data.data.translations.map((t) => t.translatedText);
}

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return json({ error: "Translation is only available from the Studio." }, 403);

  const key = import.meta.env.LANGBLY_API_KEY as string | undefined;
  if (!key) return json({ error: "Translation isn't set up: LANGBLY_API_KEY is missing." }, 503);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "Too much text to translate at once." }, 413);
  let body: { source?: string; target?: string; xml?: boolean; texts?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const { source, target, xml, texts } = body;
  const isLang = (l: unknown): l is Lang => LANGS.includes(l as Lang);
  if (
    !isLang(source) ||
    !isLang(target) ||
    source === target ||
    !Array.isArray(texts) ||
    !texts.every((t) => typeof t === "string")
  )
    return json({ error: "Bad request." }, 400);
  if (!texts.length) return json({ texts: [] });

  if (texts.length > MAX_TEXTS) return json({ error: "Too many strings in one request." }, 413);

  /* Rich text comes as markup (`<s i="0">…</s>` per span), so it goes in
     HTML mode, which keeps the tags; plain strings come back unescaped. */
  let results: string[][];
  try {
    results = await mapLimit(texts as string[], PARALLEL, (text) =>
      translate(key, [text], source, target, Boolean(xml)),
    );
  } catch (err) {
    if (err instanceof LangblyError) return json({ error: err.message }, 502);
    throw err;
  }
  return json({ texts: results.flat() });
};
