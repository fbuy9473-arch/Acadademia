"use client";

import { useActionState } from "react";
import { Button, FormMessage } from "@/components/ui";
import type { Result } from "@/lib/actions";

/** Formulário genérico ligado a uma Server Action, com estado e mensagem. */
export default function ActionForm({
  action, children, submit = "Guardar", className = "space-y-4", variant = "primary",
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  children: React.ReactNode; submit?: string; className?: string; variant?: "primary" | "ghost" | "danger";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      <FormMessage state={state} />
      <Button type="submit" variant={variant} disabled={pending}>{pending ? "A guardar…" : submit}</Button>
    </form>
  );
}
