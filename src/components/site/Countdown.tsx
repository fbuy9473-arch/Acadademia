"use client";

import { useEffect, useState } from "react";

function parts(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    dias: Math.floor(diff / 86_400_000),
    horas: Math.floor(diff / 3_600_000) % 24,
    minutos: Math.floor(diff / 60_000) % 60,
    segundos: Math.floor(diff / 1000) % 60,
  };
}

export default function Countdown({ target }: { target: string }) {
  const t = new Date(target).getTime();
  const [now, setNow] = useState<ReturnType<typeof parts> | null>(null);

  useEffect(() => {
    const tick = () => setNow(parts(t));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [t]);

  return (
    <div className="flex w-full divide-x divide-white/15" role="timer" aria-label="Contagem decrescente para o evento">
      {Object.entries(now ?? { dias: 0, horas: 0, minutos: 0, segundos: 0 }).map(([label, v]) => (
        <div key={label} className="min-w-0 flex-1 px-2 text-center first:pl-0 last:pr-0 sm:px-4">
          <div className="text-2xl font-bold tabular-nums sm:text-3xl">{String(v).padStart(2, "0")}</div>
          <div className="text-xs text-white/70">{label}</div>
        </div>
      ))}
    </div>
  );
}
