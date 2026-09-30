/* Step 3b — translate what the English site is still missing.
 *
 *   npm run migrate:translate                 # everything pending, newest first
 *   npm run migrate:translate -- --limit 20   # just the 20 newest documents
 *
 * Reads .migration/out/to-translate.en.json (written by transform.ts), sends
 * each document's strings to Claude, and saves the results in the
 * translation memory (translations/en/articles/<document id>.json). Re-run
 * transform afterwards: every document whose strings are all translated gets
 * its English version.
 *
 * Resumable: strings already in the memory are skipped, so an interrupted
 * run just picks up where it stopped. Needs ANTHROPIC_API_KEY in .env;
 * TRANSLATE_MODEL and TRANSLATE_CONCURRENCY are optional. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { OUT, exists, readJson } from "./lib";
import { TRANSLATIONS, loadMemory } from "./translation";

const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.TRANSLATE_MODEL ?? "claude-opus-5-5";
const CONCURRENCY = Number(process.env.TRANSLATE_CONCURRENCY ?? 4);
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const LIMIT = Number(arg("limit") ?? Infinity);
/* Words per request: long articles go in several parts. */
const CHUNK_WORDS = 3500;

if (!KEY) {
  console.error("Set ANTHROPIC_API_KEY in .env first (https://console.anthropic.com → API keys).");
  process.exit(1);
}

interface Todo {
  documents: Record<string, { type: string; title: string; strings: string[] }>;
}
const todo = readJson<Todo>(join(OUT, "to-translate.en.json"));
const memory = loadMemory();

/* Newest first, so the English home page fills up first. */
const published = new Map<string, string>();
for (const line of readFileSync(join(OUT, "import.ndjson"), "utf8").split("\n")) {
  if (!line) continue;
  const d = JSON.parse(line) as { _id: string; publishedAt?: string };
  if (d.publishedAt) published.set(d._id, d.publishedAt);
}
const queue = Object.entries(todo.documents)
  .map(([id, d]) => ({ id, ...d, strings: d.strings.filter((s) => !memory.has(s)) }))
  .filter((d) => d.strings.length)
  .sort((a, b) => (published.get(b.id) ?? "").localeCompare(published.get(a.id) ?? ""))
  .slice(0, LIMIT);

/* The site's own terms (sections, topics, series, roles), so they read the
   same everywhere: the short entries of the hand-written memory. */
const glossary = Object.entries(
  readJson<Record<string, string>>(join(TRANSLATIONS, "site.json")),
).filter(([fr]) => fr.length <= 30 && !/[:.]/.test(fr));

