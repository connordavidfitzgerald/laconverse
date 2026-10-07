/* Collects every string a translation needs, sends them to /api/translate
   (Langbly, src/pages/api/translate.ts), then hands each caller its result,
   so a whole article is translated in one go. */
import type { Lang } from "./locale";

const PER_REQUEST = 8;
const REQUESTS = 3;

export class Batch {
  private texts: { text: string; xml: boolean }[] = [];
  private results: string[] = [];

  /** Queue a string; the getter returns its translation after `run()`. */
  add(text: string, xml = false): () => string {
    if (!text.trim()) return () => text;
    const i = this.texts.push({ text, xml }) - 1;
    return () => this.results[i] ?? text;
  }

  get size() {
    return this.texts.length;
  }

  /* A few strings per request and a few requests at a time: the route
     translates each string in parallel, and small requests keep each call
     to it short. */
  async run(source: Lang, target: Lang) {
    const groups: number[][] = [];
    for (const xml of [false, true]) {
      const indexes = this.texts.flatMap((t, i) => (t.xml === xml ? [i] : []));
      for (let i = 0; i < indexes.length; i += PER_REQUEST)
        groups.push(indexes.slice(i, i + PER_REQUEST));
    }
    const results: string[] = new Array(this.texts.length);
    let next = 0;
    const worker = async () => {
      for (let g = next++; g < groups.length; g = next++) {
        const indexes = groups[g];
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            target,
            xml: this.texts[indexes[0]].xml,
            texts: indexes.map((i) => this.texts[i].text),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { texts?: string[]; error?: string };
        if (!res.ok || !data.texts)
          throw new Error(data.error ?? `Translation failed (${res.status}).`);
        data.texts.forEach((text, n) => (results[indexes[n]] = text));
      }
    };
    await Promise.all(Array.from({ length: Math.min(REQUESTS, groups.length) }, worker));
    this.results = results;
  }
}
