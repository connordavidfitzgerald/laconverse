/* Shared by the /api routes: validate a posted form and store it as a
   `submission` document (with any uploaded file) in Sanity. */
import { writeClient } from "./sanity";

const MB = 1024 * 1024;
export const LIMITS = { audio: 25 * MB, cv: 10 * MB };
const KINDS = new Set(["voice", "text", "application", "program", "contact", "newsletter"]);

const clean = (v: FormDataEntryValue | null, max = 5000) =>
  typeof v === "string" ? v.trim().slice(0, max) || undefined : undefined;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function handleSubmission(request: Request, allowed: string[]) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid form" }, 400);
  }

  // Bots fill every field; people never see this one.
  if (clean(form.get("website"))) return json({ ok: true });

  const kind = clean(form.get("kind"), 20) ?? "";
  if (!KINDS.has(kind) || !allowed.includes(kind)) return json({ error: "Unknown form" }, 400);

  const email = clean(form.get("email"), 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({ error: "Invalid email" }, 400);

  const doc: Record<string, unknown> = {
    _type: "submission",
    kind,
    status: "new",
    name: clean(form.get("name"), 200),
    email,
    phone: clean(form.get("phone"), 50),
    interests: clean(form.get("interests"), 500),
    message: clean(form.get("message")),
    context:
      [clean(form.get("context"), 200), clean(form.get("page"), 300)].filter(Boolean).join(" · ") ||
      undefined,
    language: clean(form.get("language"), 5),
    submittedAt: new Date().toISOString(),
  };

  const audio = form.get("audio");
  const cv = form.get("cv");
  if (kind === "voice" && !(audio instanceof File && audio.size))
    return json({ error: "Missing recording" }, 400);
  if (kind === "text" && !doc.message) return json({ error: "Missing message" }, 400);
  if (kind === "newsletter" && !email) return json({ error: "Missing email" }, 400);
  if (["application", "program", "contact"].includes(kind) && !email)
    return json({ error: "Missing email" }, 400);

  const client = writeClient();
  if (!client) {
    // No Sanity project yet: accept in development so the flows can be tried.
    if (import.meta.env.DEV) {
      console.info("[submission, not stored]", {
        ...doc,
        audio: audio instanceof File ? `${audio.size} bytes` : undefined,
      });
      return json({ ok: true, stored: false });
    }
    return json({ error: "Submissions are not configured" }, 503);
  }

  try {
    if (audio instanceof File && audio.size) {
      if (audio.size > LIMITS.audio || !audio.type.startsWith("audio/"))
        return json({ error: "Recording too large or not audio" }, 413);
      const asset = await client.assets.upload("file", Buffer.from(await audio.arrayBuffer()), {
        filename: audio.name || "voice-note.webm",
        contentType: audio.type,
      });
      doc.audio = { _type: "file", asset: { _type: "reference", _ref: asset._id } };
    }
    if (cv instanceof File && cv.size) {
      if (cv.size > LIMITS.cv) return json({ error: "CV too large" }, 413);
      const asset = await client.assets.upload("file", Buffer.from(await cv.arrayBuffer()), {
        filename: cv.name || "cv.pdf",
        contentType: cv.type || "application/octet-stream",
      });
      doc.cv = { _type: "file", asset: { _type: "reference", _ref: asset._id } };
    }
    await client.create(doc as { _type: string });
    return json({ ok: true });
  } catch (error) {
    console.error("[submission failed]", error);
    return json({ error: "Could not save submission" }, 500);
  }
}
