/* Click-and-drag for every horizontal `.rail` (About values, homepage videos
   and podcasts, the podcast page). Touch and trackpads already scroll
   natively, so this only handles the mouse. While dragging, snapping is off
   and the rail follows the pointer; on release it glides (flick-aware) to the
   nearest card and snapping comes back. A drag past a few pixels swallows the
   click, so cards that are links don't open at the end of a drag. */
import { gsap, reduced } from "./motion";

const THRESHOLD = 5; // px before a press counts as a drag

function snapTarget(rail: HTMLElement, projected: number) {
  const max = rail.scrollWidth - rail.clientWidth;
  const base = rail.getBoundingClientRect().left + parseFloat(getComputedStyle(rail).paddingLeft) - rail.scrollLeft;
  let best = 0;
  let dist = Infinity;
  for (const item of rail.children as HTMLCollectionOf<HTMLElement>) {
    const left = Math.min(item.getBoundingClientRect().left - base, max);
    const d = Math.abs(left - projected);
    if (d < dist) [best, dist] = [left, d];
  }
  return Math.max(0, Math.min(best, max));
}

function enable(rail: HTMLElement) {
  const scrollable = () => rail.scrollWidth > rail.clientWidth + 1;
  new ResizeObserver(() => rail.toggleAttribute("data-draggable", scrollable())).observe(rail);

  let startX = 0;
  let startLeft = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0; // px/ms, positive when the pointer moves right
  let dragging = false;
  let pressed = false;

  rail.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !scrollable()) return;
    gsap.killTweensOf(rail);
    pressed = true;
    dragging = false;
    startX = lastX = e.clientX;
    lastT = e.timeStamp;
    startLeft = rail.scrollLeft;
    velocity = 0;
  });

  rail.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    const dx = e.clientX - startX;
    if (!dragging) {
      if (Math.abs(dx) < THRESHOLD) return;
      dragging = true;
      rail.setPointerCapture(e.pointerId);
      rail.classList.add("is-dragging");
    }
    const dt = e.timeStamp - lastT;
    if (dt > 0) velocity = 0.8 * ((e.clientX - lastX) / dt) + 0.2 * velocity;
    lastX = e.clientX;
    lastT = e.timeStamp;
    rail.scrollLeft = startLeft - dx;
  });

  const release = () => {
    if (!pressed) return;
    pressed = false;
    if (!dragging) return;
    // Keep `is-dragging` (snap off) until the glide lands, then hand back.
    const target = snapTarget(rail, rail.scrollLeft - velocity * 200);
    gsap.to(rail, {
      scrollLeft: target,
      duration: reduced() ? 0 : 0.6,
      ease: "power3.out",
      onComplete: () => rail.classList.remove("is-dragging"),
    });
  };
  rail.addEventListener("pointerup", release);
  rail.addEventListener("pointercancel", release);

  // Swallow the click that ends a drag; stop native link/image dragging.
  rail.addEventListener(
    "click",
    (e) => {
      if (!dragging) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = false;
    },
    true,
  );
  rail.addEventListener("dragstart", (e) => e.preventDefault());
}

export function dragRails(root: ParentNode = document) {
  if (!matchMedia("(pointer: fine)").matches) return;
  root.querySelectorAll<HTMLElement>(".rail").forEach(enable);
}
