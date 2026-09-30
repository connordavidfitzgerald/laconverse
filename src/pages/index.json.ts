import type { APIRoute } from "astro";

import { getIndex } from "../lib/content";

/* Every FR article as a compact card, for search and “load more”. */
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getIndex("fr")), {
    headers: { "Content-Type": "application/json" },
  });
