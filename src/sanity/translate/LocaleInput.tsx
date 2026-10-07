/* The usual French + English boxes, with a button under them that fills one
   side with a translation of the other. */
import { useState } from "react";
import { set, type ObjectInputProps } from "sanity";
import { Button, Flex, Stack, Text } from "@sanity/ui";
import { TranslateIcon } from "@sanity/icons/Translate";

import { LANGUAGES } from "../languages";
import { Batch } from "./batch";
import { isEmpty, langTitle, localeKind, other, translateSide, type Lang } from "./locale";

export function LocaleInput(props: ObjectInputProps) {
  const kind = localeKind(props.schemaType);
  const [busy, setBusy] = useState<Lang | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!kind || props.readOnly || props.path.at(-1) === "url") return props.renderDefault(props);

  const value = (props.value ?? {}) as Record<string, unknown>;
  const translate = async (from: Lang) => {
    const to = other(from);
    if (
      !isEmpty(value[to]) &&
      !window.confirm(
        `Replace the ${langTitle(to)} version with a translation of the ${langTitle(from)}?`,
      )
    )
      return;
    setBusy(from);
    setError(null);
    try {
      const batch = new Batch();
      const get = translateSide(kind, value[from], batch);
      await batch.run(from, to);
      props.onChange(set(get(), [to]));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Stack gap={2}>
      {props.renderDefault(props)}
      <Flex gap={1} justify="flex-end" align="center">
        {error && (
          <Text size={1} style={{ color: "var(--card-badge-critical-fg-color)" }}>
            {error}
          </Text>
        )}
        {LANGUAGES.map(({ id }) => (
          <Button
            key={id}
            mode="bleed"
            fontSize={1}
            padding={2}
            icon={TranslateIcon}
            text={`${id.toUpperCase()} → ${other(id).toUpperCase()}`}
            title={`Translate the ${langTitle(id)} into ${langTitle(other(id))}`}
            loading={busy === id}
            disabled={Boolean(busy) || isEmpty(value[id])}
            onClick={() => translate(id)}
          />
        ))}
      </Flex>
    </Stack>
  );
}
