import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Compass size={30} /></span>
        <h1 className="mt-6 text-4xl font-extrabold">Página não encontrada</h1>
        <p className="mt-3 text-muted">A página que procura não existe ou mudou de lugar.</p>
        <Link href="/" className="btn-shine mt-7 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
          Voltar ao início <ArrowRight size={18} />
        </Link>
      </div>
    </main>
  );
}
