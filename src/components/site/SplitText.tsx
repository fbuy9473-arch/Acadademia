"use client";

import { Fragment } from "react";
import clsx from "clsx";
import { useReveal } from "./useReveal";

/**
 * Título animado letra a letra: cada palavra é uma máscara e as letras sobem uma a uma.
 * Repete quando o título volta ao ecrã. Use   entre palavras que não devem separar-se.
 */
export default function SplitText({ text, className, delay = 0, step = 32 }: { text: string; className?: string; delay?: number; step?: number }) {
  const { ref, state } = useReveal<HTMLSpanElement>(40);
  let n = 0;
  const words = text.split(" ").filter(Boolean);
  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((w, wi) => (
        <Fragment key={wi}>
          <span aria-hidden className="inline-block overflow-hidden whitespace-nowrap pb-[0.14em] -mb-[0.14em] align-bottom">
            {[...w].map((ch, ci) => (
              <span
                key={ci}
                className={clsx("inline-block", state === "shown" && "animate-[letterUp_.8s_cubic-bezier(.2,.7,.2,1)_both]", state === "hidden" && "translate-y-[110%] opacity-0")}
                style={state === "shown" ? { animationDelay: `${delay + n++ * step}ms` } : undefined}
              >
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
