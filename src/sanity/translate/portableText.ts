/* Portable Text through the translator (src/pages/api/translate.ts). Each paragraph goes as one piece of XML with a
   tag per span (`<s i="2">…</s>`), so the sentence is translated whole and
   the translator moves the bold, italic and link spans to where they belong in the
   translation; the spans are rebuilt from the tags in their new order. Images,
   pull quotes, call-outs and audio have their text fields translated; embeds
   are copied as they are. Keys are kept. */
import type { Batch } from "./batch";

type Obj = Record<string, unknown>;
type Span = Obj & { _type: string; text?: string };

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescape = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

function block(value: Obj, batch: Batch): () => Obj {
  const children = (value.children as Span[] | undefined) ?? [];
  if (!children.some((c) => c.text?.trim())) return () => value;
  const xml = children
    .map((c, i) =>
      c._type === "span" ? `<s i="${i}">${escape(c.text ?? "")}</s>` : `<o i="${i}"/>`,
    )
    .join("");
  const get = batch.add(xml, true);
  return () => {
    const out: Span[] = [];
    const used = new Set<number>();
    /* Text the translator left outside the tags (usually a space) joins the next span,
       or the last one at the end. */
    let loose = "";
    const re = /<s i="(\d+)">([\s\S]*?)<\/s>|<o i="(\d+)"\s*\/>/g;
    const xmlOut = get();
    let at = 0;
    for (let m: RegExpExecArray | null; (m = re.exec(xmlOut)); at = re.lastIndex) {
      loose += unescape(xmlOut.slice(at, m.index));
      const i = Number(m[1] ?? m[3]);
      const source = children[i];
      if (!source) continue;
      if (m[1] === undefined) {
        out.push(source);
      } else {
        /* A span the translator split in two keeps its key on the first part only. */
        const key = used.has(i) ? `${source._key}x${out.length}` : source._key;
        out.push({ ...source, _key: key, text: loose + unescape(m[2]) });
        loose = "";
      }
      used.add(i);
    }
    loose += unescape(xmlOut.slice(at));
    const lastSpan = out.filter((c) => c._type === "span").pop();
    if (lastSpan && loose) lastSpan.text += loose;
    /* Inline objects the translator dropped go back at the end rather than vanish. */
    children.forEach((c, i) => c._type !== "span" && !used.has(i) && out.push(c));
    return { ...value, children: out.length ? out : children };
  };
}

/* Plain string fields of an object, translated in place. */
function fields(value: Obj, names: string[], batch: Batch): () => Obj {
  const gets = names.map((n) =>
    typeof value[n] === "string" ? ([n, batch.add(value[n] as string)] as const) : null,
  );
  return () => {
    const out = { ...value };
    for (const g of gets) if (g) out[g[0]] = g[1]();
    return out;
  };
}

export function translatePortableText(value: unknown, batch: Batch): () => unknown[] {
  const items = Array.isArray(value) ? (value as Obj[]) : [];
  const gets = items.map((item): (() => Obj) => {
    switch (item._type) {
      case "block":
        return block(item, batch);
      case "figure":
        return fields(item, ["alt", "caption"], batch);
      case "pullQuote":
        return fields(item, ["text"], batch);
      case "audio":
        return fields(item, ["title"], batch);
      case "callout": {
        const body = translatePortableText(item.body, batch);
        const cta = item.cta ? fields(item.cta as Obj, ["label"], batch) : null;
        return () => ({
          ...item,
          body: item.body ? body() : item.body,
          ...(cta && { cta: cta() }),
        });
      }
      default:
        return () => item;
    }
  });
  return () => gets.map((g) => g());
}
