/* Flat placeholder fills for media while it loads. Each image gets one colour
   picked from its key (asset id or URL), so a card keeps the same colour
   between the server render and "load more", and from one visit to the next. */
export const PLACEHOLDERS = ["#eaeb47"] as const;

export function placeholder(key = ""): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return PLACEHOLDERS[Math.abs(h) % PLACEHOLDERS.length];
}
