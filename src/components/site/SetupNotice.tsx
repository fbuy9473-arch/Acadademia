import Link from "next/link";
import { ArrowRight, Hourglass } from "lucide-react";

/** Estado vazio público: aparece quando ainda não há conteúdo publicado nesta secção. */
export default function SetupNotice({ what }: { what: string }) {
  return (
    <div className="mx-auto my-10 max-w-xl rounded-3xl border border-line bg-paper p-10 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Hourglass size={26} /></span>
      <h2 className="mt-5 text-2xl font-bold">{what} em breve</h2>
      <p className="mt-2 text-muted">Estamos a preparar este conteúdo. Entretanto, fale connosco ou descubra o seu nível de comunicação.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/contactos" className="btn-shine inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">Falar connosco <ArrowRight size={16} /></Link>
        <Link href="/teste-de-comunicacao" className="inline-flex items-center gap-2 rounded-xl border border-brand px-5 py-3 font-semibold text-brand hover:bg-brand hover:text-white">Fazer o teste</Link>
      </div>
    </div>
  );
}
