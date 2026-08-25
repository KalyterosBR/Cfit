# Visão da arquitetura

## Componentes

```text
Navegador
  └─ React 19 + TypeScript + Vite
       └─ Axios / API REST
            └─ Django 5 + Django REST Framework
                 └─ PostgreSQL 17

Serviços externos opcionais
  ├─ Cloudflare Turnstile
  ├─ SMTP / WhatsApp
  ├─ gateway de pagamento
  └─ dispositivos de acesso
```

O frontend e o backend são aplicações separadas no desenvolvimento. O frontend usa React Router e páginas carregadas sob demanda. O backend expõe APIs privadas por padrão e usa PostgreSQL como persistência.

## Autenticação e sessão

1. O login público envia e-mail, senha e token Turnstile.
2. O backend valida o Turnstile server-side antes de emitir JWT.
3. Access e refresh ficam no `sessionStorage` ou `localStorage`, conforme “Manter conectado”.
4. O interceptor renova o access token e repete uma requisição que recebeu `401`.
5. Sessões podem ser consultadas e revogadas; contas podem exigir troca de senha e 2FA por e-mail.

O Portal do aluno usa o mesmo modelo de usuário, marcado por `is_student_portal`, e recebe somente `portal.view`. O backend deriva o aluno de `portal_student`; não aceita um ID arbitrário vindo do frontend.

## Autorização e escopo

O backend é a fonte de autorização. `AcademyUser` vincula usuário, academia, perfil e unidade ativa. Capacidades são consolidadas em `apps.users.permissions` para Proprietário, Administrador, Gerente, Recepção, Professor e Financeiro.

O frontend oculta módulos e protege rotas com a mesma linguagem de capacidades, mas isso é apenas UX: acesso direto à API continua validado pelo backend.

O isolamento por academia é obrigatório. A unidade ativa limita os domínios que já foram particionados; a migração dos dados históricos restantes é incremental.

## Organização do backend

```text
apps/<dominio>/
├── api/             serializers, viewsets e URLs quando o domínio exige
├── migrations/      evolução explícita do banco
├── models/          estado persistido
├── selectors/       consultas reutilizáveis
├── services/        operações e regras de negócio
├── tests.py ou tests/
└── admin.py
```

Nem todo app precisa de todas essas pastas. Crie abstrações apenas quando houver responsabilidade real.

## Organização do frontend

```text
frontend/src/
├── components/      componentes compartilhados e layout
├── features/        fluxos por domínio
├── layouts/         estrutura da área autenticada
├── pages/           módulos de primeiro nível
├── routes/          rotas e carregamento sob demanda
├── services/        HTTP e feedback
└── index.css        tokens e fundação visual compartilhada
```

`DashboardLayout` mantém Sidebar e Topbar estáveis. Carregamentos internos usam skeleton na área de conteúdo quando tecnicamente aplicável.

## Tema antes da renderização

Um script síncrono em `frontend/index.html` lê `cfit_theme` antes da hidratação, aplica `.dark` e `data-cfit-theme` ao elemento raiz, define `color-scheme` e usa a preferência do sistema apenas quando não há escolha salva. O provider React parte desse mesmo estado para evitar divergência e clarão branco.

## Integrações e idempotência

Webhooks de pagamento, comunicação e dispositivos são públicos apenas onde explicitamente declarado e usam segredo/chave do provedor. Eventos externos que podem ser repetidos devem possuir chave idempotente. Simuladores e adaptadores internos não equivalem à homologação do fornecedor.

## Auditabilidade

Matrículas, financeiro, usuários, unidades, políticas, dispositivos e automações preservam histórico ou auditoria conforme o risco. Ações sensíveis devem ter capacidade, confirmação, motivo quando aplicável e estado anterior/posterior útil.
