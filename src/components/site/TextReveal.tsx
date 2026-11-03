"use client";

import { Fragment } from "react";
import clsx from "clsx";
import { useReveal } from "./useReveal";

/** Título que revela as palavras, uma a uma, sempre que entra no ecrã. `accent` aparece destacado a verde. */
export default function TextReveal({ text, accent, as = "h2", className, accentClassName = "text-brand" }: {
  text: string; accent?: string; as?: "h1" | "h2" | "h3" | "p"; className?: string; accentClassName?: string;
}) {
  const { ref, state } = useReveal<HTMLHeadingElement & HTMLParagraphElement>(40);

  const words = [
    ...text.split(" ").filter(Boolean).map((w) => ({ w, accent: false })),
    ...(accent ? accent.split(" ").filter(Boolean).map((w) => ({ w, accent: true })) : []),
  ];
  const Tag = as;
  return (
    <Tag ref={ref} className={className} aria-label={[text, accent].filter(Boolean).join(" ")}>
      {words.map(({ w, accent: a }, i) => (
        <Fragment key={i}>
          <span aria-hidden className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
            <span
              className={clsx("inline-block transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)]", a && accentClassName, state === "hidden" && "translate-y-[110%]")}
              style={{ transitionDelay: state === "shown" ? `${i * 55}ms` : undefined }}
            >
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
