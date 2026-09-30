import { defineCliConfig } from "sanity/cli";

// The CLI only reads SANITY_STUDIO_* variables on its own; the project id
// lives in .env as PUBLIC_SANITY_*, shared with Astro.
try {
  process.loadEnvFile(".env");
} catch {}

export default defineCliConfig({
  api: {
    projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.PUBLIC_SANITY_DATASET || "production",
  },
});
