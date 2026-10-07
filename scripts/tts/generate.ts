/* Article audio — read each article aloud with Microsoft Edge's neural voices
 * (through msedge-tts) and attach the MP3 to its "Audio version" field, which
 * the article page shows as “Listen to the article”.
 *
 *   npm run tts                           # every article missing audio or edited since
 *   npm run tts -- --lang fr --limit 20   # the 20 newest French articles
 *   npm run tts -- --slug some-article    # one article (both languages)
 *   npm run tts -- --force                # regenerate even if unchanged
 *   npm run tts -- --slug x --dry         # write .migration/tts/x.fr.mp3, touch nothing
 *
 * The text read out (title, summary, body) is hashed into `listenSource`, so a
 * re-run only redoes articles whose text changed. Articles whose audio was
 * uploaded by hand (`listen` set, no `listenSource`) are left alone unless
 * --force. Needs PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env;
 * TTS_VOICE_FR / TTS_VOICE_EN are optional.
 *
 * The Edge “Read aloud” endpoint is free but unofficial: it can change or
 * rate-limit without notice. Audio already generated lives in Sanity and is
 * unaffected. */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@sanity/client";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Set PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env.");
  process.exit(1);
}
const client = createClient({
  projectId,
  dataset: process.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2026-09-01",
  token,
  useCdn: false,
});

const VOICES: Record<string, string> = {
  fr: process.env.TTS_VOICE_FR ?? "fr-CA-SylvieNeural",
  en: process.env.TTS_VOICE_EN ?? "en-CA-ClaraNeural",
};
/* Characters per request: long articles are read in parts and joined (MP3
   frames concatenate cleanly). */
const CHUNK_CHARS = 3000;
const CONCURRENCY = 2;

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const LANG = arg("lang");
const SLUG = arg("slug");
const LIMIT = Number(arg("limit") ?? Infinity);
const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry");
const DRY_DIR = ".migration/tts";

interface Span {
  text?: string;
}
interface Block {
  _type: string;
  style?: string;
  children?: Span[];
}
interface Article {
  _id: string;
  title: string;
  dek?: string;
  language: string;
  slug: string;
  body?: Block[];
  hasAudio: boolean;
  listenSource?: string;
}

/* What gets read: the title, the summary, then every text block of the body
   (images, embeds and other objects are skipped). */
function paragraphs(a: Article): string[] {
  const body = (a.body ?? [])
    .filter((b) => b._type === "block")
    .map((b) => (b.children ?? []).map((c) => c.text ?? "").join(""));
  return [a.title, a.dek ?? "", ...body].map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
}

function chunks(paras: string[]): string[] {
  const out: string[] = [];
  let cur = "";
  for (const p of paras.flatMap((p) => splitLong(p))) {
    if (cur && cur.length + p.length + 1 > CHUNK_CHARS) {
      out.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n${p}` : p;
  }
  if (cur) out.push(cur);
  return out;
}

/* A single paragraph over the limit is cut at sentence ends. */
function splitLong(p: string): string[] {
  if (p.length <= CHUNK_CHARS) return [p];
  const parts: string[] = [];
  let cur = "";
  for (const s of p.match(/[^.!?…]+[.!?…»”"]*\s*/g) ?? [p]) {
    if (cur && cur.length + s.length > CHUNK_CHARS) {
      parts.push(cur.trim());
      cur = "";
    }
    cur += s;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function speak(voice: string, text: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(escape(text));
      const parts: Buffer[] = [];
      for await (const part of audioStream) parts.push(part as Buffer);
      const audio = Buffer.concat(parts);
      if (!audio.length) throw new Error("empty audio");
      return audio;
    } catch (err) {
      if (attempt >= 4) throw err;
      await sleep(2000 * 2 ** attempt);
    } finally {
      tts.close();
    }
  }
}

async function generate(a: Article, hash: string) {
  const voice = VOICES[a.language] ?? VOICES.fr;
  const audio: Buffer[] = [];
  for (const text of chunks(paragraphs(a))) audio.push(await speak(voice, text));
  const filename = `${a.slug}.${a.language}.mp3`;
  if (DRY) {
    mkdirSync(DRY_DIR, { recursive: true });
    return writeFileSync(`${DRY_DIR}/${filename}`, Buffer.concat(audio));
  }
  const asset = await client.assets.upload("file", Buffer.concat(audio), {
    filename,
    contentType: "audio/mpeg",
  });
  await client
    .patch(a._id)
    .setIfMissing({ listen: {}, listenSource: {} })
    .set({
      [`listen.${a.language}`]: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
      [`listenSource.${a.language}`]: hash,
    })
    .commit();
}

/* Each article holds both languages ({ fr, en } fields); each language it's
   published in (has a slug in) gets its own reading. */
type ByLang<T> = Partial<Record<string, T>>;
const docs = await client.fetch<
  {
    _id: string;
    title?: ByLang<string>;
    dek?: ByLang<string>;
    slug?: ByLang<{ current?: string }>;
    body?: ByLang<Block[]>;
    listen?: ByLang<{ asset?: unknown }>;
    listenSource?: ByLang<string>;
  }[]
>(
  `*[_type == "article" && !(_id in path("drafts.**"))
     && ($slug == null || $slug in [slug.fr.current, slug.en.current])]
   | order(publishedAt desc){ _id, title, dek, slug, body, listen, listenSource }`,
  { slug: SLUG ?? null },
);
const articles: Article[] = docs.flatMap((d) =>
  Object.keys(VOICES)
    .filter((lang) => (!LANG || lang === LANG) && d.slug?.[lang]?.current)
    .map((lang) => ({
      _id: d._id,
      title: d.title?.[lang] ?? "",
      dek: d.dek?.[lang],
      language: lang,
      slug: d.slug![lang]!.current!,
      body: d.body?.[lang],
      hasAudio: Boolean(d.listen?.[lang]?.asset),
      listenSource: d.listenSource?.[lang],
    })),
);

const queue = articles
  .map((a) => ({ a, hash: createHash("sha1").update(paragraphs(a).join("\n")).digest("hex") }))
  .filter(({ a, hash }) => {
    if (FORCE) return true;
    if (a.hasAudio && !a.listenSource) return false; // uploaded by hand
    return a.listenSource !== hash;
  })
  .slice(0, LIMIT);

console.log(`${queue.length} of ${articles.length} article readings to make.`);
let done = 0;
let failed = 0;
async function worker() {
  for (let job = queue.shift(); job; job = queue.shift()) {
    const { a, hash } = job;
    try {
      await generate(a, hash);
      done++;
      console.log(`✓ [${a.language}] ${a.slug}`);
    } catch (err) {
      failed++;
      console.error(`✗ [${a.language}] ${a.slug}: ${(err as Error).message}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`Done: ${done} generated, ${failed} failed.`);
if (failed) process.exitCode = 1;
