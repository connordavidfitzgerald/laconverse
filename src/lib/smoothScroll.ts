/* Smooth wheel scrolling (Lenis), driven by GSAP's ticker. Only started where
   there is a mouse or trackpad: touch stays native, so phones skip the
   per-frame work. Skipped for `prefers-reduced-motion: reduce` and on pages
   that opt out (the snap-scrolled video feed, see Layout's `smoothScroll`). Locking the page with
   `overflow: hidden` on <html> (the menu) pauses it via `autoToggle`; nested
   scrollers (dialogs, rails, the voice note) keep their own native scroll. */
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, reduced } from "./motion";

let instance: Lenis | undefined;

/** Scroll the page to `y`, through Lenis when it's running so the two don't
    fight, otherwise natively (instant under reduced motion). */
export function scrollToY(y: number) {
  if (instance) instance.scrollTo(y);
  else window.scrollTo({ top: y, behavior: reduced() ? "auto" : "smooth" });
}

/** Bring an explorer row (`[data-explore]`: the sticky filter list beside
    cards) up to where the list sticks (desktop), or to just under the header
    (mobile, where nothing sticks). Measured from the row, since the list's
    own box moves once it's stuck. `onlyUp`: leave the page be when it's
    above that point already. */
export function scrollToExplorer(root: ParentNode, { onlyUp = false } = {}) {
  const row = root.querySelector<HTMLElement>("[data-explore]");
  const nav = row?.querySelector("nav");
  if (!row || !nav) return;
  const top =
    parseFloat(getComputedStyle(nav).top) ||
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) ||
    0;
  const start =
    row.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(row).paddingTop);
  const y = Math.max(0, start - top);
  if (onlyUp && scrollY <= y) return;
  scrollToY(y);
}

export function smoothScroll() {
  if (
    reduced() ||
    !matchMedia("(pointer: fine)").matches ||
    document.documentElement.dataset.smoothScroll === "off"
  )
    return;
  const lenis = new Lenis({
    lerp: 0.12,
    autoToggle: true,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  instance = lenis;
  return lenis;
}
