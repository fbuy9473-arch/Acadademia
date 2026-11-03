"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

/** Erro inesperado: mensagem genérica, sem qualquer detalhe técnico. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-extrabold">Algo correu mal</h1>
        <p className="mt-3 text-muted">Não foi possível mostrar esta página. Tente novamente dentro de instantes.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="btn-shine inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
            <RotateCcw size={16} /> Tentar novamente
          </button>
          <Link href="/" className="inline-flex items-center rounded-xl border border-line px-6 py-3 font-semibold hover:bg-mist">Voltar ao início</Link>
        </div>
      </div>
    </main>
  );
}
