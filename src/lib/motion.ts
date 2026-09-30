/* Shared GSAP helpers for the site's microinteractions. Everything here is
   deliberately quiet: short fades, small offsets, one easing. With
   `prefers-reduced-motion: reduce` every helper still applies its end state,
   just instantly. Hover states stay in CSS (see global.css); GSAP handles
   anything that enters, leaves, or changes shape. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "power2.out", duration: 0.4 });

export { gsap, ScrollTrigger };

const reducedQuery =
  typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
export const reduced = () => reducedQuery?.matches ?? false;
/** A duration, or 0 when the visitor asked for less motion. */
export const d = (seconds: number) => (reduced() ? 0 : seconds);

/** Unhide an element and fade it up into place. */
export function appear(el: HTMLElement | null, opts: { y?: number; delay?: number } = {}) {
  if (!el) return;
  el.hidden = false;
  gsap.fromTo(
    el,
    { opacity: 0, y: opts.y ?? 6 },
    {
      opacity: 1,
      y: 0,
      duration: d(0.35),
      delay: opts.delay ?? 0,
      clearProps: "transform,opacity",
    },
  );
}

/** Fade new items in with a light stagger (load more, search results). */
export function enter(els: Element[], opts: { y?: number; stagger?: number } = {}) {
  if (!els.length) return;
  gsap.fromTo(
    els,
    { opacity: 0, y: opts.y ?? 12 },
    {
      opacity: 1,
      y: 0,
      duration: d(0.5),
      stagger: reduced() ? 0 : (opts.stagger ?? 0.04),
      clearProps: "transform,opacity",
    },
  );
  fadeImages(els);
}

/** Open a collapsed block by animating its height from 0. */
export function expand(el: HTMLElement, onDone?: () => void) {
  el.hidden = false;
  gsap.killTweensOf(el);
  gsap.fromTo(
    el,
    { height: 0, opacity: 0, overflow: "hidden" },
    {
      height: "auto",
      opacity: 1,
      duration: d(0.35),
      ease: "power2.inOut",
      clearProps: "height,opacity,overflow",
      onComplete: onDone,
    },
  );
}

/** Close a block by animating its height to 0, then hide it. */
export function collapse(el: HTMLElement, onDone?: () => void) {
  gsap.killTweensOf(el);
  gsap.to(el, {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    duration: d(0.28),
    ease: "power2.inOut",
    onComplete: () => {
      el.hidden = true;
      gsap.set(el, { clearProps: "height,opacity,overflow" });
      onDone?.();
    },
  });
}

/** Swap an element's text with a short vertical roll. */
export function swapText(el: HTMLElement, text: string) {
  if (reduced()) return void (el.textContent = text);
  gsap.killTweensOf(el);
  gsap
    .timeline()
    .to(el, { opacity: 0, y: -4, duration: 0.12, ease: "power1.in" })
    .add(() => (el.textContent = text))
    .fromTo(
      el,
      { opacity: 0, y: 4 },
      { opacity: 1, y: 0, duration: 0.22, clearProps: "transform,opacity" },
    );
}

/** Images that haven't loaded yet fade in when they do, rather than popping.
    Images with an LQIP background already have a placeholder, so skip them. */
export function fadeImages(scope: ParentNode | Element[] = document) {
  if (reduced()) return;
  const imgs = Array.isArray(scope)
    ? scope.flatMap((el) => [...el.querySelectorAll("img")])
    : [...scope.querySelectorAll("img")];
  for (const img of imgs) {
    if (img.complete || img.style.background || img.dataset.faded) continue;
    img.dataset.faded = "";
    gsap.set(img, { opacity: 0 });
    const show = () => gsap.to(img, { opacity: 1, duration: 0.5, clearProps: "opacity" });
    img.addEventListener("load", show, { once: true });
    img.addEventListener("error", show, { once: true });
  }
}

/** `[data-reveal]` elements that start below the fold fade up as they scroll
    in. Anything already on screen at load is left alone, so nothing above the
    fold ever flickers. Opacity only (no visibility), so keyboard focus still
    reaches unrevealed links — focusing one scrolls it in, which reveals it. */
export function revealOnScroll() {
  if (reduced()) return;
  const fold = innerHeight;
  const pending = [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
    (el) => el.getBoundingClientRect().top > fold,
  );
  if (!pending.length) return;
  gsap.set(pending, { opacity: 0, y: 16 });
  ScrollTrigger.batch(pending, {
    start: "top 92%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.07,
        clearProps: "transform,opacity",
      }),
  });
}
