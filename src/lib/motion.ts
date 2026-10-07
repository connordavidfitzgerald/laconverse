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

/** Images fade in over their placeholder colour (see Picture) once they've
    both loaded and scrolled into view. Lazy images load a screen or two ahead
    of the viewport, so fading on load alone would finish off-screen. Images
    already on screen and loaded at start are left alone, so nothing above the
    fold flickers. Text is never animated in. Images that become ready in the
    same frame (a row of cards scrolling in together) fade in one after the
    other, in reading order. */
let ready: HTMLImageElement[] = [];
function queueFade(img: HTMLImageElement) {
  if (!ready.length)
    requestAnimationFrame(() => {
      const batch = ready
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left)
        .map(({ el }) => el);
      ready = [];
      gsap.to(batch, {
        opacity: 1,
        duration: 0.8,
        delay: 0.2,
        stagger: 0.12,
        clearProps: "opacity",
      });
    });
  ready.push(img);
}

export function fadeImages(scope: ParentNode | Element[] = document) {
  if (reduced()) return;
  const imgs = Array.isArray(scope)
    ? scope.flatMap((el) => [...el.querySelectorAll("img")])
    : [...scope.querySelectorAll("img")];
  for (const img of imgs) {
    if (img.dataset.faded !== undefined) continue;
    const below = img.getBoundingClientRect().top > innerHeight;
    if (!below && img.complete) continue;
    img.dataset.faded = "";
    gsap.set(img, { opacity: 0 });
    const loaded = new Promise<void>((done) => {
      if (img.complete) return done();
      img.addEventListener("load", () => done(), { once: true });
      img.addEventListener("error", () => done(), { once: true });
    });
    const seen = new Promise<void>((done) => {
      if (!below) return done();
      ScrollTrigger.create({ trigger: img, start: "top 92%", once: true, onEnter: () => done() });
    });
    Promise.all([loaded, seen]).then(() => queueFade(img));
  }
}
