import type { APIRoute } from "astro";

import { handleSubmission } from "../../lib/submissions";

export const prerender = false;

/* Voice notes and written stories from the “Got a story to tell?” dialog. */
export const POST: APIRoute = ({ request }) => handleSubmission(request, ["voice", "text"]);
