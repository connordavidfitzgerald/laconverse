import type { APIRoute } from "astro";

import { legacyRedirect } from "../../../lib/legacy";

export const prerender = false;

export const GET: APIRoute = (context) => legacyRedirect("en", "video-tags", context);
