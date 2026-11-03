/** Nomes legíveis (em português) para o registo de auditoria: nunca se mostram nomes internos de tabelas ou campos. */

const tables: Record<string, string> = {
  site_settings: "Definições do site", training_plans: "Programas", plan_benefits: "Benefícios dos programas",
  courses: "Formações", course_categories: "Categorias de formação", cohorts: "Turmas", events: "Eventos",
  event_editions: "Edições do Summit", event_sessions: "Programação do evento", event_audiences: "Públicos do evento",
  ticket_types: "Ingressos", registrations: "Inscrições", participants: "Participantes", payments: "Pagamentos",
  documents: "Documentos", expenses: "Despesas", exchange_rates: "Câmbios", contracts: "Contratos", leads: "Leads",
  companies: "Empresas", profiles: "Utilizadores", pages: "Landing pages", page_sections: "Secções das páginas",
  testimonials: "Testemunhos", faqs: "Perguntas frequentes", team_members: "Equipa", banners: "Avisos",
  partners: "Parceiros", social_proof: "Prova social", posts: "Artigos", message_templates: "Modelos de mensagem",
};

const fields: Record<string, string> = {
  name: "Nome", full_name: "Nome completo", title: "Título", status: "Estado", price: "Preço", price_published: "Preço visível",
  currency: "Moeda", role: "Papel", active: "Ativo", email: "E-mail", phone: "Telefone", whatsapp: "WhatsApp", slug: "Endereço",
  value: "Valor", description: "Descrição", text: "Texto", position: "Ordem", kind: "Tipo", amount: "Montante", visible: "Visível",
  content: "Conteúdo", tagline: "Subtítulo", duration_label: "Duração", duration_days: "Duração (dias)", cta_label: "Texto do botão",
  starts_at: "Início", ends_at: "Fim", starts_on: "Data de início", ends_on: "Data de fim", city: "Cidade", venue: "Local",
  message: "Mensagem", notes: "Notas", body: "Texto", author: "Autor", rating: "Avaliação", question: "Pergunta", answer: "Resposta",
  label: "Descrição", url: "Ligação", job_title: "Cargo", bio: "Biografia", subtitle: "Subtítulo", headline: "Título de apoio",
  registrations_open: "Inscrições abertas", is_current: "Edição atual", capacity: "Lotação", location: "Local",
  quote_only: "Apenas orçamento", certification: "Com certificação", featured: "Em destaque", modality: "Modalidade",
  created_at: "Criado em", confirmed_at: "Confirmado em", consent: "Consentimento", source: "Origem",
};

const humanize = (s: string) => {
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const tableLabel = (t: string) => tables[t] ?? humanize(t);
export const fieldLabel = (f: string) => fields[f] ?? humanize(f);
