/* Import the channel's YouTube shorts as `video` documents streaming from Mux.
 *
 *   npm run shorts:import                      # everything not imported yet
 *   npm run shorts:import -- --limit 3         # just the 3 newest (a trial run)
 *   npm run shorts:import -- --dry             # say what would happen, change nothing
 *   npm run shorts:import -- --dir ~/shorts    # downloads elsewhere
 *   npm run shorts:import -- --fr-only         # ignore YouTube's English titles
 *
 * Reads the yt-dlp download (default ../laconverse-shorts):
 *   fr/<date>_<id>.mp4 / .jpg / .info.json   the clip, its thumbnail, French metadata
 *   en/<id>.info.json                        the same metadata in English
 *
 * For each short: uploads the MP4 to Mux, waits for it to be ready, records
 * it as a `mux.videoAsset` (the document the Studio plugin reads), uploads
 * the thumbnail as the poster and creates the `video` document with both
 * languages. YouTube translates titles and descriptions itself, so the side
 * that isn't the clip's spoken language is flagged as machine-translated.
 *
 * Resumable: a short whose document already exists is skipped. Also writes
 * the Mux token to `secrets.mux`, so the Studio plugin works without setup.
 * Needs MUX_TOKEN_ID, MUX_TOKEN_SECRET and SANITY_WRITE_TOKEN in .env. */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

import { createClient } from "@sanity/client";

import { slugify } from "../src/lib/slugify";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const DRY = process.argv.includes("--dry");
/* French only: leave the English side to the Studio's Auto-translate. */
const FR_ONLY = process.argv.includes("--fr-only");
const LIMIT = Number(arg("limit") ?? Infinity);
const DIR = resolve((arg("dir") ?? "../laconverse-shorts").replace(/^~/, homedir()));
const CONCURRENCY = 3;
/* "basic" encodes for free and suits phone-shot shorts; "plus" for more. */
const VIDEO_QUALITY = process.env.MUX_VIDEO_QUALITY ?? "basic";

const { MUX_TOKEN_ID, MUX_TOKEN_SECRET, SANITY_WRITE_TOKEN, PUBLIC_SANITY_PROJECT_ID } =
  process.env;
if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET || !SANITY_WRITE_TOKEN || !PUBLIC_SANITY_PROJECT_ID) {
  console.error(
    "Set MUX_TOKEN_ID, MUX_TOKEN_SECRET, SANITY_WRITE_TOKEN and PUBLIC_SANITY_PROJECT_ID in .env.",
  );
  process.exit(1);
}

const sanity = createClient({
  projectId: PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2026-09-01",
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
});

/* ---- Mux ------------------------------------------------------------------ */

const MUX_AUTH = "Basic " + Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");

async function mux<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://api.mux.com${path}`, {
    ...init,
    headers: { Authorization: MUX_AUTH, "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok)
    throw new Error(`Mux ${init.method ?? "GET"} ${path}: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { data: T }).data;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface MuxAsset {
  id: string;
  status: "preparing" | "ready" | "errored";
  playback_ids?: { id: string; policy: string }[];
  errors?: { messages?: string[] };
  [key: string]: unknown;
}

/** Upload a local file to Mux and resolve once its asset is ready to play. */
async function uploadToMux(
  file: string,
  passthrough: string,
): Promise<{ asset: MuxAsset; uploadId: string }> {
  const upload = await mux<{ id: string; url: string }>("/video/v1/uploads", {
    method: "POST",
    body: JSON.stringify({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"],
        video_quality: VIDEO_QUALITY,
        max_resolution_tier: "1080p",
        passthrough,
      },
    }),
  });
  const put = await fetch(upload.url, {
    method: "PUT",
    body: readFileSync(file),
    headers: { "Content-Type": "video/mp4" },
  });
  if (!put.ok) throw new Error(`Upload of ${basename(file)} failed: ${put.status}`);

  let assetId: string | undefined;
  for (let i = 0; !assetId; i++) {
    if (i > 60) throw new Error(`Mux never created an asset for ${basename(file)}`);
    await wait(2000);
    assetId = (await mux<{ asset_id?: string }>(`/video/v1/uploads/${upload.id}`)).asset_id;
  }
  for (let i = 0; ; i++) {
    const asset = await mux<MuxAsset>(`/video/v1/assets/${assetId}`);
    if (asset.status === "ready") return { asset, uploadId: upload.id };
    if (asset.status === "errored")
      throw new Error(
        `Mux couldn't process ${basename(file)}: ${asset.errors?.messages?.join("; ")}`,
      );
    if (i > 150) throw new Error(`Mux is still processing ${basename(file)} after 10 minutes`);
    await wait(4000);
  }
}

