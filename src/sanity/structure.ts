import type { StructureResolver } from "sanity/structure";
import { EnvelopeIcon } from "@sanity/icons/Envelope";

import { LANGUAGES } from "./languages";
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

  /* Editorial types split by language so the lists stay manageable. */
  const byLanguage = (type: string) =>
    S.listItem()
      .id(type)
      .title(titleOf(type))
      .icon(byName.get(type)?.icon as never)
      .child(
        S.list()
          .title(titleOf(type))
          .items(
            LANGUAGES.map(({ id, title }) =>
              S.listItem()
                .id(`${type}-${id}`)
                .title(title)
                .child(
                  S.documentTypeList(type)
                    .title(`${titleOf(type)} (${id.toUpperCase()})`)
                    .filter("_type == $type && language == $lang")
                    .params({ type, lang: id })
                    .initialValueTemplates([S.initialValueTemplateItem(`${type}-${id}`)]),
                ),
            ),
          ),
      );

  return S.list()
    .title("La Converse")
    .items([
      byLanguage("article"),
      byLanguage("video"),
      byLanguage("podcast"),
      S.documentTypeListItem("category").title("Sections"),
      S.documentTypeListItem("tag").title("Topics"),
      S.documentTypeListItem("series").title("Series"),
      S.documentTypeListItem("person").title("People"),
      byLanguage("partnerStory"),
      S.divider(),
      ...singletonTypes.filter((t) => t !== "siteSettings").map(singleton),
      byLanguage("program"),
      byLanguage("position"),
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
