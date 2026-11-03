/** Teste de nível de comunicação: autoavaliação orientativa (não é uma avaliação formal). */

export type Dimension = "confianca" | "estrutura" | "relacao";

export const dimensions: Record<Dimension, { label: string; tip: string }> = {
  confianca: {
    label: "Confiança",
    tip: "Pratique falar em voz alta todos os dias, comece por grupos pequenos e ensaie a abertura da sua intervenção até ela sair com naturalidade.",
  },
  estrutura: {
    label: "Estrutura e clareza",
    tip: "Antes de falar, escreva a ideia central numa frase e organize três pontos de apoio, com um exemplo para cada.",
  },
  relacao: {
    label: "Relação com o público",
    tip: "Ouça sem interromper, reformule o que ouviu antes de responder e adapte a linguagem a quem tem à sua frente.",
  },
};

export type Question = { text: string; dim: Dimension; options: [string, string, string, string] };

/** Cada resposta vale 0, 1, 2 ou 3 pontos, na ordem em que aparece. */
export const questions: Question[] = [
  {
    text: "Quando tenho de falar em público, sinto…",
    dim: "confianca",
    options: ["Medo ou bloqueio que me impede de falar", "Muito nervosismo, mas consigo começar", "Algum nervosismo que passa depressa", "Confiança e gosto em falar"],
  },
  {
    text: "Quando apresento uma ideia, consigo organizá-la com início, meio e fim.",
    dim: "estrutura",
    options: ["Quase nunca", "Às vezes", "Quase sempre", "Sempre"],
  },
  {
    text: "Uso a voz de forma intencional (ritmo, volume, pausas) e olho para as pessoas enquanto falo.",
    dim: "confianca",
    options: ["Raramente", "Só quando me lembro", "Na maior parte das vezes", "Faço-o com naturalidade"],
  },
  {
    text: "Numa reunião, quando alguém discorda de mim, eu…",
    dim: "relacao",
    options: ["Calo-me e evito o confronto", "Defendo-me com irritação", "Explico o meu ponto com calma", "Ouço, reformulo e argumento com factos"],
  },
  {
    text: "Adapto a minha mensagem a quem me ouve (chefia, equipa, cliente, jovens).",
    dim: "relacao",
    options: ["Falo sempre da mesma maneira", "Raramente adapto", "Adapto com frequência", "Adapto sempre, com facilidade"],
  },
  {
    text: "Consigo ser claro e direto, sem rodeios nem excesso de palavras.",
    dim: "estrutura",
    options: ["Perco-me e demoro a chegar ao ponto", "Às vezes alongo-me demasiado", "Normalmente sou claro", "Sou sempre claro e conciso"],
  },
  {
    text: "Quando escuto, não interrompo e faço perguntas para compreender melhor.",
    dim: "relacao",
    options: ["Tenho dificuldade em não interromper", "Escuto, mas raramente pergunto", "Escuto e pergunto com frequência", "Escuto com atenção total e pergunto sempre"],
  },
  {
    text: "Peço e aceito feedback sobre a minha forma de comunicar e aplico melhorias.",
    dim: "relacao",
    options: ["Evito ouvir críticas", "Ouço, mas pouco mudo", "Peço feedback de vez em quando", "Peço feedback e ajusto de imediato"],
  },
  {
    text: "Uso histórias e exemplos concretos para convencer e prender a atenção.",
    dim: "estrutura",
    options: ["Nunca", "Raramente", "Muitas vezes", "Sempre que faz sentido"],
  },
  {
    text: "Perante imprevistos ou perguntas difíceis, mantenho a clareza.",
    dim: "confianca",
    options: ["Fico completamente bloqueado", "Perco o fio e demoro a recuperar", "Recupero com alguma facilidade", "Mantenho a calma e respondo com segurança"],
  },
];

export const MAX_SCORE = questions.length * 3;

export type LevelKey = "inicial" | "intermedio" | "avancado";

export const levels: Record<LevelKey, { title: string; summary: string; plan: string; planKind: "turma" | "personalizado" | "mentoria"; planWhy: string }> = {
  inicial: {
    title: "Nível inicial",
    summary: "Está a dar os primeiros passos. A boa notícia é que a comunicação treina-se, e com método a evolução é rápida.",
    plan: "Treinamento por Turma",
    planKind: "turma",
    planWhy: "Uma experiência estruturada em grupo para construir a base: perder o medo, organizar ideias e ganhar prática.",
  },
  intermedio: {
    title: "Nível intermédio",
    summary: "Já comunica com alguma segurança, mas há pontos concretos a afinar para ganhar impacto e consistência.",
    plan: "Treinamento Personalizado",
    planKind: "personalizado",
    planWhy: "Formação adaptada às suas necessidades, focada exatamente nos pontos que mais pesam no seu resultado.",
  },
  avancado: {
    title: "Nível avançado",
    summary: "Comunica com confiança e estrutura. O próximo salto está no refinamento, na liderança e na marca pessoal.",
    plan: "Mentoria",
    planKind: "mentoria",
    planWhy: "Acompanhamento individual e estruturado para aperfeiçoar o seu estilo e a sua influência ao longo do tempo.",
  },
};

export type Result = {
  score: number;
  level: LevelKey;
  dims: { key: Dimension; label: string; score: number; max: number; pct: number }[];
  weakest: Dimension;
};

export function evaluate(answers: number[]): Result {
  const score = answers.reduce((a, b) => a + b, 0);
  const level: LevelKey = score <= 10 ? "inicial" : score <= 20 ? "intermedio" : "avancado";
  const dims = (Object.keys(dimensions) as Dimension[]).map((key) => {
    const idx = questions.flatMap((q, i) => (q.dim === key ? [i] : []));
    const s = idx.reduce((a, i) => a + (answers[i] ?? 0), 0);
    const max = idx.length * 3;
    return { key, label: dimensions[key].label, score: s, max, pct: Math.round((s / max) * 100) };
  });
  const weakest = [...dims].sort((a, b) => a.pct - b.pct)[0].key;
  return { score, level, dims, weakest };
}
