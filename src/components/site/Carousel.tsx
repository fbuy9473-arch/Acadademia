"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Linha horizontal com scroll-snap e setas; `aside` aparece ao lado das setas. */
export default function Carousel({ aside, children }: { aside?: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = "flex h-9 w-9 items-center justify-center rounded-full border border-line hover:bg-mist";
  return (
    <div>
      <div className="flex items-center justify-end gap-4">
        {aside}
        <button type="button" onClick={() => go(-1)} className={arrow} aria-label="Anterior"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => go(1)} className={arrow} aria-label="Seguinte"><ChevronRight size={18} /></button>
      </div>
      <div ref={ref} className="mt-4 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:thin]">{children}</div>
    </div>
  );
}
