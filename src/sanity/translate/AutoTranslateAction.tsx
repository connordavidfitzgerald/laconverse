/* "Auto-translate" in a document's action menu: fills every empty field of
   one language with a translation of the other (through Langbly), gives
   the document a slug in that language from its translated title, and flags
   the language as machine-translated so the page says so until an editor
   clears it. */
import { useState } from "react";
import {
  useClient,
  useDocumentOperation,
  useSchema,
  type DocumentActionComponent,
  type ObjectSchemaType,
} from "sanity";
import { Button, Checkbox, Flex, Radio, Stack, Text } from "@sanity/ui";
import { TranslateIcon } from "@sanity/icons/Translate";

import { LANGUAGES } from "../languages";
import { slugTaken } from "../schemaTypes/shared";
import { slugify } from "../../lib/slugify";
import { Batch } from "./batch";
import { isEmpty, langTitle, localeFields, other, translateSide, type Lang } from "./locale";

type Doc = Record<string, unknown> & { _id: string; _type: string };

export const AutoTranslateAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type);
  const schema = useSchema();
  const client = useClient({ apiVersion: "2026-09-01" });
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Lang | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doc = (props.draft ?? props.published) as Doc | null;
  const type = schema.get(props.type) as ObjectSchemaType | undefined;
  const fields = type && doc ? localeFields(type, doc) : [];
  if (!type || !fields.length) return null;

  const filled = (lang: Lang) => fields.filter((f) => !isEmpty(f.value[lang])).length;
  const source = from ?? (filled("fr") >= filled("en") ? "fr" : "en");
  const target = other(source);
  const todo = fields.filter(
    (f) => !isEmpty(f.value[source]) && (overwrite || isEmpty(f.value[target])),
  );
  const has = (name: string) => type.fields.some((f) => f.name === name);
  const slugs = doc?.slug as Partial<Record<Lang, { current?: string }>> | undefined;
  const titles = doc?.title as Partial<Record<Lang, string>> | undefined;
  /* Only an empty slug is filled (changing one would break a published URL),
     and only once there's a title in that language to make it from. */
  const needsSlug =
    type.fields.find((f) => f.name === "slug")?.type.jsonType === "object" &&
    !slugs?.[target]?.current &&
    (!isEmpty(titles?.[target]) || todo.some((f) => f.path === "title"));

  const uniqueSlug = async (title: string) => {
    const base = slugify(title);
    for (let n = 1; ; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      if (!(await slugTaken(client, { type: props.type, lang: target, slug, id: props.id })))
        return slug;
    }
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const batch = new Batch();
      const gets = todo.map((f) => [f, translateSide(f.kind, f.value[source], batch)] as const);
      await batch.run(source, target);
      const changes: Record<string, unknown> = {};
      for (const [f, get] of gets) changes[`${f.path}.${target}`] = get();
      if (needsSlug) {
        const title = (changes[`title.${target}`] as string | undefined) ?? titles?.[target];
        if (title) changes[`slug.${target}`] = { _type: "slug", current: await uniqueSlug(title) };
      }
      if (todo.length && has("machineTranslated")) changes.machineTranslated = target;
      if (Object.keys(changes).length) patch.execute([{ set: changes }]);
      setOpen(false);
      props.onComplete();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    label: "Auto-translate",
    icon: TranslateIcon,
    onHandle: () => setOpen(true),
    dialog: open && {
      type: "dialog",
      header: "Auto-translate",
      onClose: () => !busy && setOpen(false),
      content: (
        <Stack gap={4} padding={1}>
          <Text size={1} muted>
            Translated by machine (Langbly). Read the result over before publishing, and clear
            “Machine-translated” once it's been reviewed.
          </Text>
          <Stack gap={3}>
            {LANGUAGES.map(({ id }) => (
              <Flex key={id} as="label" align="center" gap={2}>
                <Radio
                  name="direction"
                  checked={source === id}
                  onChange={() => setFrom(id)}
                  disabled={busy}
                />
                <Text size={1}>
                  {langTitle(id)} → {langTitle(other(id))}
                </Text>
              </Flex>
            ))}
          </Stack>
          <Flex as="label" align="center" gap={2}>
            <Checkbox
              checked={overwrite}
              onChange={() => setOverwrite(!overwrite)}
              disabled={busy}
            />
            <Text size={1}>Also replace {langTitle(target)} fields that are already filled in</Text>
          </Flex>
          {error && (
            <Text size={1} style={{ color: "var(--card-badge-critical-fg-color)" }}>
              {error}
            </Text>
          )}
          <Button
            tone="primary"
            icon={TranslateIcon}
            loading={busy}
            disabled={!todo.length && !needsSlug}
            text={
              todo.length
                ? `Translate ${todo.length} field${todo.length > 1 ? "s" : ""} into ${langTitle(target)}`
                : needsSlug
                  ? `Make the ${langTitle(target)} slug`
                  : `Every ${langTitle(target)} field is filled in`
            }
            onClick={run}
          />
        </Stack>
      ),
    },
  };
};