/* ---- Metadata ------------------------------------------------------------ */

interface Info {
  id: string;
  title: string;
  description?: string;
  timestamp?: number;
  upload_date?: string;
  duration?: number;
  language?: string | null;
}

/** The description as Portable Text: one block per paragraph, minus the
    hashtag-only lines YouTube needs and the site doesn't. */
function toBlocks(text: string | undefined, prefix: string) {
  const paragraphs = (text ?? "")
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split("\n")
        .filter((line) => !/^\s*(#[\p{L}\p{N}_]+\s*)+$/u.test(line))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
  return paragraphs.map((p, i) => ({
    _type: "block",
    _key: `${prefix}${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${prefix}${i}s`, text: p, marks: [] }],
  }));
}

/** Titles drop YouTube's trailing hashtags and leading emoji. */
const cleanTitle = (t: string) =>
  t
    .replace(/(\s+#[\p{L}\p{N}_]+)+\s*$/u, "")
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, "")
    .trim();

/** When the short was posted; undefined if the download didn't say. */
const publishedAt = (info: Info) =>
  info.timestamp
    ? new Date(info.timestamp * 1000).toISOString()
    : info.upload_date
      ? `${info.upload_date.slice(0, 4)}-${info.upload_date.slice(4, 6)}-${info.upload_date.slice(6, 8)}T12:00:00Z`
      : undefined;

/** Some downloads come without a date: the watch page still shows it. */
async function lookUpDate(ytId: string): Promise<string | undefined> {
  const html = await fetch(`https://www.youtube.com/watch?v=${ytId}`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US" },
  }).then((r) => r.text());
  const text = html.match(/"publishDate":\{"simpleText":"([^"]+)"/)?.[1];
  const date = text ? new Date(`${text} 12:00 UTC`) : null;
  return date && !isNaN(+date) ? date.toISOString() : undefined;
}

/* ---- Run ------------------------------------------------------------------ */

const frDir = join(DIR, "fr");
const enDir = join(DIR, "en");
if (!existsSync(frDir)) {
  console.error(`No downloads in ${frDir}. Run the yt-dlp download first (see README).`);
  process.exit(1);
}

const shorts = readdirSync(frDir)
  .filter((f) => f.endsWith(".info.json"))
  .map((f) => {
    const stem = join(frDir, f.replace(/\.info\.json$/, ""));
    const fr = JSON.parse(readFileSync(`${stem}.info.json`, "utf8")) as Info;
    const enFile = join(enDir, `${fr.id}.info.json`);
    const en =
      !FR_ONLY && existsSync(enFile) ? (JSON.parse(readFileSync(enFile, "utf8")) as Info) : null;
    return { fr, en, mp4: `${stem}.mp4`, jpg: `${stem}.jpg` };
  })
  .filter((s) => existsSync(s.mp4))
  .sort((a, b) => (publishedAt(b.fr) ?? "").localeCompare(publishedAt(a.fr) ?? ""));

const docId = (ytId: string) => `video-yt-${ytId}`;
const existing = new Set(
  await sanity.fetch<string[]>(`*[_type == "video" && _id in $ids]._id`, {
    ids: shorts.flatMap((s) => [docId(s.fr.id), `drafts.${docId(s.fr.id)}`]),
  }),
);
/* Shorts the Webflow import already put on the site as a YouTube embed keep
   their document (edited title, section, text, redirects): they only gain
   the Mux stream. Drafts are patched too, so publishing them keeps it. */
const embedded = new Map<string, string[]>();
const streamed = new Set<string>(); // already on Mux through a Webflow document
for (const v of await sanity.fetch<{ _id: string; videoUrl: string; muxed: boolean }[]>(
  `*[_type == "video" && !(_id match "video-yt-*") && !(_id match "drafts.video-yt-*") && defined(videoUrl)]{ _id, videoUrl, "muxed": defined(mux.asset) }`,
)) {
  const yt = v.videoUrl.match(/(?:embed\/|shorts\/|[?&]v=|youtu\.be\/)([\w-]{11})/)?.[1];
  if (!yt) continue;
  if (v.muxed) streamed.add(yt);
  else embedded.set(yt, [...(embedded.get(yt) ?? []), v._id]);
}
const pending = shorts.filter(
  (s) =>
    embedded.has(s.fr.id) ||
    (!streamed.has(s.fr.id) &&
      !existing.has(docId(s.fr.id)) &&
      !existing.has(`drafts.${docId(s.fr.id)}`)),
);
const todo = pending.slice(0, LIMIT);

