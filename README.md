# Cfit

Sistema de gestão para academias com foco em tecnologia, performance e clareza operacional.

O Cfit centraliza a jornada do aluno, planos, matrículas, cobranças, recebimentos, recorrências, fluxo de caixa e check-ins em uma aplicação web responsiva. O projeto é desenvolvido do zero e também funciona como processo de aprendizado, priorizando código legível, evolução gradual e regras de negócio auditáveis.

## Estado atual

As seguintes áreas possuem implementação funcional:

- homepage institucional e autenticação;
- login JWT protegido por Cloudflare Turnstile;
- dashboard interno responsivo;
- cadastro, edição, busca, segmentação, ativação e inativação de alunos;
- ficha 360º do aluno com visão geral, matrículas, financeiro, check-ins e linha do tempo;
- gestão comercial de planos;
- matrícula guiada, com prévia das cobranças e preservação do histórico;
- gestão financeira central;
- check-in manual e histórico individual.

O módulo financeiro inclui:

- cobranças paginadas e agrupadas;
- filtros por situação, período, competência, plano, pagamento e atraso;
- pagamento individual e seguro em lote;
- cancelamento com motivo;
- conciliação financeira;
- exportação CSV;
- previsão de receita;
- entradas, saídas e visão de fluxo de caixa;
- acompanhamento de tentativas de recorrência;
- central de inconsistências com prioridade, causa e próxima ação;
- auditoria das principais movimentações.

Treinos, Agenda, Relatórios e Configurações possuem rotas protegidas com páginas de `Em desenvolvimento`, mas ainda não são módulos operacionais completos.

> Parte do Dashboard ainda utiliza dados demonstrativos, enquanto os módulos operacionais usam dados persistidos pela API. Esses indicadores demonstrativos não devem ser tratados como consolidação financeira real.

## Tecnologias

### Backend

- Python 3.13;
- Django 5;
- Django REST Framework;
- PostgreSQL 17;
- SimpleJWT;
- django-filter;
- django-cors-headers.

### Frontend

- React 19;
- TypeScript;
- Vite;
- Tailwind CSS;
- shadcn/ui e Base UI;
- Axios;
- React Router;
- Recharts;
- Lucide React;
- react-hot-toast.

### Infraestrutura

- Docker e Docker Compose;
- Git e GitHub.

## Arquitetura

```text
Cfit/
├── apps/                    Aplicações Django e regras de negócio
│   ├── academy/             Academias
│   ├── checkins/            Acessos e histórico de check-ins
│   ├── core/                Recursos compartilhados do backend
│   ├── enrollments/         Matrículas, congelamentos e histórico
│   ├── financial/           Cobranças, caixa, recorrências e auditoria
│   ├── plans/               Planos comerciais
│   ├── scaffold/            Gerador interno de módulos
│   ├── students/            Alunos e ficha operacional
│   └── users/               Usuários e autenticação
├── config/                  Configuração principal do Django
├── docker/                  Imagens do backend e frontend
├── docs/                    Documentação técnica e de produto
├── frontend/                Aplicação React
│   └── src/
│       ├── components/      Componentes compartilhados
│       ├── features/        Funcionalidades por domínio
│       ├── layouts/         Layout da área interna
│       ├── pages/           Páginas principais
│       ├── routes/          Rotas da aplicação
│       └── services/        HTTP, autenticação e feedback
├── AGENTS.md                Contexto oficial para desenvolvimento assistido
├── docker-compose.yml
├── manage.py
└── requirements.txt
```

O backend expõe uma API REST privada por padrão. O frontend utiliza o mesmo serviço HTTP para autenticação, renovação de token e operações dos módulos.

## Pré-requisitos

- Docker com Docker Compose;
- Git.

Não é necessário instalar Python, Node.js ou PostgreSQL localmente para executar o ambiente padrão.

## Configuração do ambiente

Crie um arquivo `.env` na raiz:

```env
POSTGRES_DB=cfit
POSTGRES_USER=cfit
POSTGRES_PASSWORD=troque-esta-senha
DJANGO_SECRET_KEY=troque-esta-chave
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
TURNSTILE_SECRET_KEY=sua-secret-key-do-turnstile
```

Crie também `frontend/.env`:

```env
VITE_TURNSTILE_SITE_KEY=sua-site-key-do-turnstile
```

