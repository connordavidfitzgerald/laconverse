/* Tells the newsroom about a new voice note or written story: an email (Resend)
   and a WhatsApp message (CallMeBot). Each channel is
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

/** Collapses whitespace and truncates, for the WhatsApp message. */
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
  /* CallMeBot (unofficial, free): each recipient registers once and gets an
     API key. CALLMEBOT_WHATSAPP = "15145550123:apikey,15145550124:apikey". */
  const recipients = env("CALLMEBOT_WHATSAPP");
  if (!recipients) return;

  const text = [
    `La Converse — ${n.kind === "voice" ? "Note vocale" : "Histoire écrite"} de ${oneLine(n.name || "Anonyme", 100)}`,
    [n.email, n.phone].filter(Boolean).join(", "),
    n.audio ? `Écouter : ${n.audio.url}` : oneLine(n.message ?? "", 700),
    `Studio : ${SITE}/admin/structure/submission;${n.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  for (const entry of recipients.split(",")) {
    const [phone, apikey] = entry.split(":").map((s) => s.trim());
    if (!phone || !apikey) continue;
    const url = new URL("https://api.callmebot.com/whatsapp.php");
    url.search = new URLSearchParams({
      phone: `+${phone.replace(/[^\d]/g, "")}`,
      text,
      apikey,
    }).toString();
    const res = await fetch(url);
    // CallMeBot answers 200 with an HTML page even for some errors.
    const body = await res.text();
    if (!res.ok || /error/i.test(body))
      throw new Error(`CallMeBot ${res.status}: ${body.slice(0, 300)}`);
  }
}