/* Slugs already taken by other videos, per language. */
const taken = await sanity.fetch<{ fr: string[]; en: string[] }>(
  `{ "fr": *[_type == "video"].slug.fr.current, "en": *[_type == "video"].slug.en.current }`,
);
const used = { fr: new Set(taken.fr.filter(Boolean)), en: new Set(taken.en.filter(Boolean)) };
function uniqueSlug(lang: "fr" | "en", title: string, ytId: string) {
  let slug = slugify(title).slice(0, 96) || ytId.toLowerCase();
  if (used[lang].has(slug)) slug = `${slug}-${ytId.toLowerCase()}`;
  used[lang].add(slug);
  return { _type: "slug", current: slug };
}

console.log(
  `${shorts.length} shorts downloaded, ${shorts.length - pending.length} already imported, ${todo.length} to import${DRY ? " (dry run)" : ""}.`,
);

if (!DRY)
  await sanity.createIfNotExists({
    _id: "secrets.mux",
    _type: "mux.apiKey",
    token: MUX_TOKEN_ID,
    secretKey: MUX_TOKEN_SECRET,
    enableSignedUrls: false,
    signingKeyId: "",
    signingKeyPrivate: "",
    drmConfigId: "",
  });

async function importShort({ fr, en, mp4, jpg }: (typeof todo)[number]) {
  const id = docId(fr.id);
  const spokenEnglish = fr.language?.startsWith("en") ?? false;
  const titleFr = cleanTitle(fr.title);
  const titleEn = en ? cleanTitle(en.title) : null;

  const attachTo = embedded.get(fr.id);
  if (DRY) {
    console.log(
      attachTo
        ? `  would add the stream to ${attachTo.join(", ")}  (${titleFr})`
        : `  would import ${fr.id}  ${titleFr}${titleEn ? `  /  ${titleEn}` : ""}`,
    );
    return;
  }

  const when = attachTo ? undefined : (publishedAt(fr) ?? (await lookUpDate(fr.id)));
  if (!attachTo && !when) throw new Error(`No upload date for ${fr.id}`);

  const assetDocId = `mux-yt-${fr.id}`;
  const { asset, uploadId } = await uploadToMux(mp4, assetDocId);
  const playbackId = asset.playback_ids?.find((p) => p.policy === "public")?.id;
  if (!playbackId) throw new Error(`No public playback ID for ${fr.id}`);

  await sanity.createOrReplace({
    _id: assetDocId,
    _type: "mux.videoAsset",
    assetId: asset.id,
    playbackId,
    uploadId,
    status: asset.status,
    filename: basename(mp4),
    data: asset,
  });

  const muxField = {
    _type: "mux.video",
    asset: { _type: "reference", _weak: true, _ref: assetDocId },
  };
  if (attachTo) {
    const ids = await sanity.fetch<string[]>(`*[_id in $ids]._id`, {
      ids: attachTo.flatMap((id) => [id, `drafts.${id}`]),
    });
    const tx = sanity.transaction();
    for (const id of ids) tx.patch(id, (p) => p.set({ mux: muxField }));
    await tx.commit();
    console.log(`  ✓ ${fr.id}  stream added to ${attachTo.join(", ")}`);
    return;
  }

  const poster = existsSync(jpg)
    ? await sanity.assets.upload("image", readFileSync(jpg), { filename: `${fr.id}.jpg` })
    : null;

  const bodyFr = toBlocks(fr.description, "fr");
  const bodyEn = en ? toBlocks(en.description, "en") : [];
  await sanity.create({
    _id: id,
    _type: "video",
    title: { fr: titleFr, ...(titleEn && { en: titleEn }) },
    slug: {
      fr: uniqueSlug("fr", titleFr, fr.id),
      ...(titleEn && { en: uniqueSlug("en", titleEn, fr.id) }),
    },
    ...(poster && {
      poster: { _type: "figure", asset: { _type: "reference", _ref: poster._id }, alt: titleFr },
    }),
    mux: muxField,
    videoUrl: `https://www.youtube.com/shorts/${fr.id}`,
    duration: Math.round(Number(asset.duration ?? fr.duration ?? 0)) || undefined,
    publishedAt: when,
    body: { fr: bodyFr, ...(bodyEn.length && { en: bodyEn }) },
    ...(titleEn && { machineTranslated: spokenEnglish ? "fr" : "en" }),
  });
  console.log(`  ✓ ${fr.id}  ${titleFr}`);
}

let failed = 0;
const queue = [...todo];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      try {
        await importShort(s);
      } catch (e) {
        failed++;
        console.error(`  ✗ ${s.fr.id}: ${(e as Error).message}`);
      }
    }
  }),
);
console.log(failed ? `Done, ${failed} failed (re-run to retry them).` : "Done.");
if (failed) process.exitCode = 1;