Os arquivos `.env` não devem ser versionados. A chave secreta do Turnstile deve existir somente no backend.

## Executando com Docker

Construa e inicie os serviços:

```bash
docker compose up -d --build
```

Aplique as migrations:

```bash
docker compose exec django python manage.py migrate
```

Crie o primeiro usuário administrativo:

```bash
docker compose exec django python manage.py createsuperuser
```

Endereços locais:

- aplicação web: `http://localhost:5173`;
- API: `http://localhost:8000/api/`;
- administração Django: `http://localhost:8000/admin/`;
- PostgreSQL: `localhost:5432`.

Para acompanhar os containers:

```bash
docker compose ps
docker compose logs -f django frontend
```

Para encerrar o ambiente:

```bash
docker compose down
```

O volume do PostgreSQL é preservado por padrão. Não use `docker compose down -v` sem a intenção explícita de apagar os dados locais.

## Rotas da aplicação

| Rota | Situação | Finalidade |
| --- | --- | --- |
| `/` | Funcional | Homepage e login |
| `/dashboard` | Funcional | Visão geral da operação |
| `/students` | Funcional | Gestão de alunos |
| `/students/:id` | Funcional | Ficha 360º do aluno |
| `/plans` | Funcional | Planos e condições comerciais |
| `/finance` | Funcional | Operação financeira |
| `/workouts` | Em desenvolvimento | Treinos |
| `/schedule` | Em desenvolvimento | Agenda |
| `/reports` | Em desenvolvimento | Relatórios |
| `/settings` | Em desenvolvimento | Configurações |

Todas as rotas internas exigem autenticação.

## API principal

Os endpoints ficam sob `/api/`:

```text
POST /api/auth/login/
POST /api/auth/refresh/

/api/academies/
/api/students/
/api/plans/
/api/enrollments/
/api/financial/charges/
/api/financial/recurring-attempts/
/api/financial/cash-transactions/
/api/checkins/
```

As APIs são autenticadas por JWT, exceto os endpoints públicos declarados explicitamente. O login só emite tokens depois da validação server-side do Cloudflare Turnstile.

## Rotinas financeiras

O backend possui comandos para manutenção das cobranças:

```bash
# Executa geração recorrente e atualização de atrasos
docker compose exec django python manage.py run_daily_financial

# Executa usando uma data de referência
docker compose exec django python manage.py run_daily_financial --date 2026-08-20

# Executa tarefas separadamente
docker compose exec django python manage.py generate_recurring_charges
docker compose exec django python manage.py mark_overdue_charges
```

Esses comandos devem ser agendados por infraestrutura própria em produção. O repositório não configura um agendador automaticamente.

## Testes e verificações

Backend:

```bash
docker compose exec django python manage.py check
docker compose exec django python manage.py makemigrations --check --dry-run
docker compose exec django python manage.py test
```

Frontend:

```bash
docker compose exec frontend npm run build
docker compose exec frontend npm run lint
```

Consistência do diff:

```bash
git diff --check
```

O build atual pode exibir avisos conhecidos relacionados à posição do script do Turnstile no HTML e ao tamanho do bundle principal. Eles não impedem a compilação. O lint ainda reporta pendências preexistentes, principalmente relacionadas ao carregamento assíncrono iniciado em efeitos React; essas pendências devem ser tratadas em tarefas próprias.

## Regras importantes de desenvolvimento

- use o workspace oficial em `/home/kalyteros/projetos/Cfit`;
- desenvolva e valide preferencialmente pelos containers;
- nunca versione `.env`, tokens ou chaves secretas;
- preserve o histórico de alunos, matrículas e movimentações financeiras;
- não duplique regras financeiras no frontend;
- diferencie dados reais, demonstrativos e ainda não conectados;
- faça alterações pequenas e teste os fluxos afetados;
- consulte o [`AGENTS.md`](AGENTS.md) antes de modificar o projeto.

## Documentação

- [`AGENTS.md`](AGENTS.md): contexto técnico, decisões, diretrizes de produto e roadmap;
- [`docs/`](docs/): arquitetura, convenções, entidades e materiais complementares.

## Repositório

Projeto principal: [`KalyterosBR/Cfit`](https://github.com/KalyterosBR/Cfit)

Branch principal: `main`.

## Autor

João Mendonça
