"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export type Testimonial = { id: string; author: string; role: string | null; body: string; rating: number | null; photo_path: string | null };

/** Título e setas à esquerda; cartões deslizantes à direita. */
export default function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const arrow = "flex h-9 w-9 items-center justify-center rounded-full border border-line hover:bg-mist";
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_3fr]">
      <div className="flex flex-col justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Testemunhos</p>
          <h2 className="mt-2 text-3xl font-bold">O que dizem os nossos participantes</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(-1)} className={arrow} aria-label="Anterior"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => go(1)} className={arrow} aria-label="Seguinte"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div ref={ref} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:thin]">
        {items.map((t) => (
          <blockquote key={t.id} className="flex w-72 shrink-0 snap-start flex-col rounded-2xl border border-line bg-paper p-5 text-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-80">
            <footer className="flex items-center gap-3">
              {t.photo_path ? (
                <Image src={t.photo_path} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft font-bold text-brand">{t.author.charAt(0).toUpperCase()}</span>
              )}
              <span className="font-semibold">{t.author}{t.role && <span className="block text-xs font-normal text-muted">{t.role}</span>}</span>
            </footer>
            <p className="mt-4 flex-1 text-muted">“{t.body}”</p>
            {t.rating && <p className="mt-4 flex gap-0.5 text-amber-400" aria-label={`${t.rating} de 5`}>{Array.from({ length: t.rating }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</p>}
          </blockquote>
        ))}
      </div>
    </section>
  );
}
