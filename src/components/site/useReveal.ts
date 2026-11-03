"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Estado de entrada de um elemento: "ssr" (sem JS fica visível), "hidden" (fora do ecrã) e "shown".
 * Repete sempre que o elemento sai e volta a entrar, também ao subir a página.
 * Só esconde quando está totalmente fora do ecrã, para não oscilar na fronteira.
 */
export function useReveal<T extends HTMLElement>(minPx = 80) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<"ssr" | "hidden" | "shown">("ssr");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setState("hidden");
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) { setState("hidden"); return; }
      if (e.intersectionRect.height >= Math.min(e.boundingClientRect.height * 0.12, minPx)) setState("shown");
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    io.observe(el);
    return () => io.disconnect();
  }, [minPx]);

  return { ref, state };
}