const SYSTEM = `You translate articles for La Converse, an independent Montréal newsroom that covers marginalized communities (racialized, immigrant, Indigenous, working-class), from Canadian French into English for its English edition.

Style:
- Canadian English spelling and conventions (neighbourhood, honour, centre; "Montréal" keeps its accent; CEGEP; Quebec without accent in English).
- Journalistic, faithful and natural. Keep the reporter's voice, register and rhythm; don't summarize, add, soften or editorialize.
- Quotes: translate them, keeping their tone (slang stays slang). Use curly double quotes “ ” for quoted speech in English.
- Keep names of people, organizations, places, programs and titles of works as they are, unless an official English name exists (e.g. Université de Montréal stays; Médecins Sans Frontières stays; "loi 21" → "Bill 21"; "la CAQ" stays CAQ).
- Keep inclusive intent: French inclusive forms (étudiant·e·s) become neutral English (students).
- Keep URLs, handles, hashtags, emoji and numbers exactly.

Format:
- Some strings contain inline tags: <strong>, <em>, <sup>, and link tags <l1>, <l2>… Keep every tag, balanced, around the English words that correspond. Never add, rename or drop tags. Keep &amp; &lt; &gt; entities as entities.
- You receive a JSON object of numbered strings. Reply with only a JSON object with exactly the same keys, each value the English translation. No commentary.

Glossary (French → English, use consistently):
${glossary.map(([fr, en]) => `${fr} → ${en}`).join("\n")}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ask(
  strings: string[],
  context: string,
  attempt = 0,
): Promise<Record<string, string>> {
  const input = Object.fromEntries(strings.map((s, i) => [String(i + 1), s]));
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 32000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `${context}\n\n${JSON.stringify(input, null, 1)}` }],
    }),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 6) {
    const wait = Number(res.headers.get("retry-after") ?? 2 ** attempt * 5) * 1000;
    await sleep(wait);
    return ask(strings, context, attempt + 1);
  }
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as {
    content: { type: string; text?: string }[];
    stop_reason: string;
  };
  if (body.stop_reason === "max_tokens") throw new Error("reply was cut off (max_tokens)");
  const text = body.content
    .map((c) => c.text ?? "")
    .join("")
    .trim()
    .replace(/^```(?:json)?\s*|\s*```$/g, "");
  const out = JSON.parse(text) as Record<string, string>;
  return Object.fromEntries(strings.map((s, i) => [s, out[String(i + 1)]]));
}

/* A translation is only kept if it has the same tags as its source. */
const tags = (s: string) => (s.match(/<\/?(strong|em|sup|l\d+)>/g) ?? []).sort().join();
const words = (s: string) => s.split(/\s+/).length;

let done = 0;
let failed = 0;
const rejected: { id: string; source: string; reason: string }[] = [];

async function translate(doc: (typeof queue)[number]) {
  const chunks: string[][] = [[]];
  let n = 0;
  for (const s of doc.strings) {
    if (n + words(s) > CHUNK_WORDS && chunks.at(-1)!.length) {
      chunks.push([]);
      n = 0;
    }
    chunks.at(-1)!.push(s);
    n += words(s);
  }
  const result: Record<string, string> = {};
  for (const [i, chunk] of chunks.entries()) {
    const context = `Article: “${doc.title}”${chunks.length > 1 ? ` (part ${i + 1} of ${chunks.length}, in reading order)` : ""}.`;
    const out = await ask(chunk, context);
    for (const [fr, en] of Object.entries(out)) {
      if (typeof en !== "string" || !en.trim())
        rejected.push({ id: doc.id, source: fr.slice(0, 80), reason: "empty" });
      else if (tags(fr) !== tags(en))
        rejected.push({ id: doc.id, source: fr.slice(0, 80), reason: "tags changed" });
      else result[fr] = en;
    }
  }
  const dir = join(TRANSLATIONS, doc.type === "article" ? "articles" : doc.type);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${doc.id}.json`);
  const previous = exists(file) ? readJson<Record<string, string>>(file) : {};
  writeFileSync(file, JSON.stringify({ ...previous, ...result }, null, 1));
}

console.log(
  `${queue.length} documents to translate with ${MODEL} (${queue.reduce((n, d) => n + d.strings.reduce((m, s) => m + words(s), 0), 0).toLocaleString()} words).`,
);
const workers = Array.from({ length: CONCURRENCY }, async () => {
  for (let doc = queue.shift(); doc; doc = queue.shift()) {
    try {
      await translate(doc);
      done++;
      console.log(`  ✓ ${doc.title.slice(0, 70)}`);
    } catch (e) {
      failed++;
      console.warn(`  ✗ ${doc.title.slice(0, 70)} — ${(e as Error).message.slice(0, 200)}`);
    }
  }
});
await Promise.all(workers);

if (rejected.length)
  writeFileSync(join(OUT, "translate-rejected.json"), JSON.stringify(rejected, null, 2));
console.log(
  `\nTranslated ${done} documents, ${failed} failed, ${rejected.length} strings rejected${rejected.length ? " (see .migration/out/translate-rejected.json — re-run to retry them)" : ""}.`,
);
console.log("Next: npm run migrate:transform");
