"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ListChecks, RotateCcw } from "lucide-react";
import clsx from "clsx";
import CountUp from "@/components/site/CountUp";
import { Checkbox, Field, FormMessage } from "@/components/ui";
import { dimensions, evaluate, levels, MAX_SCORE, questions } from "@/lib/quiz";
import { saveQuizResult } from "./actions";

type Phase = "intro" | "questions" | "result";

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [leaving, setLeaving] = useState(false);

  const total = questions.length;
  const q = questions[step];

  const choose = (points: number) => {
    if (leaving) return;
    const next = [...answers.slice(0, step), points];
    setAnswers(next);
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      if (step + 1 >= total) setPhase("result");
      else setStep(step + 1);
    }, 260);
  };

  const restart = () => { setAnswers([]); setStep(0); setPhase("intro"); };

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-paper p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><ListChecks size={26} /></span>
        <h2 className="mt-5 text-2xl font-bold sm:text-3xl">Pronto para descobrir o seu nível?</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">São {total} perguntas de autoavaliação. Não há respostas certas ou erradas: responda com a maior sinceridade possível.</p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted"><Clock size={16} /> Cerca de 3 minutos</p>
        <div>
          <button type="button" onClick={() => setPhase("questions")} className="btn-shine mt-7 inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 font-semibold text-white transition-colors hover:bg-brand-dark">
            Começar o teste <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (phase === "questions") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Pergunta {step + 1} de {total}</span>
          <span>{dimensions[q.dim].label}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${((step + (leaving ? 1 : 0)) / total) * 100}%` }} />
        </div>

        <div key={step} className={clsx("mt-8 transition-all duration-300", leaving ? "-translate-x-6 opacity-0" : "animate-[fadeUp_.45s_ease-out_both]")}>
          <h2 className="text-2xl font-bold leading-snug sm:text-3xl">{q.text}</h2>
          <div role="radiogroup" aria-label={q.text} className="mt-6 space-y-3">
            {q.options.map((label, i) => {
              const on = answers[step] === i;
              return (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => choose(i)}
                  className={clsx(
                    "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-md",
                    on ? "border-brand bg-brand-soft" : "border-line bg-paper",
                  )}
                >
                  <span className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold", on ? "border-brand bg-brand text-white" : "border-line text-muted")}>{String.fromCharCode(65 + i)}</span>
                  <span className="font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink disabled:invisible">
          <ArrowLeft size={16} /> Pergunta anterior
        </button>
      </div>
    );
  }

  return <ResultView answers={answers} onRestart={restart} />;
}

function ResultView({ answers, onRestart }: { answers: number[]; onRestart: () => void }) {
  const r = evaluate(answers);
  const lv = levels[r.level];
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrown(true), 150); return () => clearTimeout(t); }, []);
  const planHref = lv.planKind === "personalizado" ? `/contactos?assunto=${lv.planKind}` : `/inscricao?plano=${lv.planKind}`;
  const pct = Math.round((r.score / MAX_SCORE) * 100);

  const [state, action, pending] = useActionState(async (prev: Parameters<typeof saveQuizResult>[0], fd: FormData) => {
    const phone = String(fd.get("phone") ?? "").trim();
    if (phone && !phone.startsWith("+")) fd.set("phone", `+244 ${phone}`);
    return saveQuizResult(prev, fd);
  }, null);
  const e = state?.errors ?? {};

  return (
    <div className="mx-auto max-w-3xl animate-[fadeUp_.6s_ease-out_both] space-y-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#04180d] via-[#06331a] to-brand p-8 text-white shadow-xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">O seu resultado</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{lv.title}</h2>
          <p className="text-5xl font-extrabold tabular-nums"><CountUp value={String(r.score)} /><span className="text-2xl font-semibold text-white/70">/{MAX_SCORE}</span></p>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-[#2fbf6a] transition-all duration-[1400ms] ease-out" style={{ width: grown ? `${pct}%` : "0%" }} />
        </div>
        <p className="mt-5 max-w-xl text-white/90">{lv.summary}</p>
      </div>

      <div className="rounded-3xl border border-line bg-paper p-6 shadow-sm sm:p-8">
        <h3 className="text-xl font-bold">Os seus pontos</h3>
        <ul className="mt-5 space-y-5">
          {r.dims.map((d) => (
            <li key={d.key}>
              <div className="flex items-center justify-between text-sm"><span className="font-semibold">{d.label}</span><span className="text-muted">{d.score} de {d.max}</span></div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
                <div className={clsx("h-full rounded-full transition-all duration-[1200ms] ease-out", d.key === r.weakest ? "bg-amber-500" : "bg-brand")} style={{ width: grown ? `${d.pct}%` : "0%" }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl bg-mist p-4 text-sm">
          <p className="font-semibold">Onde focar primeiro: {dimensions[r.weakest].label}</p>
          <p className="mt-1 text-muted">{dimensions[r.weakest].tip}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-brand bg-brand-soft/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Pacote recomendado</p>
        <h3 className="mt-2 text-2xl font-bold">{lv.plan}</h3>
        <p className="mt-2 text-muted">{lv.planWhy}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={planHref} className="btn-shine inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">Quero este pacote <ArrowRight size={16} /></Link>
          <Link href="/programas" className="inline-flex items-center gap-2 rounded-xl border border-brand px-6 py-3 font-semibold text-brand hover:bg-brand hover:text-white">Ver todos os programas</Link>
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-paper p-6 shadow-sm sm:p-8">
        <h3 className="text-xl font-bold">Quer que a nossa equipa o contacte?</h3>
        <p className="mt-1 text-sm text-muted">Deixe os seus dados e guardamos o seu resultado para o aconselhar melhor. É opcional.</p>
        {state?.ok ? (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-brand-soft p-4 font-medium text-brand"><CheckCircle2 size={20} /> {state.message}</p>
        ) : (
          <form action={action} className="mt-5 space-y-4">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <input type="hidden" name="score" value={r.score} />
            <input type="hidden" name="level" value={r.level} />
            <input type="hidden" name="plan" value={lv.planKind} />
            <input type="hidden" name="dims" value={r.dims.map((d) => `${d.key}:${d.score}/${d.max}`).join(",")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" name="name" required error={e.name?.[0]} />
              <Field label="E-mail" name="email" type="email" required error={e.email?.[0]} />
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">Telefone<span className="text-brand"> *</span></span>
                <span className="mt-1 flex overflow-hidden rounded-lg border border-line focus-within:border-brand">
                  <span className="flex items-center border-r border-line bg-mist px-2.5 text-xs font-semibold text-muted">AO +244</span>
                  <input name="phone" type="tel" required placeholder="9XX XXX XXX" className="min-w-0 flex-1 bg-paper px-3 py-2.5 outline-none" />
                </span>
                {e.phone?.[0] && <span className="mt-1 block text-xs text-red-600">{e.phone[0]}</span>}
              </label>
            </div>
            <Checkbox name="consent" required label="Consinto o tratamento dos meus dados para ser contactado sobre este resultado." />
            {e.consent && <p className="text-xs text-red-600">{e.consent[0]}</p>}
            <FormMessage state={state} />
            <button type="submit" disabled={pending} className="rounded-xl bg-ink px-6 py-3 font-semibold text-white hover:bg-ink/90 disabled:opacity-60">{pending ? "A guardar…" : "Guardar o meu resultado"}</button>
          </form>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>Resultado orientativo, baseado na sua própria avaliação. Não substitui uma avaliação feita por um formador.</p>
        <button type="button" onClick={onRestart} className="inline-flex items-center gap-2 font-semibold text-ink hover:text-brand"><RotateCcw size={15} /> Refazer o teste</button>
      </div>
    </div>
  );
}
