import { createClient, type SanityClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

import type { Img } from "./types";

export const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID as string | undefined;
export const dataset =
  (import.meta.env.PUBLIC_SANITY_DATASET as string | undefined) || "production";
export const apiVersion = "2026-09-01";

/* Null until a Sanity project is configured, in which case content.ts serves
   the fixtures instead. Reads go straight to the API: the site is redeployed
   on publish, so there is no reason to read a cache that may lag it. */
export const client: SanityClient | null = projectId
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, perspective: "published" })
  : null;

/* Server-only client for the API routes and scripts. */
export function writeClient(token = import.meta.env.SANITY_WRITE_TOKEN as string | undefined) {
  if (!projectId || !token) return null;
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token });
}

const builder = projectId ? createImageUrlBuilder({ projectId, dataset }) : null;

/** A sized, format-negotiated URL for an image, honouring its hotspot/crop. */
export function imageUrl(
  img: Img | null | undefined,
  width: number,
  height?: number,
): string | null {
  if (!img?.asset?.url) return null;
  if (!builder || !img.asset._id?.startsWith("image-")) return img.asset.url;
  let b = builder
    .image(img as never)
    .width(width)
    .auto("format")
    .quality(80);
  if (height) b = b.height(height).fit("crop");
  return b.url();
}

export function srcset(
  img: Img | null | undefined,
  widths: number[],
  ratio?: number,
): string | undefined {
  if (!img?.asset?.url || !builder || !img.asset._id?.startsWith("image-")) return undefined;
  return widths
    .map((w) => `${imageUrl(img, w, ratio ? Math.round(w / ratio) : undefined)} ${w}w`)
    .join(", ");
}
