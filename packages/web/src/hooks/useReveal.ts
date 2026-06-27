import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP scroll-reveal: fades + lifts every element matching `selector` inside the
 * returned ref as it scrolls into view. Honors prefers-reduced-motion.
 */
export function useReveal<T extends HTMLElement>(selector = "[data-reveal]") {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector));
    const ctx = gsap.context(() => {
      items.forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
    }, root);

    return () => ctx.revert();
  }, [selector]);

  return ref;
}
