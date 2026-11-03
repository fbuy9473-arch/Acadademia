"use client";

import { useEffect, useState } from "react";
import { useReveal } from "./useReveal";

/** Conta de 0 até ao valor sempre que entra no ecrã. Mantém prefixo, sufixo e separador de milhares (ex.: «2.000+»). */
export default function CountUp({ value }: { value: string }) {
  const m = value.match(/^(\D*?)(\d[\d.,\s]*)(\D*)$/);
  const { ref, state } = useReveal<HTMLSpanElement>(1);
  const target = m ? parseInt(m[2].replace(/\D/g, ""), 10) : NaN;
  const sep = m?.[2].includes(".") ? "." : m?.[2].includes(" ") ? " " : "";
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    if (state !== "shown" || Number.isNaN(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1500);
      setN(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // ao sair do ecrã volta a zero, para contar outra vez ao regressar
    return () => { cancelAnimationFrame(raf); setN(0); };
  }, [state, target]);

  if (!m || Number.isNaN(target)) return <>{value}</>;
  const shown = n === null ? target : n;
  const text = sep ? String(shown).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(shown);
  return <span ref={ref} className="tabular-nums">{m[1]}{text}{m[3]}</span>;
}
