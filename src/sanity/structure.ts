import type { StructureResolver } from "sanity/structure";
import { EnvelopeIcon } from "@sanity/icons/Envelope";

import { schemaTypes, singletonTypes } from "./schemaTypes";

const byName = new Map(schemaTypes.map((type) => [type.name, type]));
const titleOf = (name: string) => (byName.get(name)?.title as string | undefined) ?? name;

export const structure: StructureResolver = (S) => {
  /* A singleton opens straight into its editor: one document, with French
     and English boxes side by side. */
  const singleton = (type: string) =>
    S.listItem()
      .id(type)
      .title(titleOf(type))
      .icon(byName.get(type)?.icon as never)
      .child(S.document().schemaType(type).documentId(type).title(titleOf(type)));

  /* Editorial types: one list each, newest first where they're dated. Every
     document holds both languages. */
  const editorial = (type: string, ordering?: { field: string; direction: "asc" | "desc" }) =>
    S.listItem()
      .id(type)
      .title(titleOf(type))
      .icon(byName.get(type)?.icon as never)
      .child(() => {
        const list = S.documentTypeList(type).title(titleOf(type));
        return ordering ? list.defaultOrdering([ordering]) : list;
      });
  const newest = { field: "publishedAt", direction: "desc" } as const;
  const menuOrder = { field: "order", direction: "asc" } as const;

  return S.list()
    .title("La Converse")
    .items([
      editorial("article", newest),
      editorial("video", newest),
      editorial("podcast", menuOrder),
      S.documentTypeListItem("category").title("Sections"),
      S.documentTypeListItem("tag").title("Topics"),
      S.documentTypeListItem("series").title("Series"),
      S.documentTypeListItem("person").title("People"),
      editorial("partnerStory", newest),
      S.divider(),
      ...singletonTypes.filter((t) => t !== "siteSettings").map(singleton),
      editorial("program", menuOrder),
      editorial("position", menuOrder),
      S.divider(),
      S.listItem()
        .id("inbox")
        .title("Inbox")
        .icon(EnvelopeIcon)
        .child(
          S.documentTypeList("submission")
            .title("Inbox")
            .defaultOrdering([{ field: "submittedAt", direction: "desc" }]),
        ),
      singleton("siteSettings"),
    ]);
};
