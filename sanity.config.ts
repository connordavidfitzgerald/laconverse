import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";

import { schemaTypes, singletonTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { autoTranslate } from "./src/sanity/translate/plugin";

/* Bundled by Astro for /admin (import.meta.env) and loaded by the Sanity CLI
   under Node (process.env). */
const env = (key: string): string =>
  (typeof process !== "undefined" ? process.env?.[key] : undefined) ?? import.meta.env?.[key] ?? "";

const singletons = new Set<string>(singletonTypes);

export default defineConfig({
  name: "laconverse",
  title: "La Converse",
  projectId: env("PUBLIC_SANITY_PROJECT_ID"),
  dataset: env("PUBLIC_SANITY_DATASET") || "production",
  basePath: "/admin",

  plugins: [structureTool({ structure }), autoTranslate(), visionTool()],

  schema: {
    types: schemaTypes,
    // Singletons are never created from the menu (the structure opens them by ID).
    templates: (prev) => prev.filter(({ schemaType }) => !singletons.has(schemaType)),
  },

  document: {
    /* Form submissions only come from the site. */
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "global"
        ? prev.filter(({ templateId }) => templateId !== "submission")
        : prev,
    actions: (prev, { schemaType }) =>
      singletons.has(schemaType)
        ? prev.filter(({ action }) => action !== "delete" && action !== "duplicate")
        : prev,
  },
});
