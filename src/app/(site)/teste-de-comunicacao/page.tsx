import type { Metadata } from "next";
import Reveal from "@/components/site/Reveal";
import TextReveal from "@/components/site/TextReveal";
import Quiz from "./Quiz";

export const metadata: Metadata = {
  title: "Teste de nível de comunicação",
  description: "Responda a 10 perguntas e descubra o seu nível de comunicação, os seus pontos fortes e o pacote mais indicado.",
};

export default function TestePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <div className="text-center">
        <Reveal><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Autoavaliação</p></Reveal>
        <TextReveal as="h1" text="Qual é o seu nível de" accent="comunicação?" className="mx-auto mt-3 max-w-2xl text-4xl font-extrabold sm:text-5xl" />
        <Reveal delay={150}><p className="mx-auto mt-4 max-w-xl text-muted">Descubra os seus pontos fortes, o que treinar primeiro e o pacote da Academia que mais lhe convém.</p></Reveal>
      </div>
      <div className="mt-12">
        <Quiz />
      </div>
    </div>
  );
}
