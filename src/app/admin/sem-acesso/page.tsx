import { logout } from "../login/actions";

export default function SemAcesso() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Sem permissão</h1>
      <p className="max-w-sm text-muted">A sua conta não tem acesso a esta área. Peça a um administrador para atribuir o papel adequado.</p>
      <form action={logout}><button className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:bg-mist">Terminar sessão</button></form>
    </main>
  );
}
