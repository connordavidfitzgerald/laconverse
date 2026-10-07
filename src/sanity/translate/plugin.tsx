/* Auto-translate: a button under every French/English field pair, and an
   "Auto-translate" document action. Both go through /api/translate (Langbly). */
import { definePlugin, type ObjectInputProps } from "sanity";

import { AutoTranslateAction } from "./AutoTranslateAction";
import { LocaleInput } from "./LocaleInput";
import { localeKind } from "./locale";

export const autoTranslate = definePlugin({
  name: "laconverse-auto-translate",
  form: {
    components: {
      input: (props) =>
        props.schemaType.jsonType === "object" && localeKind(props.schemaType) ? (
          <LocaleInput {...(props as ObjectInputProps)} />
        ) : (
          props.renderDefault(props)
        ),
    },
  },
  document: {
    actions: (prev, { schemaType }) =>
      schemaType === "submission" ? prev : [...prev, AutoTranslateAction],
  },
});
