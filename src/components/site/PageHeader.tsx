import Reveal from "./Reveal";
import TextReveal from "./TextReveal";

/** Cabeçalho comum das páginas interiores: etiqueta, título animado e descrição, sobre um brilho verde suave. */
export default function PageHeader({ eyebrow, title, accent, description }: { eyebrow?: string; title: string; accent?: string; description?: string }) {
  return (
    <div className="relative overflow-hidden">
      <span aria-hidden className="pointer-events-none absolute -top-28 left-1/2 h-72 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-6 text-center sm:px-6">
        {eyebrow && <Reveal><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">{eyebrow}</p></Reveal>}
        <TextReveal as="h1" text={title} accent={accent} className="mt-3 text-4xl font-extrabold sm:text-5xl" />
        {description && <Reveal delay={150}><p className="mx-auto mt-4 max-w-xl text-muted">{description}</p></Reveal>}
      </div>
    </div>
  );
}
