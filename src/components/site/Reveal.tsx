"use client";

import clsx from "clsx";
import { useReveal } from "./useReveal";

const hiddenBy = {
  up: "translate-y-8 opacity-0",
  left: "-translate-x-10 opacity-0",
  right: "translate-x-10 opacity-0",
  zoom: "scale-95 opacity-0",
  wipe: "",
} as const;

/**
 * Entrada ao rolar, repetida sempre que o bloco volta a entrar no ecrã (inclusive ao subir).
 * Sem JS o conteúdo fica visível; `delay` (ms) permite escalonar.
 * `wipe` desvenda imagens da esquerda para a direita (o recorte fica num elemento interior,
 * para o observador continuar a ver a caixa exterior).
 */
export default function Reveal({ children, delay = 0, className, variant = "up" }: {
  children: React.ReactNode; delay?: number; className?: string; variant?: keyof typeof hiddenBy;
}) {
  const { ref, state } = useReveal<HTMLDivElement>();
  const transitionDelay = state === "shown" ? `${delay}ms` : undefined;

  if (variant === "wipe") {
    return (
      <div ref={ref} className={className}>
        <div
          style={{ transitionDelay }}
          className={clsx("transition-[clip-path] duration-[1100ms] ease-out", state === "hidden" ? "[clip-path:inset(0_100%_0_0)]" : "[clip-path:inset(0_0_0_0)]")}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ transitionDelay }} className={clsx("transition-all duration-700 ease-out", state === "hidden" && hiddenBy[variant], className)}>
      {children}
    </div>
  );
}
