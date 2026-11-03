"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * Cápsula flutuante, centrada, de vidro com bordas.
 * - Esconde-se ao descer e reaparece com animação ao subir (retrocesso).
 * - Adapta as cores ao fundo por baixo dela: secções com `data-tone="dark"` dão texto claro.
 */
export default function HeaderShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [tone, setTone] = useState<"light" | "dark">("light");

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const y = window.scrollY;
      const delta = y - last;
      const focused = el.contains(document.activeElement) || el.querySelector("details[open]");
      if (y < 80 || focused) setHidden(false);
      else if (delta > 8) setHidden(true);
      else if (delta < -8) setHidden(false);
      if (Math.abs(delta) > 8) last = y;

      const r = el.getBoundingClientRect();
      const under = document.elementsFromPoint(window.innerWidth / 2, r.top + r.height / 2)
        .find((n) => !el.contains(n) && n.closest("[data-tone]"));
      setTone(under?.closest("[data-tone]")?.getAttribute("data-tone") === "dark" ? "dark" : "light");
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <header
      ref={ref}
      className={clsx(
        "fixed inset-x-0 top-3 z-40 animate-[fadeDown_.8s_cubic-bezier(.2,.7,.2,1)_both] px-3 transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] sm:top-4 sm:px-4",
        hidden ? "-translate-y-[160%]" : "translate-y-0",
      )}
    >
      <div
        className={clsx(
          "mx-auto max-w-6xl rounded-2xl border shadow-[0_10px_40px_rgba(3,7,8,0.12)] backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-500",
          tone === "dark" ? "border-white/25 bg-black/25 text-white" : "border-white/80 bg-white/75 text-ink",
        )}
      >
        {children}
      </div>
    </header>
  );
}
