"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Logo } from "@/components/site/Logo";
import { Button, Field, FormMessage } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <form action={action} className="w-full max-w-sm space-y-5 rounded-2xl border border-line bg-paper p-8 shadow-sm">
        <Logo className="mx-auto h-14 w-auto" />
        <h1 className="text-center text-xl font-bold">Área administrativa</h1>
        <Field label="E-mail" name="email" type="email" required />
        <Field label="Palavra-passe" name="password" type="password" required />
        <FormMessage state={state} />
        <Button type="submit" disabled={pending} className="w-full">{pending ? "A entrar…" : "Entrar"}</Button>
      </form>
    </main>
  );
}
