import type { APIRoute } from "astro";

import { handleSubmission } from "../../lib/submissions";

export const prerender = false;

/* Applications, program sign-ups, newsletter and contact messages. */
export const POST: APIRoute = ({ request }) =>
  handleSubmission(request, ["application", "program", "contact", "newsletter"]);
