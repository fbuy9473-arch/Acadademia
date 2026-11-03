import { requireModule } from "@/lib/auth";
import ActionForm from "@/components/admin/ActionForm";
import { Checkbox, Field, Select } from "@/components/ui";
import { inviteUser, setRole } from "./actions";

export const metadata = { title: "Utilizadores" };

const roleOptions = [
  { value: "superadmin", label: "Superadministrador" }, { value: "admin", label: "Administrador" }, { value: "comercial", label: "Comercial" },
  { value: "financeiro", label: "Financeiro" }, { value: "formador", label: "Formador" }, { value: "gestor_eventos", label: "Gestor de eventos" }, { value: "editor", label: "Editor de conteúdos" },
];

export default async function Utilizadores() {
  const { db } = await requireModule("utilizadores");
  const { data: users } = await db.from("profiles").select("*").order("created_at");
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Utilizadores e permissões</h1>
      <div className="space-y-3">
        {(users ?? []).map((u) => (
          <div key={u.id} className="rounded-xl border border-line bg-paper p-4">
            <p className="font-semibold">{u.full_name || "(sem nome)"}</p>
            <ActionForm action={setRole.bind(null, u.id)} className="mt-3 flex flex-wrap items-end gap-4">
              <Select label="Papel" name="role" defaultValue={u.role} options={roleOptions} />
              <Checkbox name="active" label="Ativo" defaultChecked={u.active} />
            </ActionForm>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-line bg-paper p-6">
        <h2 className="text-xl font-bold">Convidar utilizador</h2>
        <ActionForm action={inviteUser} submit="Enviar convite" className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Nome" name="full_name" /><Field label="E-mail" name="email" type="email" required /><Select label="Papel" name="role" required options={roleOptions} />
        </ActionForm>
      </section>
    </div>
  );
}
