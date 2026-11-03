# Academia Tchamile — plataforma digital

Next.js 16 · TypeScript · Tailwind 4 · Supabase (Postgres, Auth, Storage).

## Arranque

1. Crie um projeto em Supabase e execute `supabase/migrations/0001_schema.sql` no SQL Editor.
2. Copie `.env.example` para `.env.local` e preencha URL, anon key e service role key.
3. Crie o primeiro utilizador em Supabase Auth e, no SQL Editor, atribua o papel:
   `update profiles set role = 'superadmin' where id = '<uuid>';`
4. `npm install && npm run dev`

## Identidade visual

Verde `#028034` e preto `#030708`, amostrados do logótipo. O ficheiro em
`public/brand/logo-provisorio.png` é um **recorte provisório** do mockup:
substitua-o pelo logótipo original (idealmente SVG ou PNG de alta resolução) mantendo o nome ou
atualizando `src/components/site/Header.tsx`.

## Estado

Concluído: esquema de dados com RLS/auditoria/inventário (`0001`, `0002_hardening`), site público
(Início, Programas, Formações, Protagonista Summit, Sobre, Contactos, FAQ, Privacidade), inscrição com
upload privado e consulta de estado, landing pages (`/l/...`) com editor de secções, painel
administrativo (dashboard, conteúdos, CRM, formações, inscrições, pagamentos, programas, summit,
utilizadores, exportações) e notificações internas.

Por ligar: e-mail (`RESEND_API_KEY`) e WhatsApp (`WHATSAPP_API_TOKEN`) — sem chave, as notificações
ficam registadas como "skipped". Substituir o logótipo provisório.
