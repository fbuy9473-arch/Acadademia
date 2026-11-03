"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import clsx from "clsx";
import Carousel from "./Carousel";
import Reveal from "./Reveal";

export type Clip = { id: string; title: string; label?: string; url: string };

function PlayBadge({ size = "md" }: { size?: "md" | "lg" }) {
  const dim = size === "lg" ? "h-20 w-20" : "h-12 w-12";
  return (
    <span className={clsx("relative flex items-center justify-center rounded-full bg-white/95 text-brand shadow-lg transition-transform duration-300 group-hover:scale-110", dim)}>
      <span className="absolute inset-0 animate-ping rounded-full bg-white/50 [animation-duration:2.4s]" aria-hidden />
      <Play size={size === "lg" ? 30 : 20} fill="currentColor" className="relative ml-0.5" />
    </span>
  );
}

/** Janela com o leitor do YouTube (modo privado). Fecha com Esc ou ao clicar fora; as setas navegam. */
export function VideoModal({ clips, index, onClose, onIndex }: { clips: Clip[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const clip = clips[index];
  const step = useCallback((d: number) => onIndex((index + d + clips.length) % clips.length), [index, clips.length, onIndex]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (clips.length > 1 && e.key === "ArrowRight") step(1);
      if (clips.length > 1 && e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); };
  }, [onClose, step, clips.length]);

  const nav = "absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:flex";
  return (
    <div role="dialog" aria-modal="true" aria-label={clip.title} onClick={onClose} className="fixed inset-0 z-50 flex animate-[fadeIn_.25s_ease-out] items-center justify-center bg-black/85 p-4">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl animate-[popIn_.3s_ease-out]">
        <button ref={closeRef} onClick={onClose} aria-label="Fechar" className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25"><X size={20} /></button>
        <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
          <iframe
            key={clip.id}
            src={`https://www.youtube-nocookie.com/embed/${clip.id}?autoplay=1&rel=0`}
            title={clip.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
          />
        </div>
        <p className="mt-3 text-white"><span className="font-semibold">{clip.title}</span>{clip.label && <span className="ml-2 text-sm text-white/60">{clip.label}</span>}</p>
        {clips.length > 1 && (
          <>
            <button onClick={() => step(-1)} aria-label="Vídeo anterior" className={clsx(nav, "-left-14")}><ChevronLeft size={22} /></button>
            <button onClick={() => step(1)} aria-label="Vídeo seguinte" className={clsx(nav, "-right-14")}><ChevronRight size={22} /></button>
          </>
        )}
      </div>
    </div>
  );
}

/** Botão do topo: abre o vídeo institucional na janela (ou numa nova aba se não for YouTube). */
export function HeroVideoButton({ url, id, title = "Vídeo institucional" }: { url: string; id: string | null; title?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const inner = (
    <>
      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-black/30 transition-transform group-hover:scale-110">
        <span className="absolute inset-0 animate-ping rounded-full border border-white/60 [animation-duration:2.4s]" aria-hidden />
        <Play size={24} fill="currentColor" className="ml-0.5" />
      </span>
      <span className="text-left"><span className="block text-sm font-bold">Ver vídeo institucional</span><span className="block text-xs text-white/70">Conheça a nossa história</span></span>
    </>
  );
  const cls = "group flex items-center gap-4 rounded-2xl border border-white/25 bg-black/35 p-4 pr-6 backdrop-blur-sm transition-colors hover:bg-black/50";
  if (!id) return <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cls}>{inner}</button>
      {open && <VideoModal clips={[{ id, title, url }]} index={0} onClose={close} onIndex={() => {}} />}
    </>
  );
}

export default function VideoGallery({ clips, moreHref }: { clips: Clip[]; moreHref?: string }) {
  const labels = Array.from(new Set(clips.map((c) => c.label).filter((l): l is string => Boolean(l))));
  const [filter, setFilter] = useState<string | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const shown = filter ? clips.filter((c) => c.label === filter) : clips;
  const close = useCallback(() => setPlaying(null), []);

  return (
    <>
      {labels.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar vídeos">
          {[null, ...labels].map((l) => (
            <button key={l ?? "all"} type="button" onClick={() => setFilter(l)} aria-pressed={filter === l}
              className={clsx("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors", filter === l ? "border-brand bg-brand text-white" : "border-line hover:border-brand hover:text-brand")}>
              {l ?? "Todos"}
            </button>
          ))}
        </div>
      )}

      <Carousel aside={moreHref ? <a href={moreHref} target="_blank" rel="noopener noreferrer" className="mr-2 text-sm font-semibold text-brand">Ver todos os vídeos →</a> : undefined}>
        {shown.map((c, i) => (
          <Reveal key={c.id + i} delay={i * 90} className="w-64 shrink-0 snap-start sm:w-72">
            <button type="button" onClick={() => setPlaying(clips.indexOf(c))} className="group block w-full text-left">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-ink shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                <Image src={`https://i.ytimg.com/vi/${c.id}/hqdefault.jpg`} alt="" fill sizes="288px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/40" />
                <span className="absolute inset-0 flex items-center justify-center"><PlayBadge /></span>
              </div>
              <p className="mt-3 text-sm font-semibold transition-colors group-hover:text-brand">{c.title}</p>
              {c.label && <p className="text-xs text-muted">{c.label}</p>}
            </button>
          </Reveal>
        ))}
      </Carousel>

      {playing !== null && <VideoModal clips={clips} index={playing} onClose={close} onIndex={setPlaying} />}
    </>
  );
}
