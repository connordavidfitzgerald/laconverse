/* The amount a Zeffy form has raised, from Zeffy's read-only API
   (https://api.zeffy.com/api/v1, amounts in cents). Read when a page is
   built, so the figure moves with each deploy. Any failure (no key, no
   matching form, Zeffy down) returns null and the page renders without it:
   Zeffy must never break a build. */

const API = "https://api.zeffy.com/api/v1";

interface Campaign {
  url: string | null;
  volume: number | null;
  goal_amount: number | null;
}

export interface ZeffyTotals {
  /** Dollars raised so far. */
  raised: number;
  /** Dollars, when the form has a goal set in Zeffy. */
  goal: number | null;
}

/* The form's own slug: zeffy.com/[fr-CA/][embed/]donation-form/<slug>. */
const slugOf = (url: string) => {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() ?? null;
  } catch {
    return null;
  }
};

let campaigns: Promise<Campaign[] | null> | undefined;

async function listCampaigns(key: string): Promise<Campaign[]> {
  const all: Campaign[] = [];
  let cursor: string | null = null;
  do {
    const url = new URL(`${API}/campaigns`);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("starting_after", cursor);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Zeffy answered ${res.status}`);
    const page = (await res.json()) as { data: Campaign[]; has_more: boolean; next_cursor: string | null };
    all.push(...page.data);
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return all;
}

/* What the donation forms have raised together (one per frequency, the same
   link given twice counts once). The goal: a single form's own Zeffy goal,
   else `pageGoal`; with several forms, `pageGoal`, else their goals added. */
export async function getZeffyTotals(
  formUrls: (string | null | undefined)[],
  pageGoal?: number | null,
): Promise<ZeffyTotals | null> {
  const key = (import.meta.env.ZEFFY_API_KEY as string | undefined)?.trim();
  const slugs = new Set(formUrls.map((u) => u && slugOf(u)).filter((s): s is string => !!s));
  if (!key || !slugs.size) return null;
  // One listing per build (or per warm function), shared by every page.
  campaigns ??= listCampaigns(key).catch((err) => {
    console.warn(`[zeffy] ${err instanceof Error ? err.message : err}`);
    campaigns = undefined;
    return null;
  });
  const all = await campaigns;
  const forms = [...slugs]
    .map((slug) => all?.find((c) => c.url && slugOf(c.url) === slug))
    .filter((c): c is Campaign => !!c);
  if (!forms.length) return null;
  const page = pageGoal && pageGoal > 0 ? pageGoal : null;
  const own = forms.reduce((sum, c) => sum + (c.goal_amount ?? 0), 0) / 100 || null;
  return {
    raised: forms.reduce((sum, c) => sum + (c.volume ?? 0), 0) / 100,
    goal: forms.length === 1 ? (own ?? page) : (page ?? own),
  };
}
