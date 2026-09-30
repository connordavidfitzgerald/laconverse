import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { documentInternationalization } from "@sanity/document-internationalization";

import { LANGUAGES } from "./src/sanity/languages";
import { schemaTypes, singletonTypes, translatedTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

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

  plugins: [
    structureTool({ structure }),
    documentInternationalization({
      supportedLanguages: [...LANGUAGES],
      schemaTypes: translatedTypes,
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      // Singletons are never created from the menu (the structure opens them
      // by ID); translated types are only ever created in a language.
      ...prev.filter(({ schemaType }) => !singletons.has(schemaType)),
      ...translatedTypes.flatMap((schemaType) =>
        LANGUAGES.map(({ id }) => ({
          id: `${schemaType}-${id}`,
          title: `${schemaType} (${id})`,
          schemaType,
          value: { language: id },
        })),
      ),
    ],
  },

  document: {
    /* Global "create" shows only language-bound templates, so nothing
       editorial is ever created without a language. */
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "global"
        ? prev.filter(({ templateId }) => {
            if (singletons.has(templateId) || templateId === "submission") return false;
            return !translatedTypes.includes(templateId) && !templateId.endsWith("-parameterized");
          })
        : prev,
    actions: (prev, { schemaType }) =>
      singletons.has(schemaType)
        ? prev.filter(({ action }) => action !== "delete" && action !== "duplicate")
        : prev,
  },
});
