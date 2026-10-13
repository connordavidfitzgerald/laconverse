/* Tells the newsroom about a new voice note or written story: an email (Resend)
   and a WhatsApp message (Meta Cloud API, approved template). Each channel is
   skipped when its env vars are missing, and failures are only logged — the
   submission is already stored in Sanity by then. See README → “Notifications”. */

export interface Notice {
  /** The `submission` document's ID, for the Studio link. */
  id: string;
  kind: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  context?: string;
  language?: string;
  audio?: { url: string; filename: string; type: string; data: Buffer };
}

const env = (key: string) => (import.meta.env[key] as string | undefined)?.trim() || undefined;
const SITE = "https://laconverse.com";

const escape = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** WhatsApp template parameters can't hold newlines, tabs or 4+ spaces in a row. */
const oneLine = (s: string, max: number) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

export async function notifySubmission(notice: Notice) {
  const results = await Promise.allSettled([email(notice), whatsapp(notice)]);
  for (const r of results) if (r.status === "rejected") console.error("[notify failed]", r.reason);
}

async function email(n: Notice) {
  const key = env("RESEND_API_KEY");
  const to = env("NOTIFY_EMAIL");
  if (!key || !to) return;

  const who = n.name || "Anonyme";
  const subject =
    n.kind === "voice" ? `Nouvelle note vocale — ${who}` : `Nouvelle histoire écrite — ${who}`;
  const studio = `${SITE}/admin/structure/submission;${n.id}`;
  const rows: [string, string | undefined][] = [
    ["Nom", n.name],
    ["Courriel", n.email],
    ["Téléphone", n.phone],
    ["Langue", n.language],
    ["Page", n.context],
  ];
  const filled = rows.filter((r): r is [string, string] => Boolean(r[1]));

  const text = [
    subject,
    "",
    ...filled.map(([k, v]) => `${k} : ${v}`),
    n.message ? `\n${n.message}` : "",
    n.audio ? `\nÉcouter : ${n.audio.url}` : "",
    `\nDans le Studio : ${studio}`,
  ].join("\n");
  const html = `
    <h2>${escape(subject)}</h2>
    <table>${filled.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escape(v)}</td></tr>`).join("")}</table>
    ${n.message ? `<p style="white-space:pre-wrap">${escape(n.message)}</p>` : ""}
    ${n.audio ? `<p><a href="${escape(n.audio.url)}">Écouter la note vocale</a> (aussi en pièce jointe)</p>` : ""}
    <p><a href="${studio}">Ouvrir dans le Studio</a></p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("NOTIFY_FROM") ?? "La Converse <noreply@laconverse.com>",
      to: to.split(",").map((s) => s.trim()),
      reply_to: n.email,
      subject,
      text,
      html,
      attachments: n.audio
        ? [{ filename: n.audio.filename, content: n.audio.data.toString("base64") }]
        : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function whatsapp(n: Notice) {
  const token = env("WHATSAPP_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_NUMBER_ID");
  const to = env("WHATSAPP_TO");
  if (!token || !phoneId || !to) return;

  /* Matches the approved template (README → “Notifications”):
     “La Converse — {{1}} de {{2}} ({{3}}) : {{4}}. Aussi envoyé à info@laconverse.com.” */
  const params = [
    n.kind === "voice" ? "Note vocale" : "Histoire écrite",
    oneLine(n.name || "Anonyme", 100),
    oneLine([n.email, n.phone].filter(Boolean).join(", ") || "—", 200),
    n.audio ? n.audio.url : oneLine(n.message ?? "—", 700),
  ];

  for (const recipient of to.split(",").map((s) => s.replace(/[^\d]/g, "")).filter(Boolean)) {
    const res = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: env("WHATSAPP_TEMPLATE") ?? "nouvelle_soumission",
          language: { code: env("WHATSAPP_TEMPLATE_LANG") ?? "fr" },
          components: [
            { type: "body", parameters: params.map((text) => ({ type: "text", text })) },
          ],
        },
      }),
    });
    if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`);
  }
}
