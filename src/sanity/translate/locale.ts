/* What can be translated, and how: the bilingual field types from
   src/sanity/schemaTypes/shared.ts, each stored as `{ fr, en }`. */
import type { SchemaType } from "sanity";

import { LANGUAGES } from "../languages";
import type { Batch } from "./batch";
import { translatePortableText } from "./portableText";

export type Lang = (typeof LANGUAGES)[number]["id"];
export const other = (lang: Lang): Lang => (lang === "fr" ? "en" : "fr");
export const langTitle = (lang: Lang) => LANGUAGES.find((l) => l.id === lang)!.title;

const KINDS = {
  localeString: "text",
  localeText: "text",
  localeStringList: "list",
  localeRichText: "rich",
  localeNote: "rich",
} as const;
export type LocaleKind = (typeof KINDS)[keyof typeof KINDS];

/* Fields that hold bilingual values that aren't prose (a button's URL). */
const SKIP = new Set(["url"]);

/** The bilingual kind of a schema type, looking through its ancestors. */
export function localeKind(type: SchemaType | undefined): LocaleKind | undefined {
  for (let t: SchemaType | undefined = type; t; t = t.type)
    if (t.name in KINDS) return KINDS[t.name as keyof typeof KINDS];
  return undefined;
}

/** Whether one side of a bilingual value has nothing to translate (an
    editor's leftover empty paragraph counts as nothing). */
export function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return !v.trim();
  if (!Array.isArray(v)) return false;
  return v.every((item) =>
    typeof item === "string"
      ? !item.trim()
      : item?._type === "block" &&
        !(item.children as { text?: string }[] | undefined)?.some((c) => c.text?.trim()),
  );
}

/** Queue one side of a bilingual value; the getter returns the other side. */
export function translateSide(kind: LocaleKind, value: unknown, batch: Batch): () => unknown {
  if (kind === "rich") return translatePortableText(value, batch);
  if (kind === "list") {
    const gets = ((value as unknown[] | undefined) ?? []).map((v) =>
      typeof v === "string" ? batch.add(v) : () => v,
    );
    return () => gets.map((g) => g());
  }
  return typeof value === "string" ? batch.add(value) : () => value;
}

export interface LocaleField {
  /** Patch path of the `{ fr, en }` object, e.g. `episodes[_key=="a1"].title`. */
  path: string;
  kind: LocaleKind;
  value: Record<string, unknown>;
}

/** Every bilingual field with a value in a document, found through its schema. */
export function localeFields(type: SchemaType, value: unknown, path = ""): LocaleField[] {
  if (value === undefined || value === null) return [];
  const kind = localeKind(type);
  if (kind) return [{ path, kind, value: value as Record<string, unknown> }];
  if (type.jsonType === "object" && "fields" in type) {
    return type.fields.flatMap((f) =>
      SKIP.has(f.name)
        ? []
        : localeFields(
            f.type,
            (value as Record<string, unknown>)[f.name],
            path ? `${path}.${f.name}` : f.name,
          ),
    );
  }
  if (type.jsonType === "array" && "of" in type && Array.isArray(value)) {
    return value.flatMap((item: { _key?: string; _type?: string }) => {
      const member =
        type.of.find((t) => t.name === item?._type) ?? (type.of.length === 1 ? type.of[0] : null);
      return member && item?._key
        ? localeFields(member, item, `${path}[_key=="${item._key}"]`)
        : [];
    });
  }
  return [];
}
