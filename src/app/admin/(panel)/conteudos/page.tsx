import { requireModule } from "@/lib/auth";
import Image from "next/image";
import { youtubeId } from "@/lib/video";
import ActionForm from "@/components/admin/ActionForm";
import { Checkbox, Field, Select, TextArea } from "@/components/ui";
import { addBanner, addFaq, addMember, addProof, addTestimonial, removeRow, saveAbout, saveContacts, saveHero, saveLegal, addVideo, removeVideo, saveHighlights, saveHomePlans } from "./actions";

export const metadata = { title: "Conteúdos" };

function Del({ table, id }: { table: Parameters<typeof removeRow>[0]; id: string }) {
  return <form action={removeRow.bind(null, table, id)}><button className="text-red-700 underline">Remover</button></form>;
}

export default async function Conteudos() {
  const { db } = await requireModule("conteudos");
  const get = async (k: string) => ((await db.from("site_settings").select("value").eq("key", k).maybeSingle()).data?.value ?? {}) as any;
  const [hero, contacts, about, legal, videos, highlights, homePlans, proof, tests, faqs, team, banners, planList] = await Promise.all([
    get("hero"), get("contacts"), get("about"), get("legal"), get("videos"), get("summit_highlights"), get("home_plans"),
    db.from("social_proof").select("*").order("position").then((r) => r.data ?? []),
    db.from("testimonials").select("*").order("position").then((r) => r.data ?? []),
    db.from("faqs").select("*").order("position").then((r) => r.data ?? []),
    db.from("team_members").select("*").order("position").then((r) => r.data ?? []),
    db.from("banners").select("*").then((r) => r.data ?? []),
    db.from("training_plans").select("kind,name").eq("status", "published").order("position").then((r) => r.data ?? []),
  ]);
  const box = "rounded-xl border border-line bg-paper p-6";
  const list = "mt-3 divide-y divide-line text-sm";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Conteúdos</h1>

      <section className={box}><h2 className="text-xl font-bold">Hero da página inicial</h2>
        <ActionForm action={saveHero} className="mt-4 space-y-3">
          <Field label="Vídeo institucional (URL, opcional)" name="video_url" defaultValue={hero.video_url} hint="Mostra o botão «Ver vídeo institucional» no topo." />
          <Field label="Título" name="title" defaultValue={hero.title} hint="As duas últimas palavras aparecem destacadas a verde." />
          <TextArea label="Subtítulo" name="subtitle" rows={3} defaultValue={hero.subtitle} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Botão principal" name="cta1_label" defaultValue={hero.cta_primary?.label} /><Field label="Destino" name="cta1_href" defaultValue={hero.cta_primary?.href} />
            <Field label="Botão secundário" name="cta2_label" defaultValue={hero.cta_secondary?.label} /><Field label="Destino" name="cta2_href" defaultValue={hero.cta_secondary?.href} />
          </div>
        </ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Prova social</h2>
        <p className="text-sm text-muted">Só indicadores reais. Sem registos, nada é mostrado no site.</p>
        <ul className={list}>{proof.map((p: any) => <li key={p.id} className="flex justify-between py-2"><span>{p.value} — {p.label}</span><Del table="social_proof" id={p.id} /></li>)}</ul>
        <ActionForm action={addProof} submit="Adicionar" variant="ghost" className="mt-3 grid gap-3 sm:grid-cols-3"><Field label="Valor (ex.: +500)" name="value" required /><Field label="Descrição" name="label" required /><Field label="Ordem" name="position" type="number" /></ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Contactos</h2>
        <ActionForm action={saveContacts} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="E-mail" name="email" defaultValue={contacts.email} /><Field label="Telefone" name="phone" defaultValue={contacts.phone} />
          <Field label="WhatsApp" name="whatsapp" defaultValue={contacts.whatsapp} /><Field label="Endereço" name="address" defaultValue={contacts.address} />
          <Field label="Facebook (https://…)" name="facebook" defaultValue={contacts.socials?.facebook} /><Field label="Instagram (https://…)" name="instagram" defaultValue={contacts.socials?.instagram} />
          <Field label="LinkedIn (https://…)" name="linkedin" defaultValue={contacts.socials?.linkedin} /><Field label="YouTube (https://…)" name="youtube" defaultValue={contacts.socials?.youtube} />
        </ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Sobre a Academia</h2>
        <ActionForm action={saveAbout} className="mt-4 space-y-3">
          <TextArea label="História" name="history" defaultValue={about.history} /><TextArea label="Como surgiu" name="origin" defaultValue={about.origin} />
          <TextArea label="Missão" name="mission" rows={2} defaultValue={about.mission} /><TextArea label="Visão" name="vision" rows={2} defaultValue={about.vision} />
          <TextArea label="Metodologia" name="methodology" defaultValue={about.methodology} /><TextArea label="Impacto" name="impact" defaultValue={about.impact} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextArea label="Valores (um por linha)" name="values" rows={4} defaultValue={(about.values ?? []).join("\n")} />
            <TextArea label="Objetivos (um por linha)" name="objectives" rows={4} defaultValue={(about.objectives ?? []).join("\n")} />
            <TextArea label="Diferenciais (um por linha)" name="differentials" rows={4} defaultValue={(about.differentials ?? []).join("\n")} />
            <TextArea label="Áreas de especialização (uma por linha)" name="specialties" rows={4} defaultValue={(about.specialties ?? []).join("\n")} />
          </div>
        </ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Equipa e formadores</h2>
        <ul className={list}>{team.map((m: any) => <li key={m.id} className="flex justify-between py-2"><span>{m.name} · {m.job_title}{m.is_trainer && " · formador"}</span><Del table="team_members" id={m.id} /></li>)}</ul>
        <ActionForm action={addMember} submit="Adicionar membro" variant="ghost" className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Nome" name="name" required /><Field label="Cargo" name="job_title" /><Field label="Especialização" name="specialization" />
          <label className="block text-sm"><span className="font-medium">Fotografia</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" /></label>
          <div className="sm:col-span-2"><TextArea label="Biografia" name="bio" rows={3} /></div><Checkbox name="is_trainer" label="É formador" />
        </ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Testemunhos</h2>
        <ul className={list}>{tests.map((t: any) => <li key={t.id} className="flex justify-between py-2"><span>{t.author} — “{t.body.slice(0, 60)}” ({t.status})</span><Del table="testimonials" id={t.id} /></li>)}</ul>
        <ActionForm action={addTestimonial} submit="Adicionar" variant="ghost" className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Autor" name="author" required /><Field label="Cargo / empresa" name="role" /><Field label="Avaliação (1 a 5)" name="rating" type="number" min={1} />
          <label className="block text-sm"><span className="font-medium">Fotografia (opcional)</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" /></label><div className="sm:col-span-2"><TextArea label="Texto" name="body" rows={3} required /></div>
          <Checkbox name="published" label="Publicar já (apenas testemunhos autorizados)" />
        </ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Pacotes principais do Início</h2>
        <p className="text-sm text-muted">Os três pacotes mostrados na página inicial. O do meio aparece em destaque. Os preços e os textos editam-se em Programas.</p>
        <ActionForm action={saveHomePlans} className="mt-3 grid gap-3 sm:grid-cols-3">
          {(["slot1", "slot2", "slot3"] as const).map((slot, i) => (
            <Select key={slot} label={i === 1 ? "Pacote do meio (destaque)" : `Pacote ${i === 0 ? "da esquerda" : "da direita"}`} name={slot} required
              defaultValue={(homePlans.kinds?.length === 3 ? homePlans.kinds : ["turma", "personalizado", "mentoria"])[i]}
              options={(planList ?? []).map((p: { kind: string; name: string }) => ({ value: p.kind, label: p.name }))} />
          ))}
        </ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Destaques do Protagonista Summit</h2>
        <p className="text-sm text-muted">Lista junto à contagem decrescente no Início (até 5 linhas, uma por destaque). Escreva apenas o que o evento realmente inclui.</p>
        <ActionForm action={saveHighlights} className="mt-3 space-y-3">
          <TextArea label="Destaques (um por linha)" name="highlights" rows={5} defaultValue={(highlights.items ?? []).join("\n")} />
        </ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Galeria de vídeos</h2>
        <p className="text-sm text-muted">Cada vídeo aparece como cartão no Início (o primeiro fica em destaque). A secção só é mostrada quando há vídeos. Use ligações do YouTube.</p>
        {(videos.items ?? []).length > 0 && (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(videos.items as { id?: string; title: string; label?: string; url: string }[]).map((v, i) => {
              const yt = youtubeId(v.url);
              return (
                <li key={v.id ?? v.url} className="overflow-hidden rounded-xl border border-line">
                  <div className="relative aspect-video bg-ink">
                    {yt && <Image src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" fill sizes="320px" className="object-cover" />}
                    {i === 0 && <span className="absolute left-2 top-2 rounded bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">Destaque</span>}
                  </div>
                  <div className="flex items-start justify-between gap-2 p-3 text-sm">
                    <div><p className="font-semibold">{v.title}</p>{v.label && <p className="text-xs text-muted">{v.label}</p>}</div>
                    <form action={removeVideo.bind(null, v.id ?? v.url)}><button className="text-red-700 underline">Remover</button></form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <ActionForm action={addVideo} submit="Adicionar vídeo" variant="ghost" className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Título" name="title" required /><Field label="Categoria (ex.: Evento)" name="label" /><Field label="Ligação do YouTube" name="url" required placeholder="https://www.youtube.com/watch?v=…" />
        </ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Perguntas frequentes</h2>
        <ul className={list}>{faqs.map((f: any) => <li key={f.id} className="flex justify-between py-2"><span>{f.question}</span><Del table="faqs" id={f.id} /></li>)}</ul>
        <ActionForm action={addFaq} submit="Adicionar" variant="ghost" className="mt-3 space-y-3"><Field label="Pergunta" name="question" required /><TextArea label="Resposta" name="answer" rows={3} required /><Field label="Ordem" name="position" type="number" /></ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Avisos (banner)</h2>
        <ul className={list}>{banners.map((b: any) => <li key={b.id} className="flex justify-between py-2"><span>{b.message}</span><Del table="banners" id={b.id} /></li>)}</ul>
        <ActionForm action={addBanner} submit="Publicar aviso" variant="ghost" className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Mensagem" name="message" required /><Field label="Ligação (opcional)" name="link_url" /></ActionForm></section>

      <section className={box}><h2 className="text-xl font-bold">Privacidade e termos</h2>
        <ActionForm action={saveLegal} className="mt-4 space-y-3">
          <TextArea label="Política de privacidade" name="privacy" rows={8} defaultValue={legal.privacy} /><TextArea label="Termos de utilização" name="terms" rows={8} defaultValue={legal.terms} />
        </ActionForm></section>
    </div>
  );
}
