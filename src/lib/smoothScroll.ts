/* Smooth wheel scrolling (Lenis), driven by GSAP's ticker. Only started where
   there is a mouse or trackpad: touch stays native, so phones skip the
   per-frame work. Skipped for `prefers-reduced-motion: reduce` and on pages
   that opt out (the snap-scrolled video feed, see Layout's `smoothScroll`). Locking the page with
   `overflow: hidden` on <html> (the menu) pauses it via `autoToggle`; nested
   scrollers (dialogs, rails, the voice note) keep their own native scroll. */
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, reduced } from "./motion";

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
  return lenis;
}
