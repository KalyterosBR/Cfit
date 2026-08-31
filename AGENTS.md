# AGENTS.md — Cfit

## 1. Objetivo deste arquivo
Este arquivo contém o contexto técnico, regras e decisões principais do projeto Cfit para uso no Codex.

Antes de qualquer alteração:
1. Leia este arquivo inteiro.
2. Leia os arquivos diretamente envolvidos na tarefa.
3. Preserve decisões arquiteturais e visuais existentes.
4. Não faça refactors ou alterações não solicitadas.
5. Prefira mudanças pequenas, seguras e testáveis.

---

## 2. Projeto
**Nome:** Cfit

**Objetivo:** construir um sistema completo de gestão para academias, inspirado em sistemas como Next Fit, desenvolvido do zero.

O sistema deve centralizar:
- alunos;
- planos;
- matrículas;
- financeiro;
- check-ins;
- agenda;
- treinos;
- relatórios;
- gestão operacional.

O projeto também serve como processo de aprendizado de programação. Priorizar código legível, organização, responsabilidades claras, evolução gradual e evitar complexidade desnecessária.

---

## 3. Stack
### Backend
- Python
- Django
- Django REST Framework
- PostgreSQL
- SimpleJWT
- django-filter
- django-cors-headers
- python-dotenv
- requests

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- lucide-react
- React Router
- Axios
- Recharts
- react-hot-toast

### Infraestrutura
- Docker
- Docker Compose
- Git
- GitHub
- VS Code

---

## 4. Repositório
Repositório principal: `KalyterosBR/Cfit`

Branch principal: `main`

Workspace oficial atual:
```text
/home/kalyteros/projetos/Cfit
```

O projeto foi migrado de `/mnt/c/Users/Conecta_Suporte/Desktop/Projeto/Cfit` para o sistema de arquivos nativo do WSL porque arquivos no bind mount do Windows estavam sendo apresentados como `root`/`nobody`, impedindo gravações consistentes pelo VS Code e pelo Codex.

Usar somente o workspace em `/home/kalyteros/projetos/Cfit` para desenvolvimento. A cópia antiga em `/mnt/c/.../Cfit` foi preservada apenas como segurança e não deve receber novas alterações.

Fluxo normal:
```bash
git status
git add .
git commit -m "mensagem do commit"
git push origin main
```

---

## 5. Docker
O projeto é desenvolvido através de Docker.

Subida normal:
```bash
docker compose up -d --build
```

Serviços principais:
- PostgreSQL: `postgres:17`
- Porta externa PostgreSQL: `5432`
- Porta interna PostgreSQL: `5432`
- Django: `8000`
- Frontend/Vite: `5173`

Os serviços `django` e `frontend` usam no `docker-compose.yml`:
```yaml
user: "${LOCAL_UID:-1000}:${LOCAL_GID:-1000}"
```

Isso evita que arquivos gerados nos bind mounts sejam criados como `root`. O PostgreSQL continua usando o usuário próprio da imagem.

Evitar exigir instalação local de Python, PostgreSQL ou dependências já encapsuladas no Docker.

---

## 6. Variáveis de ambiente
Existe `.env` na raiz para backend e `frontend/.env` para o Vite. Esses arquivos não devem ser versionados.

Backend usa, entre outras:
```env
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
DJANGO_SECRET_KEY=
DJANGO_DEBUG=
DJANGO_ALLOWED_HOSTS=
TURNSTILE_SECRET_KEY=
```

Frontend usa:
```env
VITE_TURNSTILE_SITE_KEY=
VITE_PUBLIC_SITE_URL=
```

`VITE_PUBLIC_SITE_URL` recebe a origem pública absoluta do frontend somente em produção. Ausência da variável ou uma origem local mantém o site sem indexação.

Nunca:
- colocar `TURNSTILE_SECRET_KEY` no frontend;
- commitar secrets;
- exibir secrets em logs;
- colocar secrets diretamente no código.

---

## 7. Estrutura backend
Projeto Django: `config/`

Arquivos principais:
```text
config/settings.py
config/urls.py
config/asgi.py
config/wsgi.py
```

Apps existentes:
```text
apps/core
apps/scaffold
apps/academy
apps/students
apps/plans
apps/users
apps/enrollments
apps/financial
apps/checkins
apps/workouts
apps/schedule
apps/automations
apps/operations
```

Também está habilitado `django.contrib.postgres`.

---

## 8. Usuário personalizado
O projeto usa:
```python
AUTH_USER_MODEL = "users.User"
```
Não alterar isso sem necessidade arquitetural muito forte.

---

## 9. Django REST Framework
Configuração geral:
```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.DefaultPagination",
    "PAGE_SIZE": 10,
}
```

Todas as APIs são privadas por padrão. Endpoints públicos devem declarar isso explicitamente.

---

## 10. JWT
Autenticação com SimpleJWT.

Configuração atual:
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}
```

Rotas:
```text
POST /api/auth/login/
POST /api/auth/refresh/
```

A rota de login não usa mais diretamente `TokenObtainPairView`; usa uma view personalizada com validação Cloudflare Turnstile.

---

## 11. Cloudflare Turnstile
O login público está protegido com Cloudflare Turnstile.

Fluxo atual:
```text
Usuário
↓
Cloudflare Turnstile
↓
token Turnstile
↓
React
↓
POST /api/auth/login/
↓
Django
↓
Cloudflare Siteverify
↓
validação aprovada
↓
SimpleJWT
↓
access + refresh
↓
Dashboard
```

A validação server-side é obrigatória.

---

## 12. Turnstile — frontend
Arquivo:
```text
frontend/src/features/auth/components/TurnstileWidget.tsx
```

O script é carregado em `frontend/index.html`:
```html
<script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
  async
  defer
></script>
```

Site Key via:
```text
VITE_TURNSTILE_SITE_KEY
```

O widget usa tema escuro e foi visualmente reduzido para integrar ao card. Não aumentar sem necessidade.

---

## 13. Turnstile — backend
Arquivo:
```text
apps/users/api/turnstile.py
```

Responsabilidade: validar o token através de:
```text
https://challenges.cloudflare.com/turnstile/v0/siteverify
```

Secret via:
```text
TURNSTILE_SECRET_KEY
```

Dependência usada: `requests`.

---

## 14. Login personalizado
Arquivo:
```text
apps/users/api/viewsets.py
```

Classe atual: `TurnstileTokenObtainPairView`.

Fluxo:
1. recebe `turnstile_token`;
2. valida com Cloudflare;
3. rejeita se falhar;
4. só então executa o fluxo padrão do SimpleJWT.

Não remover essa validação.

---

## 15. Payload atual do login
Frontend envia:
```json
{
  "email": "...",
  "password": "...",
  "turnstile_token": "..."
}
```

Serviço:
```text
frontend/src/features/auth/services/auth.service.ts
```

Interface:
```ts
export interface LoginCredentials {
    email: string;
    password: string;
    turnstile_token: string;
}
```

---

## 16. Reset do Turnstile após falha no login
O Turnstile já está funcionando corretamente de ponta a ponta.

Fluxo testado com sucesso:
```text
Turnstile → React → Django → Cloudflare → JWT → Dashboard
```

Tokens do Cloudflare Turnstile são de uso único. Por isso, o frontend agora renova automaticamente a verificação quando uma tentativa de login falha.

Implementação atual:
- `TurnstileWidget.tsx` aceita a prop `resetKey`;
- quando `resetKey` muda, o componente chama `window.turnstile.reset(widgetId)`;
- `LoginForm.tsx` limpa `turnstileToken` no `catch` do login;
- o formulário incrementa `turnstileResetKey`, fazendo o widget gerar uma nova verificação;
- o botão permanece desabilitado até a obtenção do novo token.

Arquivos envolvidos:
```text
frontend/src/features/auth/components/TurnstileWidget.tsx
frontend/src/features/auth/components/LoginForm.tsx
```

O layout e a correção visual de autofill foram preservados.

---

## 17. LoginForm
Arquivo:
```text
frontend/src/features/auth/components/LoginForm.tsx
```

Responsabilidades:
- e-mail;
- senha;
- mostrar/ocultar senha;
- opção funcional “Manter conectado”;
- esqueci senha visual;
- Turnstile;
- login;
- salvar JWT;
- navegar para Dashboard;
- exibir erros.

Login atual:
```ts
const data = await login({
    email: email.trim(),
    password,
    turnstile_token: turnstileToken,
});
```

Após sucesso:
```ts
saveTokens(data.access, data.refresh, keepConnected);
navigate("/dashboard", { replace: true });
```

Com “Manter conectado” desmarcado, os tokens ficam no `sessionStorage`. Com a opção marcada, ficam no `localStorage`.

Após falha da requisição de login:
```ts
setTurnstileToken("");
setTurnstileResetKey((current) => current + 1);
```

Isso impede a reutilização do token Turnstile consumido.


---

## 18. Autofill dos inputs
Chrome estava deixando inputs preenchidos automaticamente com fundo branco.

Foi adicionada correção visual de autofill em e-mail e senha.

Ao alterar `LoginForm.tsx`, não remover essa correção. O input deve continuar integrado ao card escuro.

---

## 19. Tokens frontend
JWT usa `sessionStorage` ou `localStorage`, conforme a escolha feita no login.

Chaves:
```text
cfit_access_token
cfit_refresh_token
```

Comportamento atual:
- “Manter conectado” desmarcado → access e refresh em `sessionStorage`;
- “Manter conectado” marcado → access e refresh em `localStorage`;
- ao salvar uma sessão, o serviço limpa os tokens do outro storage;
- a renovação do access token preserva o storage da sessão atual;
- a leitura procura primeiro no `sessionStorage` e depois no `localStorage`;
- o logout limpa os dois storages.

Arquivo responsável:
```text
frontend/src/features/auth/services/token.service.ts
```

Já existem funções para salvar, recuperar e apagar tokens. Não criar implementação paralela.

---

## 20. ProtectedRoute
Arquivo:
```text
frontend/src/features/auth/components/ProtectedRoute.tsx
```

Comportamento:
- sem access token → redirect `/login`, preservando a rota solicitada para retorno seguro após autenticação;
- com token → `Outlet`

Fluxo já testado. Logout remove token e retorna ao login. Não alterar sem necessidade.

O interceptor HTTP adiciona o access token às requisições privadas. Em resposta `401`, tenta renovar a sessão com o refresh token e repete a requisição original. Se não houver refresh token ou a renovação falhar, limpa os dois storages e redireciona para `/login`.

---

## 21. Rotas frontend
```text
/                  Homepage institucional
/login             Autenticação de clientes
/dashboard         Dashboard
/students          Lista de alunos
/students/:id      Detalhes do aluno
/plans             Planos
/finance           Gestão financeira
/workouts          Gestão de treinos e biblioteca de exercícios
/schedule          Agenda unificada
/reports           Relatórios gerenciais
/settings          Configurações organizadas e pesquisáveis
/units             Academia e unidades
/automations       Automações orientadas por eventos
/checkins          Monitor e operação de acessos
/growth            Comercial e turmas
/documents         Documentos e portal
/operations        Central operacional
/onboarding        Configuração inicial da academia
/password-access   Primeiro acesso e troca obrigatória de senha
/portal            Portal do aluno
```

A rota `/` é a homepage institucional. A autenticação fica exclusivamente em `/login`.

Todas essas rotas estão registradas em `frontend/src/routes/index.tsx`. Relatórios e Configurações possuem primeiras etapas funcionais conectadas aos domínios já disponíveis.

Estrutura atual relevante do frontend:
```text
frontend/src/components             componentes compartilhados
frontend/src/components/dashboard   componentes visuais da Dashboard
frontend/src/components/layout      Sidebar e Topbar
frontend/src/features/auth           homepage, login e autenticação
frontend/src/features/students       alunos, matrículas, financeiro e check-ins do aluno
frontend/src/layouts                 layout da área interna
frontend/src/pages                   páginas principais
frontend/src/routes                  configuração das rotas
frontend/src/services                cliente HTTP, interceptors e toast
frontend/src/theme                   tokens visuais
```

---

## 22. Homepage pública e login
A rota `/` tem papel exclusivamente institucional: apresenta o produto e não incorpora o formulário de autenticação. A rota `/login` concentra o acesso do cliente, reutiliza o card escuro premium e preserva Turnstile, JWT, segundo fator, recuperação de senha e persistência da sessão.

Estrutura atual da homepage:
```text
HomeHeader
↓
Hero + demonstração do produto
↓
HomeFeatures
↓
HomeSystem
↓
HomeBenefits
↓
HomeAccess
↓
HomeFooter
```

Hierarquia de ações:
- CTA principal e CTA secundário exploram seções reais da própria homepage;
- `Entrar` e `Acessar o Cfit` levam sempre a `/login`;
- não criar CTA comercial, teste, preço, formulário ou promessa sem fluxo real que o sustente.

As demonstrações usam exclusivamente dados fictícios e devem exibir `Representação demonstrativa` de forma inequívoca. Funcionalidade parcial, planejada ou conceitual não pode ser descrita como disponível. Provas de confiança, números, depoimentos, integrações e certificações só podem aparecer quando forem verificáveis e autorizados.

Cada afirmação demonstrativa deve corresponder a comportamento comprovável no produto. Quando representar roadmap, título e descrição precisam declarar `visão de evolução`, `experiência planejada` ou equivalente; o aviso genérico de demonstração não transforma uma promessa futura em funcionalidade disponível.

A homepage mantém densidade editorial compacta: Hero, mapa da operação, produto, confiança, acesso, CTA e footer, sem altura artificial. A redução de altura não pode ocultar conteúdo, diminuir a legibilidade dos mockups nem comprometer alvos de toque e ausência de overflow entre `360px` e telas largas.

Navegação para seções usa links com fragmentos reais (`#recursos`, `#sistema`, `#solucoes`); botões ficam reservados a ações. Troca manual de aba ou setas pausa o carousel, assim como foco, hover e `prefers-reduced-motion`.

SEO é condicionado a `VITE_PUBLIC_SITE_URL`: somente `/` em build de produção com origem pública não local recebe `index,follow`. Login, recuperação, páginas internas, desenvolvimento e homologação permanecem `noindex,nofollow`. Canonical, `og:url`, imagem social, `robots.txt` e sitemap usam a mesma origem; nunca publicar canonical localhost.

O header mantém indicação da seção ativa, acesso imediato ao login e menu mobile que fecha por seleção ou `Escape`, bloqueando o scroll de fundo enquanto aberto. A homepage deve preservar um único `h1`, landmarks, foco visível, semântica de abas e ausência de overflow horizontal.

Animações devem respeitar `prefers-reduced-motion`. O carousel pausa em foco ou hover, possui controle de reprodução e mantém o timer de transição como proteção contra animações incompletas. Alterações precisam ser verificadas em desktop, tablet e mobile, incluindo 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844 e 360×800.

O carregamento inicial é separado por grupo de rota. `/` usa fallback público claro e `/login`, recuperação e redefinição de senha usam fallback compatível com o acesso; nenhum deles pode renderizar Sidebar, Topbar, tabela ou outro skeleton da aplicação interna. O `AppBootSkeleton` é exclusivo das rotas protegidas enquanto a sessão e o perfil são validados. A restauração assíncrona da sessão não deve bloquear a homepage, expor conteúdo protegido ou ser simulada com atrasos artificiais. Em carregamento frio, inclusive com cache limpo, conexão lenta, sessão ausente ou expirada, o primeiro frame precisa manter a superfície correta da rota e não pode produzir clarão de tema, loop de redirecionamento ou vazamento visual.

O tema inicial das rotas públicas é sempre claro, independentemente da preferência salva para a área autenticada. Rotas internas preservam o tema escolhido antes do React carregar. As classificações de marketing são verificáveis no código: representações baseadas em recursos entregues continuam identificadas como demonstrativas e usam apenas dados fictícios; capacidades parciais ou planejadas recebem `Visão de evolução do módulo` junto ao título e não podem usar linguagem de disponibilidade. Central operacional e Agenda só podem manter afirmações sobre fila, SLA, responsáveis, conflitos, ocupação, lista de espera, chamada e histórico enquanto esses comportamentos permanecerem implementados e persistidos no produto.

Arquivos relevantes em:
```text
frontend/src/features/auth/components/
```

Incluindo:
```text
HomeAccess.tsx
HomeBenefits.tsx
HomeFeatures.tsx
HomeFooter.tsx
HomeHeader.tsx
HomeHero.tsx
HomeProductPreview.tsx
HomeSystem.tsx
LoginForm.tsx
LoginHeader.tsx
ProtectedRoute.tsx
TurnstileWidget.tsx
```

---

## 23. Identidade visual
Posicionamento:
```text
Tecnologia + Performance + Gestão Premium
```

Ideia central:
```text
Cfit = performance da academia, não apenas software administrativo.
```

Transmitir:
- tecnologia;
- performance;
- controle;
- organização;
- confiança;
- produto premium.

Evitar:
- template SaaS genérico;
- landing azul genérica;
- aparência feita por IA;
- vibe de musculação/suplementos;
- excesso de cards iguais;
- excesso de pills;
- excesso de gradiente;
- excesso de glow.

---

## 24. Cores
Paleta conceitual:
- Azul elétrico: ação.
- Ciano: tecnologia e assinatura.
- Azul quase preto: premium e estrutura.
- Branco gelo: contraste e áreas claras.

Gradientes azul → ciano podem ser usados com moderação.

---

## 25. Hero
Eyebrow:
```text
PERFORMANCE PARA SUA GESTÃO.
```

Headline:
```text
Gestão que acompanha o ritmo da sua academia.
```

Descrição:
```text
Controle sua operação, acompanhe seus números e transforme informação em decisões melhores para sua academia.
```

Indicadores:
```text
OPERAÇÃO — Tudo sob controle
PERFORMANCE — Decisões mais claras
```

CTA:
```text
Explore o Cfit
```

---

## 26. Login visual
Card escuro premium dedicado à rota `/login`, separado do Hero institucional.

Características:
- azul quase preto;
- linha superior azul → ciano;
- glow controlado;
- cantos grandes;
- sombra suave;
- indicador de ambiente seguro;
- Turnstile integrado visualmente.

Textos incluem:
```text
Ambiente Cfit
Gestão da sua academia
ÁREA DO GESTOR
Bem-vindo de volta.
```

Não redesenhar sem solicitação explícita.

---

## 27. HomeFeatures
Objetivo: mostrar que os módulos do Cfit são conectados.

Fluxo conceitual:
```text
01 Aluno
↓
02 Plano e matrícula
↓
03 Financeiro
↓
04 Gestão
```

Mensagem:
```text
Tudo conversa dentro do Cfit.
```

Narrativa desejada:
```text
PROMESSA
↓
COMO A OPERAÇÃO FUNCIONA
↓
COMO AS PARTES SE CONECTAM
↓
RESULTADO NO DASHBOARD
↓
CTA
```

---

## 28. HomeSystem
HomeSystem mostra representação real do produto e reutiliza componentes do Dashboard.

O carousel já apresentou bug porque dependia de `onAnimationEnd` para finalizar transição.

Foi corrigido com timer via `useEffect`:
```ts
useEffect(() => {
    if (incomingSlide === null) return;

    const transitionTimer = window.setTimeout(() => {
        setActiveSlide(incomingSlide);
        setIncomingSlide(null);
    }, 700);

    return () => window.clearTimeout(transitionTimer);
}, [incomingSlide]);
```

Transição: `700ms`

Autoplay: `6000ms`

NÃO voltar a depender exclusivamente de `onAnimationEnd`.

---

## 29. Smooth scroll
A homepage usa smooth scroll personalizado.

Tentativas com apenas `scrollIntoView` e CSS `scroll-behavior` falharam.

Foi criada função própria com `requestAnimationFrame`, duração aproximada de `700ms` e easing customizado.

Está funcionando. NÃO substituir ou reescrever sem necessidade.

---

## 30. Header mobile
Mobile tem menu hambúrguer.

Fluxo esperado:
1. usuário toca no item;
2. menu fecha;
3. página rola suavemente até a seção.

O fechamento antes do scroll é intencional.

---

## 31. Dashboard
O Dashboard possui integração com dados operacionais para resumo financeiro, histórico de receita, pagamentos, alunos ativos, check-ins, cobranças vencidas, metas e prioridades. Qualquer conteúdo fictício deve permanecer explicitamente marcado como demonstrativo.

Visual atual:
- temas claro e noturno baseados em tokens semânticos compartilhados;
- largura de conteúdo limitada a `1600px`;
- linguagem `Mapa Operacional Cfit`, com composição aberta e assimétrica;
- abertura editorial compacta, integrada ao painel operacional de prioridade;
- profundidade criada por contraste, divisórias, tipografia e tonalidade, sem sombras pretas;
- painéis harmonizados `Leitura financeira` e `Leitura da base`, ambos em matriz `2 × 2`;
- metas em uma faixa contínua, prioridades operacionais em matriz `3 × 2` e análise em capítulos;
- check-ins recentes com data e horário separados e layout protegido contra sobreposição;
- responsividade considera a largura útil após a Sidebar, evitando ativar colunas precocemente.

O painel operacional de prioridade usa exclusivamente dados reais disponíveis. Quando não existem pendências, apresenta um estado resolvido compacto, sem inventar métricas ou ações.

A Dashboard deve respeitar capacidades também na camada de carregamento, não apenas na ocultação visual. Perfis sem `finance.view`/`finance.manage` não podem disparar consultas financeiras; perfis sem `checkins.view`/`checkins.manage` não podem disparar consultas ou metas de check-in. A visão do Professor usa dados autorizados de alunos, treinos, avaliações e agenda, e não deve exibir erros de permissão como conteúdo operacional. O componente de prioridades deve consultar somente as fontes necessárias para a visão selecionada.

Componentes principais:
```text
DashboardLayout
DashboardHeader
RevenueChart
RecentPayments
RecentCheckins
PendingStudents
DashboardAttention
RevenueGoalCard
CheckInGoalCard
ActiveStudentGoalCard
```

Alguns são reutilizados na homepage.

Preservar a linguagem visual atual e não reintroduzir uma grade genérica de cards brancos, grandes superfícies pretas ou sombras escuras sem solicitação explícita.

---

## 31.1 Sidebar, Topbar e layout interno
Arquivos principais:
```text
frontend/src/layouts/DashboardLayout.tsx
frontend/src/components/layout/Sidebar.tsx
frontend/src/components/layout/Topbar.tsx
frontend/src/components/branding/Logo.tsx
```

O `DashboardLayout` mantém a Sidebar e a Topbar ao redor de uma área de conteúdo rolável. A página ocupa a altura da viewport e evita scroll concorrente no contêiner externo.

Sidebar atual:
- azul quase preto, alinhada à identidade premium do Cfit;
- largura de `280px`;
- fixa e visível em telas grandes;
- menu lateral sobreposto em telas menores;
- overlay fecha o menu mobile;
- selecionar um item também fecha o menu mobile;
- item da rota atual usa gradiente azul e destaque visual;
- módulos sem permissão não aparecem;
- grupos por domínio são recolhíveis;
- favoritos são persistidos em `cfit_sidebar_favorites` e só aparecem quando adicionados pelo usuário;
- a seção `Recentes` e o rastreamento `cfit_sidebar_recent` foram removidos;
- logo específico de alta visibilidade usa `cfit-logo-sidebar.png`;
- clicar no logo navega para `/dashboard` e fecha a Sidebar mobile;
- a navegação central possui scroll independente e retorna ao início quando a rota muda, mantendo logo e primeiros grupos previsíveis;
- a Sidebar não projeta sombra escura sobre o conteúdo;
- logout permanece funcional no menu de perfil da Topbar.

Fluxo de logout atual:
```text
clique no perfil da Topbar e em “Sair”
↓
clearTokens()
↓
limpeza de localStorage e sessionStorage
↓
fechamento da Sidebar mobile
↓
navegação para / com replace
```

A Topbar mostra o contexto da rota, botão de abertura da Sidebar no mobile, busca universal, notificações visuais e identificação do administrador. A busca localiza alunos, planos e cobranças e funciona também como command palette. O sino abre somente o estado visual `Notificações serão exibidas aqui`; ainda não existe sistema real de notificações. O menu do perfil contém o logout funcional.

Não mover o logout para uma implementação paralela e não remover o comportamento responsivo sem solicitação.

---

## 32. Students API
Regra importante: CPF é único.

`StudentViewSet` usa somente `OrderingFilter` diretamente e mantém:
```python
ordering_fields = ["name", "created_at"]
ordering = ["name"]
```

O parâmetro `search` é lido em `get_queryset()` e enviado ao selector:
```python
search_students(search)
```

O selector pesquisa por `search_name` ou `cpf` e ordena o resultado por nome.

---

## 33. Regras de negócio — Alunos
Cadastro mínimo:
- nome;
- CPF único.

Também previsto:
- telefone/WhatsApp;
- foto opcional;
- histórico;
- status ativo/inativo;
- reativação.

Aluno inativo não deve desaparecer do histórico.

---

## 34. Regras de negócio — Academias
Arquitetura deve permitir futuramente:
- múltiplas academias;
- múltiplas filiais;
- isolamento de dados entre academias.

Evitar decisões que tornem multi-academia impossível no futuro.

Fundação multiunidade implementada:
- modelo `academy.Unit`, sempre vinculado a uma academia;
- código único por academia;
- API privada `/api/academies/units/`, isolada pela academia do usuário;
- `AcademyUser.active_unit` preserva o contexto operacional selecionado;
- `POST /api/users/me/active-unit/` troca somente para uma unidade ativa da mesma academia;
- rota frontend `/units` permite cadastrar e selecionar unidades.

Essa fundação ainda não significa que todos os modelos históricos estejam particionados por unidade. Alunos, cobranças, check-ins, agenda e demais domínios devem receber o vínculo e filtros de unidade incrementalmente, com migração de dados explícita.

---

## 35. Regras de negócio — Planos
Permitir:
- múltiplos planos;
- aluno com mais de um plano ativo quando necessário;
- regras e valores;
- congelamento;
- período mínimo entre congelamentos configurável.

---

## 36. Regras de negócio — Matrículas
Matrículas devem preservar histórico. Evitar exclusões destrutivas que eliminem histórico operacional.

---

## 37. Regras de negócio — Financeiro
O módulo central de gestão financeira está implementado na rota protegida:
```text
/finance
```

Arquivos principais:
```text
apps/financial/api/serializers.py
apps/financial/api/viewsets.py
apps/financial/tests.py
frontend/src/pages/Financial.tsx
frontend/src/features/students/services/financial.service.ts
frontend/src/routes/index.tsx
```

Comportamento implementado:
- listagem paginada de cobranças de toda a academia;
- busca server-side por aluno, descrição da cobrança ou plano;
- categorias operacionais para cobranças vencidas, a vencer, futuras, pagas, canceladas e inconsistentes;
- filtros por vencimento, competência, plano, meio de pagamento, faixa de atraso e conciliação;
- visão individual ou agrupada por aluno e matrícula;
- resumo do filtro atual com totais recebidos, em aberto e atrasados;
- registro de pagamento individual ou em lote, sempre com meio de pagamento;
- cancelamento com confirmação e motivo obrigatório;
- conciliação com identificação de divergência;
- exportação CSV;
- previsão de receita em 3, 6 ou 12 meses;
- fluxo de caixa com entradas, saídas, realizado e projetado;
- registro e acompanhamento de tentativas de recorrência;
- central de inconsistências calculada a partir de dados reais, com prioridade, causa e próxima ação;
- auditoria de pagamento, cancelamento e conciliação;
- acesso ao detalhe do aluno a partir da cobrança;
- estados de carregamento, vazio, erro e nova tentativa;
- feedback de sucesso ou erro por toast.

Endpoints usados:
```text
GET  /api/financial/charges/
GET  /api/financial/charges/summary/
GET  /api/financial/charges/grouped/
GET  /api/financial/charges/forecast/
GET  /api/financial/charges/inconsistencies/
GET  /api/financial/charges/export/
POST /api/financial/charges/:id/pay/
POST /api/financial/charges/bulk-pay/
POST /api/financial/charges/:id/reconcile/
POST /api/financial/charges/:id/cancel/
GET  /api/financial/recurring-attempts/
POST /api/financial/recurring-attempts/
GET  /api/financial/cash-transactions/
POST /api/financial/cash-transactions/
```

As ações “Registrar pagamento” e “Cancelar” foram removidas da aba Financeiro do detalhe do aluno. Essa aba permanece como consulta contextual do histórico individual; as ações operacionais ficam centralizadas em `/finance`.

Não duplicar regras financeiras no frontend. A página central e o detalhe do aluno devem continuar usando o mesmo serviço e a mesma API.

Ainda previsto para evolução futura:
- permissões financeiras por perfil;
- filtros por unidade e responsável quando esses domínios estiverem disponíveis;
- fila inteligente de recuperação;
- relatórios financeiros gerenciais mais amplos.

Tolerância inicial planejada: `7 dias`, configurável futuramente.

---

## 38. Check-in
Check-in básico está implementado dentro do cadastro/detalhes do aluno.

Backend:
```text
apps/checkins/models.py
apps/checkins/api/serializers.py
apps/checkins/api/viewsets.py
apps/checkins/api/urls.py
apps/checkins/tests.py
```

Frontend:
```text
frontend/src/features/students/pages/StudentDetailsPage.tsx
frontend/src/features/students/services/checkin.service.ts
```

Rota privada:
```text
GET  /api/checkins/
POST /api/checkins/
```

Comportamento atual:
- a aba “Check-ins” do detalhe do aluno carrega o histórico filtrado pelo identificador do aluno;
- o histórico é ordenado do acesso mais recente para o mais antigo;
- a interface exibe total, último check-in, origem e observação;
- a listagem usa a paginação padrão da API;
- o usuário pode registrar manualmente um check-in;
- a observação é opcional e limitada a `255` caracteres;
- quando uma política bloqueia o acesso, a interface mostra a causa real retornada pela API;
- o usuário autorizado pode marcar `Autorizar em contingência` e deve informar motivo obrigatório;
- a contingência respeita `allow_manual_contingency`, registra `authorized_by` e alimenta a auditoria;
- após o registro, a primeira página é recarregada;
- existem estados de carregamento, vazio, erro e nova tentativa.

O modelo `CheckIn` preserva:
- aluno com `ForeignKey(..., on_delete=models.PROTECT)`;
- data e horário em `checked_in_at`;
- origem `manual`, `access_control` ou `facial_recognition`;
- observação opcional;
- índice por aluno e data do check-in.

A API permite somente leitura e criação por HTTP (`GET` e `POST`). Não adicionar alteração ou exclusão sem uma decisão explícita sobre preservação do histórico.

Existem testes para autenticação obrigatória, filtro/ordenação, persistência e liberação manual em contingência com motivo e usuário autorizador.

Futuro: reconhecimento facial.

Aluno deve possuir identificador único adequado para essa evolução.

---

## 39. Logs e auditoria
Já existem registros de histórico e auditoria para ações relevantes de aluno, matrícula e financeiro. A cobertura deve continuar evoluindo para incluir integralmente:
- alteração de matrícula;
- alteração financeira;
- cancelamentos;
- mudanças relevantes em alunos;
- ações administrativas.

A primeira trilha administrativa central está implementada em `apps.users.AdministrativeAudit`. Alterações de perfil e ativação de vínculos registram ator, ação, entidade, valores anterior e posterior, motivo, origem e data. A consulta privada fica em `GET /api/users/audits/` e exige capacidade administrativa.

Criação e alteração de unidades e regras de automação também alimentam essa trilha.

Projetar serviços novos pensando em auditabilidade quando fizer sentido.

---

## 40. Permissões
O RBAC incremental usa os perfis já existentes em `AcademyUser`: Proprietário, Administrador, Gerente, Recepção, Professor e Financeiro.

Implementação atual:
- `GET /api/users/me/` expõe perfil, academia e capacidades da sessão;
- `GET /api/users/members/` e `PATCH /api/users/members/:id/` administram vínculos da academia;
- operações financeiras diferenciam leitura (`finance.view`) e escrita (`finance.manage`) no backend;
- Proprietário e Administrador possuem todas as capacidades nesta primeira etapa;
- contas antigas sem vínculo `AcademyUser` preservam acesso administrativo temporário para compatibilidade durante a transição;
- alterações de perfil e ativação geram auditoria administrativa.

Expandir as permissões para os demais módulos gradualmente. Não criar uma matriz excessivamente granular sem necessidade de negócio.

---

## 41. Filosofia de desenvolvimento
O projeto deve evoluir em etapas pequenas.

Ao receber uma tarefa:
1. localizar o código atual;
2. entender o fluxo;
3. alterar somente o necessário;
4. evitar alterações colaterais;
5. executar testes relevantes;
6. informar claramente o que mudou.

Não fazer grandes refactors espontaneamente.

---

## 42. Preferência para alterações
Sempre que possível:
- fornecer/editar arquivos completos;
- manter código legível;
- evitar patches confusos;
- preservar formatação existente;
- não mudar muitos arquivos para resolver problema simples.

Se um único arquivo resolver o problema, alterar um único arquivo.

---

## 43. Regra importante para Codex
NÃO assuma conteúdo de arquivos sem lê-los.

Mesmo que este `AGENTS.md` descreva a arquitetura, o código do repositório é a fonte atual de verdade.

Antes de alterar um arquivo:
```text
abra e leia o arquivo atual.
```

Se houver diferença entre este documento e o código atual:
1. não sobrescrever silenciosamente;
2. investigar;
3. preservar comportamento existente;
4. explicar a divergência quando relevante.

---

## 44. Não fazer sem solicitação
Não:
- trocar stack;
- migrar React;
- migrar Django;
- trocar PostgreSQL;
- substituir SimpleJWT;
- remover Docker;
- redesenhar homepage;
- alterar identidade visual;
- refatorar estrutura inteira;
- alterar APIs existentes sem necessidade;
- mudar smooth scroll funcional;
- reescrever carousel funcional;
- conectar Dashboard inteiro ao backend;
- adicionar bibliotecas pesadas sem necessidade.

---

## 45. Segurança
Sempre:
- secrets ficam em `.env`;
- validar dados recebidos pelo backend;
- autenticação crítica deve ser validada server-side;
- frontend nunca é fonte confiável;
- não expor detalhes internos desnecessários em erros públicos;
- não logar tokens JWT;
- não logar tokens Turnstile;
- não logar passwords;
- não logar Secret Keys.

---

## 46. Workflow recomendado para novas tarefas
Ao receber algo como `corrija X`:
```text
1. localizar os arquivos envolvidos
2. ler implementação atual
3. identificar causa
4. propor mudança mínima
5. implementar
6. testar
7. relatar resultado
```

Para bugs:
```text
não reescrever antes de identificar a causa.
```

---

## 47. Estado atual resumido
Estado confirmado no código e nas validações de encerramento de 20/08/2026:
- homepage institucional e identidade visual premium implementadas;
- login JWT protegido por Cloudflare Turnstile;
- reset automático do Turnstile após falha de login implementado;
- rotas privadas protegidas por `ProtectedRoute`;
- renovação automática do access token por interceptor HTTP;
- opção “Manter conectado” funcional com escolha entre `sessionStorage` e `localStorage`;
- logout funcional na Sidebar, limpando os dois storages;
- novo layout interno responsivo com Sidebar escura, Topbar clara e área de conteúdo padronizada;
- Dashboard redesenhada e parcialmente conectada às APIs de check-ins e financeiro, mantendo parte dos indicadores demonstrativos;
- gestão de alunos com busca por nome ou CPF tolerante a acentos e caixa, filtros rápidos, estados estáveis, validações, máscaras e histórico de ativação/inativação;
- ficha 360º com resumo operacional, matrículas, cobranças, check-ins e linha do tempo combinada;
- planos com campos comerciais, cobrança, recorrência, fidelidade, renovação, benefícios, regras de acesso, contrato e análise de impacto;
- matrícula guiada com preço contratado, desconto, vencimento, aceite contratual, prévia e auditoria comercial;
- módulo Financeiro central em `/finance`, com filtros avançados, competência, agrupamento, seleção segura, pagamento em lote, exportação, conciliação, previsão, caixa, recorrências e central de inconsistências;
- aba Financeiro do detalhe do aluno mantida somente para consulta contextual;
- Check-in manual e histórico de check-ins funcionais no detalhe do aluno;
- módulo Treinos funcional na rota `/workouts` e na ficha do aluno, com prescrições editáveis, modelos reutilizáveis, biblioteca, sessões, aderência, evolução, revisão e impressão;
- rota `/schedule` funcional com agenda unificada;
- rota `/reports` funcional com indicadores gerenciais baseados nas APIs existentes;
- rota `/settings` funcional em primeira etapa, com categorias pesquisáveis e contexto da academia atual;
- títulos das páginas apresentados em português no documento do navegador;
- README atualizado para refletir arquitetura, setup, rotas, APIs e validações atuais;
- artefatos gerados, assets padrão, templates server-side antigos e arquivos comprovadamente órfãos removidos da estrutura;
- app `apps/checkins`, API privada, migração e testes adicionados ao backend;
- workspace oficial migrado para `/home/kalyteros/projetos/Cfit`;
- Django e frontend executam nos containers com UID/GID `1000`;
- arquivos gerados `frontend/node_modules` e `frontend/dist` pertencem a `kalyteros`;
- containers Django, frontend e PostgreSQL estão ativos a partir do novo workspace.

Limites atuais confirmados:
- Relatórios ainda possuem um conjunto inicial de perguntas gerenciais, sem catálogo avançado ou exportações próprias;
- Configurações expõem inicialmente a organização dos domínios e o contexto da academia, sem edição dos módulos ainda indisponíveis;
- o módulo web de Treinos está operacional; aplicativo próprio do aluno permanece fora do frontend atual;
- busca, notificações e menu do usuário da Topbar são apenas visuais;
- o Dashboard possui período configurável, comparações, metas, personalização visual por função e seção `Requer atenção`; a personalização ainda não representa RBAC;
- RBAC incremental implementado por perfil, inicialmente aplicado à administração de usuários e às operações financeiras;
- auditoria administrativa central cobre alterações de perfil e ativação; a cobertura dos demais domínios continua incremental;
- automações possuem regras configuráveis, ativação, disparo explícito e histórico explicável de execução;
- unidades possuem cadastro, isolamento pela academia e seleção do contexto ativo; os módulos históricos ainda não estão integralmente particionados por unidade;
- o lint do frontend possui pendências preexistentes, principalmente pela regra `react-hooks/set-state-in-effect`.

---

## 48. PONTO EXATO DE RETOMADA — histórico de 20/08/2026

> **Estado: superado.** Preservado como histórico da migração para WSL. Para retomada atual, usar a seção 48.4.
O workspace oficial agora é:
```text
/home/kalyteros/projetos/Cfit
```

Na próxima sessão, começar com:
```text
Leia o AGENTS.md para entender o contexto geral.
```

Depois, confirmar com `pwd` que a sessão está no novo workspace e executar `git status` antes de qualquer alteração.

Estado encerrado nesta sessão:
- migração para o WSL concluída;
- fundações de alunos, planos, matrículas e financeiro evoluídas conforme descrito na seção 47;
- migrations novas criadas para histórico de aluno, modelo comercial/contratual de planos e matrículas, pagamento, competência, auditoria, conciliação, caixa e recorrências;
- limpeza conservadora da estrutura concluída;
- README atualizado;
- 55 testes de backend passaram para financeiro, planos, alunos e check-ins;
- `python manage.py check` passou;
- `makemigrations --check --dry-run` não detectou alterações pendentes;
- build de produção do frontend passou;
- `git diff --check` passou;
- lint executado, mas ainda falha por pendências registradas na seção 47.

Avisos observados no build, sem falha:
- `frontend/index.html` possui o script do Turnstile antes da tag `<head>`, gerando aviso `misplaced-start-tag-for-head-element`;
- o bundle principal ultrapassa `500 kB` após minificação;
- Vite informa que resolução nativa de paths pode substituir futuramente `vite-tsconfig-paths`.

Não corrigir esses avisos automaticamente sem uma tarefa específica.

Ao iniciar uma nova sessão:
1. confirmar a tarefa desejada com o usuário;
2. ler os arquivos diretamente envolvidos;
3. considerar como incompletas apenas as áreas explicitamente confirmadas no estado atual;
4. não escolher automaticamente um módulo futuro como prioridade.

Próximo ponto recomendado do roadmap, sujeito à confirmação do usuário:
1. tornar o Dashboard acionável, conectado e personalizável;
2. primeiro auditar cada indicador para separar explicitamente dado real de demonstrativo;
3. depois implementar período, comparação, detalhamento por clique e seção `Requer atenção` em tarefas pequenas;
4. não conectar ou substituir todos os indicadores em uma única alteração.

Pendências visíveis adicionais:
- busca universal e command palette implementadas para alunos, planos, cobranças e ações rápidas;
- monitor de acessos e integrações de check-in ainda não implementados;
- Customer Health Score ainda não implementado;
- gestão web de Treinos implementada com prescrição, execução, modelos e evolução;
- busca, notificações e menu do usuário da Topbar permanecem visuais.

O reset do Turnstile, a persistência opcional do login, o logout da Sidebar, o Check-in básico e o módulo Financeiro central já estão implementados. Diagnosticar antes de alterar caso algum desses fluxos apresente falha em validação manual.

---

## 48.1 Histórico — Diretrizes de Produto, UX e Roadmap anterior

> **Estado: superado como roadmap ativo.** Esta seção preserva o diagnóstico e as decisões históricas que continuam úteis, mas sua ordem de execução foi substituída pela auditoria priorizada da seção 48.3. Em caso de conflito de prioridade ou estado, prevalece a seção 48.3. As regras arquiteturais, de segurança, identidade visual e desenvolvimento incremental das seções anteriores continuam válidas.

### 48.1.1 Natureza e uso destas diretrizes
Esta seção consolida o diagnóstico de produto, UX/UI e prioridades do Cfit como referência oficial para decisões futuras.

Ela deve ser tratada como diretriz de produto e orientação de roadmap, não como autorização automática para implementar todos os itens, alterar o escopo de uma tarefa ou realizar grandes refactors. Cada evolução continua sujeita a solicitação específica, inspeção do código atual, validação técnica e de negócio, implementação incremental e testes proporcionais ao risco.

As classificações usadas nesta seção são:
- **Já existe:** implementação visível ou comportamento confirmado, que deve ser preservado e verificado no código antes de qualquer alteração.
- **Precisa ser corrigido:** inconsistência, risco ou estado inadequado que deve ser tratado antes de aprofundar o módulo relacionado.
- **Precisa ser melhorado:** evolução de uma base já existente.
- **Ainda não implementado:** capacidade futura ou espaço reservado; não documentar como funcional até confirmação no código.

Quando esta seção descrever uma capacidade futura, ela não substitui as seções de estado atual deste arquivo. O código permanece como fonte de verdade.

### 48.1.2 Contexto e posicionamento do produto
O Cfit é um sistema de gestão de academias com identidade própria baseada em:
- tecnologia;
- performance;
- gestão premium;
- clareza operacional;
- experiência moderna;
- decisões orientadas por dados.

O produto não deve copiar identidade visual, textos, telas, layouts proprietários ou implementações de concorrentes. Referências externas devem ser traduzidas para soluções coerentes com a arquitetura, a identidade visual e os objetivos do Cfit.

O Cfit deve absorver profundidade operacional sem se tornar excessivamente complexo. A meta é oferecer uma experiência mais clara, proativa, integrada e orientada a decisões do que sistemas tradicionais de gestão de academias.

### 48.1.3 Princípios gerais de produto e UX
1. Orientar o usuário para decisões e próximas ações, não apenas exibir registros.
2. Mostrar o que precisa de atenção agora.
3. Manter a jornada do aluno centralizada em uma ficha 360º.
4. Reduzir navegação desnecessária por meio de busca universal e ações rápidas.
5. Manter dashboards personalizados por função e contexto.
6. Usar linguagem visual premium, com densidade controlada e excelente legibilidade.
7. Explicar bloqueios, falhas e inconsistências com causa e próxima ação.
8. Transformar relatórios em análises exploráveis e acionáveis.
9. Oferecer automações transparentes, com histórico e auditoria.
10. Combinar tecnologia e performance por meio de metas, tendências, comparações e indicadores preditivos.
11. Manter uma única fonte de dados entre dashboard, alunos, matrículas, planos, financeiro, check-ins e relatórios.
12. Não permitir que o aumento da profundidade funcional destrua a simplicidade atual do Cfit.
13. Diferenciar sempre dados reais, demonstrativos, simulados e ainda não conectados.
14. Evitar IDs técnicos, termos internos e detalhes de implementação na interface cotidiana.
15. Toda ação sensível deve possuir confirmação, permissões adequadas e registro de auditoria.

### 48.1.4 Estado atual observado
**Já possuem implementação visível:**
- Dashboard;
- Gestão de alunos;
- Cadastro de aluno;
- Ficha detalhada do aluno;
- Planos;
- Cadastro de plano;
- Financeiro.

**Possuem item de navegação ou espaço reservado, mas estão incompletos:**
- Agenda;
- Relatórios;
- Configurações.

No estado técnico confirmado, Treinos é um módulo web operacional. Agenda possui primeira etapa operacional. Relatórios e Configurações possuem primeiras etapas funcionais e incrementais, limitadas aos domínios já disponíveis.

A ficha do aluno já possui abas para:
- Visão geral;
- Planos;
- Financeiro;
- Check-ins;
- Treinos;
- Histórico.

A aba Treinos possui prescrição completa, execução e evolução. Check-ins possui estrutura inicial, histórico e registro manual, incluindo estado vazio. O histórico atual contém principalmente movimentações de matrícula.

### 48.1.5 Prioridade alta — fundações e consistência

#### A. Consistência dos dados
**Precisa ser corrigido antes de aprofundar integrações:** assegurar que os dados apresentados no Dashboard coincidam com os módulos operacionais.

Diretrizes:
- Dashboard, alunos, planos, financeiro e check-ins devem utilizar uma única fonte de dados.
- Não apresentar métricas demonstrativas como se fossem dados reais.
- Identificar claramente ambientes, dados simulados e informações ainda não conectadas.
- Evitar divergências entre totais do Dashboard e registros encontrados nas listagens.
- Criar estados de erro quando uma métrica não puder ser calculada.
- Garantir que filtros, períodos e regras de cálculo sejam claros e auditáveis.

Dependência: esta fundação antecede dashboards conectados, relatórios, comparações entre unidades, indicadores preditivos e automações orientadas por dados.

#### B. Dashboard acionável e personalizável
**Já existe:** alunos ativos, receita mensal, check-ins, crescimento, evolução de receita, pagamentos recentes, check-ins recentes e pagamentos pendentes, atualmente com dados demonstrativos conforme documentado anteriormente.

**Precisa ser melhorado:**
- permitir escolha de período;
- exibir comparação com período anterior;
- exibir metas;
- explicar exatamente o significado de “crescimento”;
- mostrar tendência e causa provável;
- transformar cards em links para listagens já filtradas;
- permitir detalhamento de cada indicador;
- fazer pagamentos pendentes abrirem diretamente a cobrança ou a ficha do aluno;
- criar uma seção `Requer atenção`;
- permitir personalização por função: gestor, recepção, financeiro, professor e comercial.

A seção `Requer atenção` deve considerar:
- cobranças vencidas;
- recorrências com falha;
- inconsistências financeiras;
- alunos com baixa frequência;
- alunos com risco de evasão;
- matrículas próximas do fim;
- alunos sem plano;
- alunos sem treino;
- alunos sem avaliação;
- planos com baixa adesão;
- falhas ou bloqueios de acesso.

Dependências: consistência e fonte única dos dados, regras de cálculo auditáveis, módulos operacionais correspondentes e definição gradual de permissões por função.

#### C. Ficha 360º do aluno
A ficha 360º deve ser um dos principais diferenciais do Cfit.

**Já existe e deve ser preservado:**
- cabeçalho com identificação e status;
- Visão geral;
- Planos;
- Financeiro;
- Check-ins;
- Treinos;
- Histórico;
- dados pessoais;
- endereço;
- contato de emergência;
- matrículas vinculadas;
- cobranças;
- histórico de matrícula.

**Precisa ser melhorado:**
- reduzir repetição de dados entre o cabeçalho e a Visão geral;
- criar um cabeçalho compacto e realmente operacional;
- garantir que o status financeiro seja calculado com base nas cobranças;
- substituir textos vagos, como “Clique para gerenciar”, por ações explícitas;
- incluir ações contextuais no topo;
- integrar relacionamento, avaliações, frequência, treino e risco de evasão;
- transformar o histórico em uma linha do tempo completa;
- mostrar responsáveis e usuários envolvidos nas movimentações.

O resumo superior deve incluir:
- status do aluno;
- plano atual;
- próximo vencimento;
- situação financeira;
- último check-in;
- frequência nos últimos 30 dias;
- treino atual;
- próxima avaliação;
- responsável;
- indicador de risco de evasão.

Ações contextuais sugeridas:
- editar aluno;
- adicionar ou trocar plano;
- renovar matrícula;
- trancar ou cancelar matrícula;
- registrar pagamento;
- registrar check-in;
- criar contato;
- adicionar observação;
- atribuir treino;
- agendar avaliação.

A linha do tempo deve combinar:
- alterações cadastrais;
- matrícula;
- renovação;
- trancamento;
- cancelamento;
- cobranças;
- pagamentos;
- check-ins;
- treinos;
- avaliações;
- contatos;
- observações;
- automações;
- alterações realizadas por usuários.

Dependências: fonte única de dados, auditoria, responsáveis/usuários identificáveis e evolução gradual dos módulos ainda ausentes.

#### D. Gestão de alunos
**Já existe:** pesquisa, filtro por ativo e inativo, tabela, cadastro, edição, inativação e acesso ao detalhe.

**Precisa ser corrigido:**
- remover IDs técnicos da tabela e não expor identificadores internos sem necessidade;
- proteger ações como inativação;
- solicitar motivo ao inativar;
- registrar a inativação no histórico;
- evitar falso estado vazio durante carregamento.

**Precisa ser melhorado:**
- adicionar colunas configuráveis;
- melhorar filtros e segmentação;
- permitir salvar filtros;
- permitir compartilhamento de visões entre equipes;
- preencher endereço automaticamente a partir do CEP;
- melhorar validações e máscaras dos formulários.

Colunas configuráveis sugeridas:
- plano atual;
- vencimento;
- status financeiro;
- último check-in;
- frequência;
- responsável;
- situação do treino;
- última avaliação;
- risco de evasão;
- origem;
- unidade.

Filtros rápidos sugeridos:
- ativos;
- inativos;
- inadimplentes;
- sem plano;
- plano próximo do vencimento;
- sem check-in há determinado período;
- baixa frequência;
- sem treino;
- sem avaliação;
- aniversariantes;
- acesso bloqueado;
- aplicativo não instalado;
- com pendências cadastrais;
- risco de evasão;
- por responsável;
- por plano;
- por unidade.

#### E. Planos, contratos e matrículas
**Já existe:** listagem em cards, busca, filtro por ativo e inativo, alunos ativos, criação, edição, inativação, campos comerciais de cobrança, recorrência, fidelidade, renovação, modalidades, benefícios, regras de acesso e contrato. O fluxo de matrícula possui prévia das cobranças, preço contratado, desconto, aceite contratual e resumo de impacto.

**Precisa ser melhorado:**
- permitir comparação entre planos;
- mostrar receita gerada, adesão e tendência;
- verificar impacto antes de alterar um plano com alunos ativos.

Editor de plano recomendado em etapas:
1. Identidade e posicionamento.
2. Preço e forma de cobrança.
3. Duração, renovação e fidelidade.
4. Modalidades e regras de acesso.
5. Benefícios e serviços.
6. Contrato e regras.
7. Pré-visualização.
8. Resumo do impacto antes da publicação.

Cada card de plano pode mostrar:
- valor;
- mensalidade equivalente;
- duração;
- recorrência;
- alunos ativos;
- receita recorrente;
- tendência de adesão;
- status;
- disponibilidade para novas matrículas.

O fluxo de matrícula deve ser guiado e manter um resumo lateral com:
- aluno;
- plano;
- preço;
- desconto;
- recorrência;
- vencimento;
- vigência;
- benefícios;
- contrato;
- total previsto;
- cobranças que serão geradas.

Dependências: definição do modelo comercial, regras contratuais, impacto sobre cobranças, preservação de histórico e auditoria.

#### F. Financeiro
**Já existe:** indicadores, pesquisa, categorias operacionais, filtros por datas e competência, plano, pagamento, atraso e conciliação, tabela, paginação, agrupamento, pagamento individual e em lote, cancelamento com motivo, exportação, conciliação, previsão, fluxo de caixa, recorrências, central de inconsistências, auditoria e acesso à ficha do aluno.

**Precisa ser corrigido ou separado:**
- aplicar permissões por perfil.

**Precisa ser melhorado:**
- adicionar filtros por unidade e responsável quando esses domínios estiverem disponíveis;
- ampliar relatórios financeiros e análise de recuperação;
- aplicar permissões e auditoria aos novos perfis quando o RBAC for definido.

Organização sugerida:
- Visão geral;
- Cobranças;
- Recebimentos;
- Inadimplência;
- Recorrências;
- Inconsistências;
- Fluxo de caixa.

Criar futuramente uma fila inteligente de recuperação baseada em:
- dias de atraso;
- valor;
- histórico de pagamento;
- quantidade de parcelas;
- plano;
- frequência;
- probabilidade de recuperação;
- prioridade comercial.

Dependências: consistência financeira, competência e vencimento definidos, recorrências, permissões, auditoria e dados suficientes para modelos de prioridade.

#### G. Estados de carregamento, erro e vazio
**Precisa ser corrigido:** impedir que a interface mostre “nenhum registro” enquanto os dados ainda estão carregando.

Estados obrigatórios:
- carregando;
- carregado com dados;
- vazio sem registros;
- vazio devido aos filtros;
- erro de carregamento;
- sem permissão;
- módulo ainda não implementado;
- sessão expirada.

Diretrizes:
- usar skeletons estáveis;
- não mostrar estado vazio antes da conclusão da consulta;
- manter filtros e paginação durante atualizações;
- oferecer `Tentar novamente` em erros;
- explicar como sair de um estado vazio;
- não deixar rotas completamente brancas;
- áreas não implementadas devem exibir página de `Em desenvolvimento`, descrição e retorno seguro;
- em produção, ocultar módulos indisponíveis ou marcá-los claramente como `Em breve`.

#### H. Busca universal e ações rápidas
**Já existe:** busca global funcional na Topbar para alunos, planos e cobranças, com command palette e ações rápidas.

**Ainda não implementado:** transformar a busca em uma funcionalidade central capaz de localizar:
- alunos;
- planos;
- matrículas;
- cobranças;
- pagamentos;
- check-ins;
- treinos;
- avaliações;
- relatórios;
- configurações.

Criar também uma command palette para:
- novo aluno;
- adicionar plano;
- matricular aluno;
- registrar pagamento;
- registrar check-in;
- agendar avaliação;
- criar contato;
- abrir cobrança;
- acessar aluno;
- executar ações frequentes.

Dependências: rotas e módulos correspondentes, indexação/contrato de busca, permissões e ações operacionais estáveis.

### 48.1.6 Prioridade alta após as fundações

#### A. Check-ins e acessos
**Já existe:** aba de Check-ins na ficha do aluno, API privada, histórico e registro manual conforme a seção 38.

**Precisa ser melhorado:**
- histórico de check-ins;
- último acesso;
- frequência por período;
- origem da liberação;
- liberação manual ou automática;
- acesso por integração;
- motivo de bloqueio;
- equipamento utilizado;
- resposta do equipamento;
- unidade e local;
- ação de contingência;
- monitor de acesso em tempo real.

O sistema deve explicar bloqueios em linguagem operacional e indicar a próxima ação.

Integrações a considerar:
- catracas;
- leitores;
- reconhecimento facial;
- Wellhub;
- TotalPass.

Dependências: modelo multiunidade, política de acesso, integrações e observabilidade/auditoria de dispositivos.

#### B. Customer Health Score e risco de evasão
**Ainda não implementado:** criar um indicador explicável de saúde do aluno utilizando:
- frequência;
- tempo desde o último check-in;
- atrasos;
- recorrências com falha;
- plano próximo do fim;
- uso do aplicativo;
- treino ativo;
- avaliação;
- contatos;
- satisfação;
- histórico de trancamento;
- duração da matrícula.

O indicador deve mostrar os fatores que contribuíram para a classificação e nunca ser uma caixa-preta.

Dependências: consistência dos dados, frequência confiável, financeiro conectado, treinos, avaliações, relacionamento e histórico suficiente para validar as regras.

### 48.1.7 Prioridade média-alta

#### A. Treinos
**Módulo web implementado:** a rota possui gestão global de prescrições, modelos reutilizáveis e biblioteca de exercícios. A ficha do aluno permite criar e editar o treino, aplicar modelos, adicionar, editar e remover exercícios, registrar sessões e evolução, acompanhar aderência, definir revisão, concluir ciclos, preservar histórico e imprimir a ficha. O backend aplica a capacidade `workouts.manage` e respeita a unidade ativa nos novos registros e consultas.

Começar pela ficha do aluno:
- treino atual;
- professor responsável;
- objetivo;
- data da última atualização;
- aderência;
- exercícios;
- carga;
- séries e repetições;
- progressão;
- próxima revisão;
- histórico.

Capacidades entregues:
- gestão global de fichas;
- biblioteca de exercícios;
- modelos de treino;
- treinos predefinidos;
- acompanhamento de evolução;
- comparação entre períodos;
- impressão da ficha.

Limite atual: acesso por um aplicativo separado do aluno não está implementado porque o projeto possui somente o frontend web de gestão.

#### B. Agenda unificada
**Implementada em primeira etapa:** a rota reúne aulas, avaliações, tarefas, contatos e visitas, com criação, filtros por período e tipo, responsável, local e estados operacionais.

Evitar fragmentar atividades em agendas diferentes. Criar uma agenda unificada para:
- aulas;
- turmas;
- avaliações;
- contatos comerciais;
- visitas;
- tarefas;
- horários de professores;
- salas;
- recursos.

Funcionalidades esperadas:
- visualização diária, semanal e mensal;
- filtros por unidade, profissional e tipo;
- disponibilidade e conflitos;
- confirmação e lembretes;
- evolução visual dos estados agendado, em andamento, realizado e cancelado.

#### C. Relatórios orientados a perguntas
**Primeira etapa implementada:** a rota reúne respostas gerenciais de receita, alunos ativos, check-ins e risco de retenção usando as APIs existentes.

Evitar começar por um catálogo extenso e estático. Priorizar perguntas gerenciais:
- quais alunos estão em risco de evasão?
- quais planos geram mais receita?
- qual é a inadimplência por plano?
- qual é a taxa de renovação?
- quais horários têm maior ocupação?
- qual é a frequência média?
- qual é a conversão de visitas em matrículas?
- quais alunos possuem documentos ou avaliações vencidas?
- quais alunos são mais frequentes?
- qual é a permanência média?
- quais são os principais motivos de cancelamento?
- qual é a receita por plano, modalidade e unidade?

Os relatórios devem:
- permitir filtros e detalhamento;
- abrir as listas que originaram o indicador;
- aceitar favoritos e visões salvas;
- permitir exportação;
- manter coerência com os indicadores do Dashboard.

Dependências: fonte única de dados, regras de cálculo auditáveis e módulos operacionais correspondentes.

#### D. Configurações
**Primeira etapa implementada:** a rota oferece busca por categorias, organização dos domínios de configuração e identificação da academia atual. Edições específicas dependem da disponibilidade de cada domínio.

Organizar em:
- Academia e unidades;
- Usuários e permissões;
- Planos e contratos;
- Financeiro;
- Acessos e integrações;
- Comunicação;
- Motivos e classificações;
- Auditoria e segurança.

Diretrizes:
- oferecer busca;
- explicar impacto das alterações;
- separar parâmetros técnicos de regras do negócio;
- evitar uma página única muito extensa;
- permitir motivos configuráveis para cancelamento, trancamento, bloqueio e inativação;
- permitir tags, configuração de horários e módulos opcionais;
- registrar alterações em auditoria.

#### E. Ajuda contextual e onboarding
**Ainda não implementado:** criar onboarding diferente por função:
- gestor;
- recepção;
- financeiro;
- professor;
- comercial.

Adicionar:
- checklist inicial;
- ajuda contextual discreta;
- explicações relacionadas à tela atual;
- estados vazios educativos;
- progresso de configuração;
- atalhos para concluir configurações pendentes.

A ajuda não deve ocupar permanentemente espaço da operação.

#### F. Comparação entre unidades e performance
**Fundação implementada:** cadastro de unidades, isolamento das novas APIs por academia e seleção de contexto ativo. Comparações gerenciais entre unidades ainda não estão implementadas.

Para operações com múltiplas unidades:
- comparar métricas normalizadas;
- acompanhar metas;
- criar benchmarks internos;
- comparar frequência, inadimplência, conversão, receita por aluno e ocupação;
- identificar melhores práticas.

Dependências: arquitetura multiacademia/multiunidade, isolamento dos dados, métricas normalizadas e fonte única confiável.

### 48.1.8 Prioridade média

#### A. Automações orientadas por eventos
**Primeira etapa implementada:** regras configuráveis por evento, ativação, responsável opcional, disparo explícito, explicação e histórico de execução.

Considerar automações para:
- ausência prolongada;
- cobrança vencida;
- recorrência rejeitada;
- aniversário;
- fim de plano;
- renovação próxima;
- avaliação vencida;
- treino sem atualização;
- visita sem retorno;
- risco de evasão.

As automações devem possuir explicação, histórico, responsável, estado, possibilidade de desativação, auditoria e controle de permissões.

Dependências: eventos confiáveis, módulos de origem implementados, permissões e auditoria.

#### B. Dashboard por função
Criar visões específicas:
- gestor: metas, receita, crescimento, retenção e riscos;
- recepção: check-ins, bloqueios, pendências e agenda;
- financeiro: cobranças, atrasos, recorrências e fluxo;
- professor: alunos, treinos, avaliações e agenda;
- comercial: visitas, contatos, conversão e follow-ups.

Dependências: definição de perfis e permissões, módulos correspondentes e Dashboard conectado a dados reais.

#### C. Auditoria explicável
Registrar:
- quem realizou a ação;
- o que foi alterado;
- quando;
- valor anterior;
- valor posterior;
- motivo;
- origem;
- entidade afetada.

A auditoria deve cobrir especialmente:
- cadastro;
- matrícula;
- plano;
- cobrança;
- pagamento;
- cancelamento;
- inativação;
- acesso;
- configurações;
- permissões.

### 48.1.9 Prioridade baixa e itens que não devem ser priorizados
Evitar ou deixar para depois:
- índice alfabético A–Z como principal mecanismo de busca;
- catálogo enorme de relatórios estáticos;
- reprodução extensa de atalhos tradicionais por teclas de função;
- personalizações periféricas antes de consolidar os fluxos centrais;
- muitos ícones sem rótulos;
- menus excessivamente densos;
- configurações extensas em página única;
- fragmentação de tarefas relacionadas;
- IDs técnicos visíveis;
- textos vagos como única indicação de ação;
- páginas brancas;
- ajuda ocupando espaço excessivo;
- cópia de telas, textos ou identidade visual de concorrentes.

### 48.1.10 Ordem recomendada de execução
Esta sequência orienta o roadmap, mas permanece sujeita à validação técnica e de negócio e não autoriza execução automática:
1. Corrigir consistência e fonte única dos dados.
2. Corrigir estados de carregamento, erro, vazio e páginas não implementadas.
3. Consolidar a ficha 360º e a linha do tempo do aluno.
4. Evoluir filtros, segmentos e listagem de alunos.
5. Completar o modelo comercial de planos, contratos e matrículas.
6. Separar operação financeira, inadimplência, recorrência, inconsistências e projeção.
7. Tornar o Dashboard acionável, conectado e personalizável.
8. Implementar busca universal e command palette.
9. Implementar check-ins e monitor de acessos.
10. Criar Customer Health Score e risco de evasão.
11. Implementar Treinos inicialmente dentro da ficha do aluno.
12. Construir a Agenda unificada.
13. Desenvolver Relatórios orientados a perguntas.
14. Desenvolver Configurações pesquisáveis e organizadas.
15. Adicionar automações, comparação entre unidades e dashboards por função.

### 48.1.11 Critérios para futuras implementações
Ao desenvolver qualquer item do roadmap:
1. Inspecione a implementação existente antes de propor mudanças.
2. Preserve a identidade visual do Cfit.
3. Reutilize componentes e padrões já consolidados.
4. Verifique responsividade, acessibilidade e estados de interação.
5. Não implemente dados demonstrativos como se fossem reais.
6. Inclua carregamento, vazio, erro e sem permissão.
7. Avalie permissões e auditoria.
8. Mantenha consistência entre módulos.
9. Prefira ações explícitas e linguagem clara.
10. Valide visualmente o resultado.
11. Teste o fluxo principal e casos de borda.
12. Não implemente todo o roadmap em uma única alteração.
13. Transforme cada prioridade em tarefas menores, verificáveis e com critérios de aceite.

### 48.2 Histórico confirmado em 21/08/2026 — Dashboard, busca, acessos e Treinos

> **Estado: retrato histórico, não roadmap ativo.** As entregas abaixo permanecem registradas para rastreabilidade. Estados e prioridades atuais estão consolidados na seção 48.3.

Entregas consolidadas nesta etapa:
- Dashboard conectado com período mensal, comparação, causas da variação, metas de receita, check-ins e alunos ativos;
- indicadores acionáveis e seção `Requer atenção` baseada em dados reais;
- personalização visual do Dashboard para gestor, recepção, financeiro, professor e comercial, sem representar permissões RBAC;
- busca universal e command palette por `Ctrl/Cmd + K` para alunos, planos, cobranças e ações rápidas;
- monitor global de acessos em `/checkins`, com período, origem, resultado liberado/bloqueado, motivo e equipamento;
- Customer Health Score inicial e explicável baseado em plano ativo, inadimplência e frequência;
- Sidebar organizada por áreas, sem menus sanfonados; logout transferido para o menu de perfil da Topbar;
- favicon regenerado em tamanhos proporcionais a partir de matriz quadrada transparente;
- app `apps/workouts` possui exercícios, modelos com itens, planos, exercícios prescritos, sessões e registros de evolução;
- aba Treinos da ficha do aluno funcional para criar, editar, aplicar modelos, gerenciar exercícios, registrar execução/evolução, acompanhar aderência, concluir ciclos e imprimir;
- rota `/workouts` funcional com gestão global das prescrições, modelos reutilizáveis e biblioteca pesquisável de exercícios, sem selo `Em breve`.
- app `apps/schedule`, API privada e rota `/schedule` implementados para aulas, avaliações, tarefas, contatos e visitas, com período, tipo, responsável, local e estados operacionais.
- RBAC incremental implementado com contexto da sessão, capacidades por perfil e proteção server-side das operações financeiras;
- gestão de usuários e permissões integrada às Configurações, com compatibilidade temporária para contas administrativas legadas;
- auditoria administrativa consultável registra alterações de perfil e ativação com estado anterior, posterior, ator e motivo.
- app `apps.automations`, APIs e rota `/automations` implementados para regras orientadas por eventos e histórico de execução;
- modelo de unidades, API isolada por academia e rota `/units` implementados, incluindo seleção da unidade ativa da sessão.

Validações confirmadas:
- 71 testes passaram para Treinos, alunos, check-ins, financeiro e planos;
- após a conclusão do módulo web de Treinos, 50 testes integrados passaram para Treinos, usuários/RBAC, financeiro, automações e agenda;
- `python manage.py check` passou;
- `makemigrations --check --dry-run` não encontrou alterações pendentes;
- build de produção do frontend passou;
- lint direcionado dos componentes novos passou;
- `git diff --check` passou.

Ponto exato de retomada do lote solicitado de 10 itens:
1. itens 1–3 concluídos em uma fundação integrada de Treinos;
2. item 4 concluído em primeira etapa funcional de Agenda unificada;
3. item 5 concluído em primeira etapa de Relatórios orientados a perguntas gerenciais;
4. item 6 concluído em primeira etapa de Configurações organizadas e pesquisáveis;
5. item 7 concluído com RBAC incremental por perfil e proteção financeira server-side;
6. item 8 concluído com auditoria administrativa de alterações de acesso;
7. item 9 concluído com regras de automação, execução explícita e histórico auditável;
8. item 10 concluído com fundação multiunidade, isolamento das novas APIs e contexto ativo;
9. lote solicitado de itens 1–10 concluído em primeiras etapas funcionais e incrementais;
10. próxima evolução deve aprofundar uma dessas fundações em tarefas pequenas, sem tratar a base multiunidade como particionamento completo dos módulos históricos.

---

## 48.3 Auditoria atual e roadmap oficial priorizado — 24/08/2026

### 48.3.1 Natureza, alcance e regra de uso

Esta seção consolida a auditoria de produto mais recente e substitui a ordem de execução dos roadmaps históricos das seções 48.1 e 48.2.

O roadmap é orientação de prioridade, não autorização para implementar todos os itens de uma vez. Cada tarefa futura deve ter escopo próprio, inspeção do código atual, entrega pequena, critérios de aceite verificáveis e testes proporcionais ao risco.

Classificações usadas:
- **Implementado:** fluxo relevante já entregue; preservar e validar antes de alterar.
- **Parcial:** há base funcional, mas faltam consistência, profundidade ou integração.
- **Precisa de correção:** existe comportamento contraditório ou inadequado que antecede novas expansões.
- **Não iniciado:** capacidade ainda não confirmada como funcional.
- **Baixa prioridade:** não executar antes da consolidação dos fluxos centrais.
- **Superado:** abordagem anterior substituída por solução ou prioridade mais nova.

O principal risco atual não é falta de amplitude. É a existência de inconsistências entre módulos, exposição excessivamente técnica em áreas administrativas e crescimento da navegação antes da consolidação dos fluxos.

### 48.3.2 Posicionamento e princípios preservados

O Cfit mantém identidade própria baseada em tecnologia, performance, gestão premium, clareza operacional, decisões orientadas por dados, experiência moderna e profundidade funcional sem complexidade desnecessária.

Não copiar telas, identidade visual, textos, layouts proprietários ou implementações de concorrentes. A meta é superar sistemas tradicionais por meio de uma experiência integrada, proativa, confiável e orientada à próxima ação.

Princípios obrigatórios:
1. Orientar decisões, não apenas exibir registros.
2. Mostrar o que requer atenção e qual é a próxima ação.
3. Dashboard, alunos, ficha, financeiro, relatórios e automações devem compartilhar fontes e regras.
4. Nenhuma métrica demonstrativa pode parecer real.
5. Toda métrica deve explicitar período, contexto e regra de cálculo.
6. A ficha 360º é o centro da jornada do aluno.
7. Ações sensíveis exigem permissão, confirmação, motivo e auditoria.
8. Interfaces administrativas devem traduzir dados técnicos para linguagem operacional.
9. Crescimento funcional não pode tornar a navegação tão complexa quanto sistemas legados.
10. Módulos novos não devem ser priorizados antes das inconsistências críticas.

Decisões positivas que devem ser preservadas:
1. Identidade visual moderna e premium.
2. Dashboard orientado a ações.
3. Uso de dados operacionais reais.
4. Explicação da variação da receita.
5. Seção `Requer atenção`.
6. Links do Dashboard para listagens filtradas.
7. Visões por perfil.
8. Busca universal com `Ctrl/Cmd + K`.
9. Segmentos rápidos de alunos.
10. Ficha 360º com resumo operacional.
11. Financeiro com previsão, fluxo, recorrência e inconsistências.
12. Relatórios orientados a perguntas.
13. Agenda unificada em vez de agendas fragmentadas.
14. Automações transparentes com fila operacional.
15. Unidades com contexto operacional.
16. Auditoria de ações.
17. Separação da Sidebar por domínios.

### 48.3.3 Estado atual por área

| Área | Estado auditado | Direção |
|---|---|---|
| Dashboard | Implementado em estágio avançado | Preservar; corrigir períodos, escopos e consistência |
| Busca universal e command palette | Implementado | Preservar e ampliar apenas após estabilizar destinos |
| Gestão de alunos | Implementado em estágio avançado | Evoluir filtros, colunas, privacidade e Health Score |
| Ficha 360º | Avançada, com inconsistências | Corrigir plano, vencimento, financeiro e Health Score |
| Planos | Intermediário | Corrigir modelo comercial antes de ampliar |
| Financeiro | Avançado | Integrar inconsistências, permissões e escopos |
| Check-ins e acessos | Intermediário-avançado | Refinar operação e dispositivos; integrações externas depois |
| Relatórios | Implementado | Evoluir detalhamento preservando fonte única |
| Agenda | Estrutura funcional inicial | Completar após P0 e P1 |
| Treinos | Estrutura inicial/funcional incremental | Evoluir na ordem definida em P2 |
| Configurações | Implementado, excessivamente concentrado | Reorganizar por domínio |
| Usuários e permissões | Implementado de forma incremental | Consolidar por perfil e unidade |
| Unidades | Implementado | Evoluir comparação e isolamento completo |
| Automações | Implementado | Completar operação, SLA e idempotência |
| Comercial e turmas | Estrutura funcional | Integrar com agenda e automações |
| Documentos e portal | Estrutura funcional | Completar segurança, versões e vínculos |
| Central operacional | Parcial | Consolidar operação diária sem duplicar módulos |
| Auditoria | Implementada, excessivamente técnica | Tornar explicável e amigável |
| Health Score | Parcial e inconsistente | P0: unificar fonte e cálculo |
| Onboarding | Implementado, checklist com cálculo incorreto | P0: derivar progresso do estado real |

### 48.3.4 Prioridade crítica — P0

Os itens P0 antecedem ampliações significativas do produto.

#### P0.1 Unificar o Health Score — implementado e validado por integração; inspeção visual humana pendente

Problema confirmado: Relatórios calculam score e fatores, enquanto a ficha do mesmo aluno pode mostrar `Risco de evasão: ainda não calculado`.

Criar uma única fonte usada por Dashboard, gestão de alunos, ficha 360º, relatórios, automações e fila de retenção. Considerar, quando disponíveis: matrícula ativa, frequência, tempo desde o último check-in, situação financeira, vencidos, plano próximo do fim, treino, avaliação, contatos, trancamentos e permanência.

Critérios de aceite:
- mesmo aluno possui o mesmo score e fatores em todas as superfícies;
- ausência de dados é diferente de estado saudável;
- fatores são explicáveis e abrem as respectivas origens;
- cálculo possui testes automatizados;
- mudanças relevantes invalidam ou recalculam corretamente.

Dependências: regras únicas de matrícula e situação financeira. É o primeiro item da ordem recomendada, mas pode exigir concluir P0.2 e P0.3 na mesma fundação de domínio, sem expandir escopo automaticamente.

#### P0.2 Corrigir plano atual versus próximo vencimento — implementado

Distinguir matrícula ativa, trancada, cancelada ou encerrada; plano futuro; cobrança residual; cobrança futura de matrícula inativa; e inconsistência cadastral.

Critérios de aceite:
- `Plano atual` representa somente matrícula realmente ativa;
- próximo vencimento explica a origem da cobrança;
- cobranças de matrículas inativas recebem rótulo correto;
- contradições alimentam a central de inconsistências;
- ficha não mostra informações aparentemente incompatíveis sem explicação.

Dependências: modelos e estados de matrícula, cobrança e vigência. Antecede Health Score final, situação financeira e modelo comercial de planos.

#### P0.3 Padronizar situação financeira — implementado e validado por integração; inspeção visual humana pendente

`Financeiro regular` não pode significar somente ausência de cobrança vencida. Definir uma regra única considerando matrícula, vencidos, cobranças futuras, recorrências com falha, inconsistências, conciliação, pagamentos incompletos, saldo e tolerância da unidade.

Estados operacionais mínimos: `regular`, `atenção`, `pendente`, `inadimplente`, `inconsistência` e `sem vínculo financeiro`.

Critérios de aceite:
- ficha, tabela de alunos e relatórios exibem o mesmo estado;
- usuário visualiza a causa e abre os registros de origem;
- nomenclatura e regra são documentadas;
- regra possui testes automatizados.

Dependências: P0.2, cobranças, recorrências, conciliação e tolerância por unidade.

#### P0.4 Corrigir o checklist do onboarding — corrigido

A tela inicial de boas-vindas e configuração da academia está implementada. O checklist da Central operacional continua independente e pode exibir `0 de 5 concluídos` mesmo com dados reais existentes.

Condições atuais: completar dados da academia, cadastrar unidade, convidar equipe, criar primeiro plano e revisar Dashboard.

Critérios de aceite:
- cada item é derivado automaticamente da condição real no banco;
- progresso persiste sem duplicar uma fonte manual de verdade;
- item pendente abre diretamente seu destino;
- não há divergência entre dados e checklist;
- checklist e ações respeitam perfil e unidade.

Dependências: rotas estáveis de Academia, Unidades, Usuários, Planos e Dashboard.

#### P0.5 Padronizar períodos e escopos — avançado, com distinção explícita entre histórico e estado atual

Todo indicador deve informar se representa mês atual, período selecionado, últimos 30 dias, acumulado, previsto, recebido, competência, caixa, unidade ou rede consolidada.

Relatórios tratam receita, base ativa e check-ins conforme o período selecionado. Health Score e fila de retenção representam o estado operacional atual e devem permanecer explicitamente identificados dessa forma, inclusive nas exportações, sem aparentar reconstrução histórica.

Critérios de aceite:
- nenhum valor financeiro aparece sem período e escopo;
- Dashboard, Financeiro e Unidades usam nomenclatura consistente;
- indicador permite abrir os registros que o compõem;
- soma dos detalhes corresponde ao valor exibido;
- testes cobrem limites de datas e unidades.

Dependências: seletores compartilhados, contexto de unidade e conceitos financeiros definidos.

#### P0.6 Revisar o modelo comercial dos planos — implementado

Separar nome, descrição, valor total, mensalidade equivalente, periodicidade, quantidade de parcelas, recorrência, duração, renovação, fidelidade e taxa de matrícula. Descrição livre como `Cobrança Anual` não pode contradizer `Cobrança: Mensal`.

Critérios de aceite:
- descrição não substitui campos estruturados;
- periodicidade e parcelas não se contradizem;
- resumo é compreensível sem abrir edição;
- alterações com alunos ativos mostram impacto;
- regras são validadas no backend e testadas.

Dependências: P0.2, geração de cobranças, contratos e preservação de histórico.

#### P0.7 Tornar a auditoria amigável — implementada com catálogo operacional traduzido; validação visual pendente

Substituir JSON bruto como apresentação principal por diferenças estruturadas: campo, anterior, posterior, usuário, data, motivo e entidade. Traduzir eventos como `academy.onboarding_completed`, `membership.updated`, `charge.payment_registered` e `charge.reconciled`. Manter detalhes técnicos em expansão restrita.

Critérios de aceite:
- gestor entende a alteração sem ler JSON;
- detalhes internos ficam ocultos por padrão;
- filtros por usuário, evento, entidade e período;
- paginação;
- dados pessoais mascarados conforme permissão;
- detalhe técnico disponível somente a autorizados.

Dependências: catálogo de eventos, permissões e política de mascaramento.

#### P0.8 Melhorar privacidade e apresentação das sessões — implementada

Apresentar inicialmente navegador, sistema operacional, última atividade, sessão atual e dispositivo conhecido/desconhecido. IP e user-agent bruto ficam em detalhe controlado.

Critérios de aceite:
- sessão atual identificada;
- informações técnicas não dominam a interface;
- encerramento exige confirmação;
- sessão encerrada gera auditoria;
- dados sensíveis respeitam permissões.

Dependências: identificação confiável da sessão atual, auditoria e política de privacidade.

### 48.3.5 Prioridade alta — P1

#### P1.9 Consolidar permissões por perfil e unidade — avançado, matriz automatizada e homologação interativa concluída

Perfis: Proprietário, Administrador, Gerente, Recepção, Professor e Financeiro. Consolidar capacidades, unidade operacional, escopo de visualização, estado do vínculo, motivo e auditoria.

Validar pagamentos, cancelamentos, conciliação, exportação, inativação de alunos, edição de planos, políticas de acesso, automações, usuários, auditoria e transferência de propriedade.

Critérios de aceite:
- backend é a fonte de autorização;
- Sidebar e ações ocultam o que o perfil não pode usar;
- acesso direto à rota ou API continua protegido;
- unidade limita dados e ações corretamente;
- ações sensíveis exigem motivo/confirmação e são auditadas;
- testes cobrem cada perfil relevante.

Dependências: P0.7, P0.8 e matriz de capacidades aprovada.

#### P1.10 Reorganizar Configurações — avançado, validação visual pendente

Separar Academia, Unidades, Usuários e permissões, Planos e contratos, Financeiro, Acessos, Automações, Auditoria e Segurança em rotas ou abas coerentes.

Critérios de aceite:
- busca funcional;
- impacto das alterações explicado;
- salvamento independente por seção;
- paginação, filtros e estados vazios onde aplicável;
- navegação não duplica módulos operacionais;
- permissões por seção.

Dependências: P1.9 e revisão de navegação P1.16.

#### P1.11 Refinar Check-ins e dispositivos — avançado, homologação física externa pendente

Preservar monitor ao vivo, políticas, filtros, origem, bloqueio, contingência, dispositivos, diagnóstico e simulação. Separar política de acesso da consulta operacional; mostrar motivo, dispositivo, unidade, latência, resposta e saúde; permitir abrir aluno e cobrança; auditar contingência; diferenciar offline, nunca conectado e falha.

Critérios de aceite:
- evento explica decisão e próxima ação;
- detalhes técnicos ficam em diagnóstico;
- estados de dispositivo são confiáveis;
- links levam ao aluno/cobrança correta;
- contingência é autorizada, confirmada e auditada;
- preparação para Wellhub e TotalPass não é apresentada como integração pronta.

Dependências: P0.3, P1.9, contexto por unidade e observabilidade. Integrações físicas Topdata/Control iD e agregadores permanecem externas até homologação específica.

#### P1.12 Integrar inconsistências financeiras às cobranças — implementado

Critérios de aceite:
- inconsistência abre a cobrança afetada;
- possui responsável, prazo/SLA, situação, resolução e histórico;
- aceita comentários internos com permissão;
- mantém vínculo com pagamento e conciliação;
- mudanças são auditadas.

Dependências: P0.3, P0.5, P1.9 e auditoria amigável.

#### P1.13 Padronizar carregamento, erro e vazio — implementado nas superfícies prioritárias

Estados obrigatórios: skeleton/carregando, carregado, vazio real, vazio por filtro, erro, sem permissão e módulo indisponível. Nunca mostrar vazio antes de concluir consulta.

Critérios de aceite:
- componentes compartilhados possuem contrato consistente;
- filtros e paginação permanecem durante atualização;
- erro oferece nova tentativa;
- vazio explica próxima ação;
- sem permissão e indisponibilidade não parecem erro genérico.

Dependências: nenhuma de negócio; aplicar incrementalmente, começando pelas superfícies P0/P1 alteradas.

#### P1.14 Evoluir gestão de alunos — avançada, filtros e colunas ampliados e conectados ao backend

Adicionar colunas configuráveis; filtros salvos e compartilhados; plano próximo do fim; sem treino; sem avaliação; aniversariantes; acesso bloqueado; pendências; Health Score; responsável; unidade; paginação ou virtualização.

Os segmentos rápidos `plan_ending`, `without_workout`, `without_assessment`, `birthdays`, `access_blocked` e `incomplete_profile` são aceitos pela API e usam os selectors existentes. Ao adicionar um segmento no frontend, atualizar também a lista permitida do `StudentViewSet`; não deixar a API descartar silenciosamente um filtro visível.

Revisar mascaramento de CPF/telefone, tooltips, confirmação/motivo de inativação e permissões por ação.

Critérios de aceite:
- filtros e colunas persistem conforme escopo definido;
- listagem mantém desempenho com volume realista;
- Health Score e financeiro coincidem com ficha/relatórios;
- dados pessoais respeitam permissão;
- ações sensíveis são auditadas.

Dependências: P0.1 a P0.3, P1.9 e P1.13.

#### P1.15 Tornar metas operacionais — avançado, metas auditadas

Implementar valor, progresso, percentual, ritmo esperado, desvio, projeção, histórico, unidade, período e permissão de edição.

Critérios de aceite:
- cálculo e período explícitos;
- progresso abre detalhes;
- metas por unidade não contaminam consolidado;
- histórico preservado;
- edição autorizada e auditada.

Dependências: P0.5 e P1.9.

#### P1.16 Revisar a navegação — implementada com grupos e favoritos

Grupos recolhíveis, módulos conforme perfil e favoritos foram implementados. A seção de recentes foi testada e depois removida por decisão de produto para reduzir ruído. Ainda avaliar indicadores de pendência e a sobreposição entre Central operacional, Check-ins, Documentos e Automações.

Critérios de aceite:
- usuário não vê módulos sem acesso;
- rotas relacionadas possuem agrupamento previsível;
- mobile continua funcional;
- não criar novo item principal quando uma área existente comporta o fluxo;
- Central operacional não duplica telas especializadas.

Dependências: P1.9 e mapa de informação aprovado.

### 48.3.6 Prioridade média-alta — P2

#### P2.17 Completar Agenda unificada — avançada, recorrência e conflitos de toda a série implementados

Preservar novo evento, dia/semana/mês, período, aulas, avaliações, tarefas, contatos e visitas. Completar grade visual, recorrência, profissionais, salas, unidades, disponibilidade, conflitos, confirmação, lembretes, estados e vínculos com aluno, Comercial e Avaliações.

Na criação recorrente, a API valida cada ocorrência futura contra a agenda do profissional e a ocupação da sala/local antes do `bulk_create`. Nenhuma série pode ser criada parcialmente nem introduzir conflito fora da primeira ocorrência.

Critérios de aceite:
- conflitos e disponibilidade são confiáveis;
- recorrência preserva exceções;
- filtros por unidade/profissional/tipo;
- lembretes não duplicam;
- horários e fusos são definidos por unidade.

Dependências: unidades, permissões, Comercial, avaliações e automações.

#### P2.18 Desenvolver Treinos — funcional e consolidado no frontend web

Ordem obrigatória: biblioteca de exercícios; modelos; prescrição na ficha; treino atual; professor; execução; cargas/séries/repetições; progressão; histórico; revisão; aplicativo do aluno.

Critérios de aceite:
- cada etapa reutiliza a anterior;
- prescrição e execução preservam histórico;
- permissões de professor e unidade;
- ficha e área global mostram o mesmo treino atual;
- aplicativo do aluno permanece separado e não é apresentado como concluído antes de existir.

Dependências: alunos, ficha 360º, P1.9 e portal para a última etapa.

#### P2.19 Evoluir Relatórios — avançado, fórmulas e indicadores ampliados

Adicionar detalhamento, fórmula, fonte, comparação, favoritos, visões salvas, novas exportações, receita por unidade, renovação, permanência, ocupação e motivos de cancelamento.

Corrigir consistência do Health Score, diferença entre `em risco` e `Requer atenção`, e integrar `Registrar contato` com Comercial e Automações.

Critérios de aceite:
- todo indicador explica fórmula, fonte, período e escopo;
- detalhe reconcilia com o total;
- filtros respeitam unidade e permissão;
- ações geram registros nos módulos de destino;
- exportação reflete filtros ativos.

Dependências: P0.1, P0.3, P0.5, P1.9, Comercial e Automações.

#### P2.20 Completar Automações — implementado com SLA, modos e idempotência

Adicionar responsável, SLA, prazo, histórico por regra, pausa, última execução, sucesso/falha, tentativas, deduplicação, idempotência, permissões e auditoria amigável. Separar teste, simulação e execução real.

Critérios de aceite:
- execução real nunca é confundida com teste;
- eventos duplicados não repetem efeitos;
- falhas possuem tentativa e diagnóstico;
- responsável e SLA são operacionais;
- ações e alterações são auditadas.

Dependências: fontes de eventos confiáveis, P0.1/P0.3, P0.7 e P1.9.

#### P2.21 Evoluir planos e matrículas — intermediário

Após P0.6, evoluir modalidades, benefícios, serviços, acesso, contratos, promoção, carência, multa, congelamento, disponibilidade por unidade, receita, adesão, comparação, prévia e impacto.

O resumo lateral da matrícula deve manter aluno, plano, preço, desconto, parcelas, recorrência, vencimento, vigência, contrato e cobranças geradas.

Critérios de aceite:
- prévia coincide com cobranças criadas;
- alterações preservam histórico;
- regras comerciais não se contradizem;
- impacto em alunos ativos é explícito;
- disponibilidade e preço respeitam unidade.

Dependências: P0.2, P0.6, P1.9 e contratos/documentos.

#### P2.22 Comparação entre unidades — fundação implementada

Adicionar seletor claro, período, consolidado, comparação, metas, receita por aluno, frequência, inadimplência, conversão, ocupação, dispositivos e permissões por unidade.

Critérios de aceite:
- métricas normalizadas e reconciliáveis;
- consolidado não duplica registros;
- período e unidade sempre visíveis;
- usuário acessa somente unidades autorizadas;
- detalhe explica diferenças.

Dependências: P0.5, P1.9, P1.15 e particionamento confiável dos domínios.

#### P2.23 Integrar Comercial e Turmas — estrutura funcional

Manter a área `Crescimento`, com abas Comercial e Turmas. Comercial integra leads, visitas, contatos, propostas, conversão, agenda e automações. Turmas integra professores, salas, capacidade, lotação, presença, agenda e alunos.

Critérios de aceite:
- conversão preserva origem do lead;
- agenda e automações compartilham eventos;
- capacidade e presença são confiáveis;
- vínculos abrem aluno, turma ou responsável;
- permissões e unidades respeitadas.

Dependências: P2.17, P2.20 e P1.9.

#### P2.24 Completar Documentos e Portal — estrutura funcional

Adicionar validade, vencimento, assinatura, aceite, status, versão, modelo, obrigatoriedade, alertas, permissões, histórico, armazenamento seguro e vínculos com matrícula e acesso.

Critérios de aceite:
- versões e aceite são imutáveis/auditáveis;
- acesso ao arquivo é autorizado;
- vencimentos geram alertas sem duplicidade;
- documento obrigatório pode explicar bloqueio;
- portal mostra somente documentos do aluno autenticado.

Dependências: P1.9, auditoria, armazenamento seguro, matrículas e políticas de acesso.

### 48.3.7 Prioridade média — P3

#### P3.25 Personalização do Dashboard — avançada, preferências individuais implementadas

Permitir reordenar seções, ocultar cards, salvar preferências, configurar por perfil/unidade e selecionar indicadores favoritos.

Critérios de aceite: preferências persistem sem alterar dados; padrão recuperável; cards respeitam permissão; comportamento responsivo preservado.

Implementação atual: o usuário pode ocultar e restaurar as seções Metas, Atenção e Análise. A preferência é local, individualizada pelo e-mail da sessão na chave `cfit_dashboard_hidden_sections:<email>`, não altera dados nem capacidades e mantém o Pulso como abertura obrigatória. Reordenação e configuração administrativa por perfil/unidade continuam futuras.

Dependências: P0.5, P1.9 e P1.15.

#### P3.26 Relatórios salvos e favoritos — implementado no escopo pessoal local

Permitir salvar filtros, nomear, compartilhar, favoritar, exportar e definir visão padrão.

Critérios de aceite: escopo de compartilhamento explícito; visão reproduz filtros; permissões aplicadas; exclusão confirmada.

Implementação atual: favoritos usam `cfit_report_favorites`; visões nomeadas usam `cfit_report_saved_views` e reproduzem período e indicadores favoritos. Uma visão pode ser definida como padrão, é restaurada na entrada do módulo e sua exclusão exige confirmação. O escopo aparece explicitamente como pessoal neste navegador; compartilhamento entre usuários e persistência server-side continuam futuros.

Dependências: P2.19 e P1.9.

#### P3.27 Navegação personalizada — parcial

Favoritos individuais e módulos conforme perfil estão implementados. `Recentes` deixou de ser requisito e não deve ser reintroduzido sem nova solicitação. Módulos mais usados, redefinição de preferências e atalhos adicionais continuam pendentes.

Critérios de aceite: preferências individuais; sem revelar rotas proibidas; opção de redefinir; mobile preservado.

Dependências: P1.16 e P1.9.

#### P3.28 Portal do aluno — avançado na experiência web

Evoluir documentos, contratos, cobranças, check-ins, treinos, avaliações, agenda, dados pessoais e notificações.

Critérios de aceite: isolamento absoluto por aluno; ações próprias autorizadas; estados claros; dados sensíveis protegidos; integrações usam as mesmas fontes administrativas.

Implementação atual: o portal isolado apresenta planos, turmas e reservas, treino atual, cobranças, check-ins, avaliações e documentos. Possui atualização dos próprios dados permitidos, aceite documental, estados vazios por domínio, skeleton acessível, erro com nova tentativa e bloqueio visual durante operações. Notificações reais e aplicativo dedicado continuam futuros.

Dependências: P2.17, P2.18, P2.24, financeiro e notificações futuras.

### 48.3.8 Prioridade baixa — P4

Não priorizar antes da consolidação:
- personalizações apenas cosméticas;
- grandes catálogos de relatórios estáticos;
- novos módulos sem integração;
- atalhos tradicionais excessivos;
- configurações periféricas;
- recursos que aumentem a Sidebar sem necessidade;
- dashboards adicionais sem dados consistentes.

Esses itens não estão proibidos, mas exigem justificativa de negócio e não podem deslocar P0/P1.

### 48.3.9 Ordem recomendada e dependências macro

Ordem oficial:
1. Unificar Health Score.
2. Corrigir plano, matrícula, cobrança e próximo vencimento.
3. Padronizar situação financeira.
4. Corrigir checklist do onboarding.
5. Padronizar períodos e escopos.
6. Corrigir modelo comercial de planos.
7. Melhorar auditoria e privacidade de sessões.
8. Consolidar permissões.
9. Reorganizar Configurações.
10. Refinar Check-ins e dispositivos.
11. Integrar inconsistências financeiras às cobranças.
12. Padronizar skeletons e estados de erro/vazio.
13. Evoluir filtros e visualização de Alunos.
14. Tornar metas operacionais.
15. Revisar navegação.
16. Completar Agenda.
17. Desenvolver Treinos.
18. Evoluir Relatórios.
19. Completar Automações.
20. Evoluir Planos e Matrículas.
21. Comparar unidades.
22. Integrar Comercial e Turmas.
23. Completar Documentos e Portal.
24. Adicionar personalizações e refinamentos posteriores.

Dependências macro:
```text
P0.2 Plano/matrícula/cobrança
        ↓
P0.3 Situação financeira ──────┐
        ↓                      │
P0.1 Health Score             │
        ↓                      │
Alunos / Relatórios /         │
Automações / Retenção         │
                               │
P0.5 Períodos e escopos ──────┼→ Metas / Unidades / Relatórios
                               │
P0.7 Auditoria + P0.8 Sessões ─┴→ P1.9 Permissões
                                      ↓
Configurações / Navegação / operações sensíveis
```

Não iniciar um dependente como se a fundação estivesse concluída. Quando for possível avançar parcialmente, registrar explicitamente a limitação.

### 48.3.10 Critérios gerais para futuras tarefas

Toda implementação futura deve:
1. Ler o `AGENTS.md` antes de agir.
2. Identificar prioridade e dependências.
3. Reutilizar componentes e padrões existentes.
4. Usar dados reais ou marcar claramente dados demonstrativos.
5. Possuir loading, vazio, erro e sem permissão.
6. Considerar permissões e unidades.
7. Auditar ações sensíveis.
8. Validar consistência com outros módulos.
9. Incluir testes proporcionais ao risco.
10. Verificar visualmente o resultado.
11. Preservar acessibilidade e responsividade.
12. Implementar uma entrega pequena e verificável por vez.
13. Não expandir automaticamente o escopo para todo o roadmap.

### 48.3.11 Conflitos e decisões de consolidação

- O roadmap anterior dizia que Health Score ainda não existia; a solução inicial foi implementada depois, mas está **parcial e inconsistente**, portanto o estado atual substitui `não implementado`.
- Busca universal e command palette deixaram de ser item futuro e estão **implementadas**; expansões permanecem posteriores à consolidação dos destinos.
- Dashboard acionável, períodos, visões por perfil, metas e `Requer atenção` avançaram; o foco atual é **consistência**, não reconstrução.
- Treinos, Agenda, Relatórios, Configurações, Automações e Unidades deixaram de ser espaços reservados. Possuem bases funcionais em diferentes níveis e devem ser aprofundados, não recriados.
- Onboarding visual e cadastro inicial estão **implementados**; o P0 trata especificamente do checklist operacional calculado incorretamente.
- Monitor de acesso, políticas e dispositivos avançaram; integrações externas e homologação física não devem ser apresentadas como concluídas.
- A orientação antiga de escolher automaticamente o próximo módulo foi superada: primeiro resolver P0, respeitando solicitação explícita e entrega incremental.

---

## 48.4 Estado confirmado de encerramento — 24/08/2026

Esta seção registra o estado mais recente confirmado no código após o commit `458111b` (`feat: consolida roadmap operacional e nova dashboard`). Em conflitos de estado com as seções 47, 48 ou 48.2, prevalece esta seção. O roadmap oficial e suas dependências continuam na seção 48.3.

### 48.4.1 Dashboard e identidade interna

- Dashboard adotou a linguagem `Mapa Operacional Cfit`, evitando o padrão genérico de muitos cards brancos iguais;
- abertura composta por texto editorial, `Pulso Cfit`, órbita operacional em SVG e indicadores conectados;
- ícones de base ativa, receita realizada, ritmo de hoje e trajetória da receita possuem contraste, tamanho, borda tonal e traço reforçados;
- `Leitura financeira` e `Leitura da base` compartilham o mesmo padrão visual `2 × 2`, com fundo azul suave, divisórias, rótulo, valor e contexto;
- prioridades operacionais usam matriz responsiva `3 × 2`, com altura e linhas internas uniformes;
- gráfico de receita, pagamentos, check-ins e cobranças usam o modo visual `canvas`, sem cascas e sombras repetidas;
- sombras pretas foram removidas da Dashboard e da lateral da Sidebar;
- check-ins recentes preservam respiro lateral e apresentam data e horário sem invadir a coluna vizinha;
- o `Sinal prioritário` é financeiro nesta etapa: usa cobranças vencidas reais e, quando não existem, exibe cenário fictício claramente marcado como `Demonstração`;
- o exemplo demonstrativo não constitui motor completo de priorização. Evolução futura deve comparar impacto e urgência de financeiro, retenção, acesso, dispositivos e SLAs.

Arquivos principais:
```text
frontend/src/pages/Dashboard.tsx
frontend/src/components/dashboard/DashboardAttention.tsx
frontend/src/components/dashboard/RevenueChart.tsx
frontend/src/components/dashboard/RecentPayments.tsx
frontend/src/components/dashboard/RecentCheckins.tsx
frontend/src/components/dashboard/PendingStudents.tsx
frontend/src/components/dashboard/RevenueGoalCard.tsx
frontend/src/components/dashboard/CheckInGoalCard.tsx
frontend/src/components/dashboard/ActiveStudentGoalCard.tsx
```

### 48.4.2 Sidebar e navegação

- menu filtrado pelas capacidades da sessão;
- grupos por domínio recolhíveis;
- favoritos persistidos localmente e exibidos somente quando escolhidos;
- `Recentes` removido da interface e do rastreamento;
- logo da Sidebar possui variante própria legível em fundo escuro;
- clicar no logo abre `/dashboard` sem nova guia e fecha o menu mobile;
- sombra lateral escura removida;
- favoritos nunca podem revelar rota proibida, pois são filtrados pelos itens visíveis.

### 48.4.3 Check-in manual

- check-in comum continua sujeito à política de acesso da unidade;
- bloqueios retornam a causa operacional real na interface;
- contingência manual é opção explícita, exige motivo e respeita a configuração da unidade;
- usuário autorizador é persistido em `authorized_by` e a ação é auditada;
- teste automatizado cobre bloqueio por política e liberação em contingência;
- integração física Topdata/Control iD continua fora da homologação atual e não deve ser apresentada como concluída.

### 48.4.4 Entregas funcionais consolidadas

- Health Score possui fundação compartilhada, mas a consistência total entre todas as superfícies ainda deve ser validada conforme P0.1;
- financeiro possui períodos, metas, previsão, caixa, recorrências, inconsistências com workflow e webhooks preparados;
- permissões e escopo de unidade avançaram em backend e frontend;
- Agenda possui recorrência, confirmação, lembrete e detecção de conflitos;
- Treinos web possui biblioteca, modelos, prescrição, execução, evolução e revisão;
- Relatórios expõem fórmulas/fontes e indicadores ampliados;
- Automações possuem teste, simulação, execução real, SLA, tentativas, pausa e idempotência;
- Central operacional, Documentos, Crescimento e Portal possuem estruturas funcionais, ainda sujeitas aos critérios P2;
- onboarding inicial está implementado; consistência do checklist derivado do estado real permanece regida por P0.4.

### 48.4.5 Validações confirmadas

- migrações aplicadas para automações `0004`, financeiro `0011` e agenda `0004` durante a etapa;
- `python manage.py check` passou;
- `makemigrations --check --dry-run` não encontrou alterações pendentes na validação de fechamento do roadmap;
- suíte combinada de check-ins, financeiro, alunos, agenda, treinos e automações: `73` testes aprovados;
- suíte de check-ins após a correção de contingência: `11` testes aprovados;
- testes do frontend para política de acesso: `6` aprovados;
- builds de produção do frontend passaram após cada ajuste visual final;
- ESLint passou nos arquivos diretamente alterados da Dashboard;
- `git diff --check` passou antes do commit e nas correções subsequentes.

### 48.4.6 Estado Git e ponto exato de retomada

- commit funcional enviado para `origin/main`: `458111b`;
- após esse commit, somente esta atualização documental do `AGENTS.md` permanece local por solicitação explícita do usuário;
- não criar commit nem fazer push desta alteração documental sem nova autorização;
- na próxima sessão, executar `pwd`, ler integralmente este arquivo e consultar `git status --short --branch`;
- validar visualmente a Dashboard em resoluções reais antes de propagar a linguagem `Mapa Operacional Cfit` para outros módulos;
- não tratar o roadmap inteiro como autorização para implementação em lote.

---

## 48.5 Fundação visual interna — 25/08/2026

Esta etapa consolidou a fundação visual da área autenticada sem alterar backend, contratos de API, cálculos, dados, permissões ou regras de negócio.

Implementado:
- tokens semânticos únicos para canvas, quatro níveis de superfície, bordas, textos, ações, estados, foco, overlay, raios, sombras e espaçamento;
- hierarquia própria para os temas claro e noturno, persistida em `cfit_color_theme` e aplicada somente à área interna;
- focus ring compartilhado, scrollbars discretas, transições curtas e respeito a `prefers-reduced-motion`;
- cabeçalho operacional compartilhado mais compacto e Dashboard editorial reduzida sem perder sua identidade;
- Sidebar com contraste maior, foco visível, favorito disponível no foco e correção do scroll ao navegar;
- Topbar com áreas clicáveis e rótulos acessíveis, melhor truncamento de usuário e destaque de academia/unidade;
- tabelas de alunos com divisores suaves, hover, foco, zebra sutil, overflow controlado, ações rotuladas e chips semânticos;
- Health Score combina pontuação e significado textual na tabela;
- inputs, placeholders e estados desabilitados possuem contraste e superfícies padronizados;
- modal compartilhado ganhou overlay, elevação, cabeçalho fixo e área central rolável; o cadastro de aluno mantém ações fixas e agrupa consentimentos em `Preferências de comunicação`;
- busca universal preserva `Ctrl K` e APIs existentes, com navegação por setas, `Enter`, `Esc`, seleção acessível, grupos e estado sem resultados;
- Configurações recebeu busca útil durante o scroll, navegação mais compacta e ações com largura natural;
- gráficos de Dashboard e Financeiro usam tokens nos eixos, grids, cursor e tooltip nos dois temas;
- estados compartilhados de loading, vazio e erro usam superfícies e elevação consistentes.

Arquivos de fundação:
```text
frontend/index.html
frontend/src/main.tsx
frontend/src/index.css
frontend/src/features/theme/
frontend/src/components/theme/ThemeToggle.tsx
frontend/src/components/AsyncState.tsx
frontend/src/components/PageHeader/
frontend/src/components/Modal/index.tsx
```

Padrões duráveis de tema e carregamento:
- o tema inicial é resolvido por um bootstrap síncrono no `<head>`, antes do carregamento do React e do CSS da aplicação;
- `cfit_color_theme` aceita somente `light` ou `dark`; sem escolha persistida, usa-se `prefers-color-scheme`, sem gravar automaticamente essa preferência como decisão do usuário;
- o bootstrap aplica `data-cfit-theme`, a classe `dark`, `color-scheme` e o fundo inicial no elemento raiz; o `ThemeProvider` parte desse mesmo estado para não produzir divergência na hidratação/renderização;
- `html`, `body` e `#root` compartilham o canvas semântico desde o primeiro frame; durante o bootstrap, transições ficam desabilitadas e são liberadas no frame seguinte à montagem do React;
- não substituir o bootstrap síncrono por efeito React, atraso artificial ou tela ocultada, pois isso reintroduz o clarão claro no modo noturno;
- carregamentos de rota usam `AppBootSkeleton` antes da sessão e `ModuleSkeleton` dentro da área protegida; quando o perfil já existe, o `Suspense` interno preserva a Sidebar e a Topbar e substitui somente o conteúdo;
- `AsyncState.tsx` centraliza blocos, cartões, tabelas, detalhes, formulários e fallback genérico de skeleton; skeletons são decorativos, enquanto o contêiner expõe `role="status"`, `aria-busy` e texto exclusivo para leitores de tela;
- skeletons devem manter geometria responsiva próxima do conteúdo final, sem números ou registros simulados e sem overflow horizontal;
- divisores de tabela usam `--cfit-table-divider`, separado das bordas de controles e superfícies; no modo noturno, o divisor deve permanecer mais discreto que o texto e que os estados de hover, seleção e foco;
- animações compartilhadas usam `--cfit-motion-fast`, `--cfit-motion-base` e `--cfit-motion-ease`; modais, menus, busca e skeletons devem usar movimentos curtos, sem glow permanente e respeitar `prefers-reduced-motion`;
- foco por teclado permanece visível com contorno e halo controlado; não remover o contorno nem representar estado somente por brilho ou cor.

Validações desta etapa:
- `npm run lint`: sem erros; cinco avisos de dependências de hooks já existentes fora do escopo visual;
- `npm run build`: aprovado;
- testes do frontend no contêiner oficial: `6` aprovados;
- `git diff --check`: aprovado;
- serviços Django, frontend e PostgreSQL permaneceram em execução;
- nenhuma API, modelo, migração, regra de negócio ou dado foi alterado.

Limitações e backlog visual deliberadamente não assumido nesta etapa:
- modo compacto da Sidebar não foi criado porque a estrutura atual não possui uma fundação segura para ele;
- tabelas específicas que não usam a tabela de alunos ainda devem migrar gradualmente para um componente compartilhado completo, incluindo densidade configurável;
- rodapé fixo foi aplicado ao fluxo longo de cadastro de aluno; formulários especializados devem ser avaliados individualmente antes de generalizar a API do modal;
- o diretório `frontend/src/theme/` anterior permanece como legado não importado; não removê-lo sem uma tarefa de limpeza explícita;
- QA automatizado por screenshots autenticados não está configurado no repositório. A validação final em navegador real, com sessão e dados reais, permanece necessária para todas as rotas e larguras definidas antes de tratar a modernização visual completa como encerrada.

---

## 48.6 Refinamentos visuais pós-auditoria — 25/08/2026

Esta rodada corrigiu problemas residuais da fundação visual sem alterar lógica funcional, backend, APIs, modelos, cálculos, permissões ou dados.

Correções confirmadas:
- tabelas internas prioritárias usam a classe compartilhada `cfit-data-table` e tokens próprios para linha normal, alternada, hover, seleção, foco e desabilitada;
- a linha alternada noturna não depende mais de `odd:bg-slate-50/50`, evitando superfícies claras no tema escuro;
- tabela de alunos, cobranças, recorrências, ficha financeira, check-ins e tabela de treinos aderem aos mesmos estados de linha;
- chips financeiros, de Health Score, matrícula, recorrência, conciliação e status do aluno usam os tons semânticos compartilhados com texto, ponto indicador, altura e padding consistentes;
- o rodapé fixo do cadastro de aluno usa `cfit-modal-footer`, baseado em `surface-elevated`, borda temática e sombra superior própria para cada tema;
- o botão secundário compartilhado usa superfícies e bordas semânticas, preservando o contraste de `Cancelar` no rodapé noturno;
- Dashboard substituiu valores e mensagens grandes de carregamento por skeletons estruturais para métricas, prioridade operacional, leituras financeira e da base, gráfico, pagamentos, check-ins e cobranças vencidas;
- listagem de alunos e tabela financeira mantêm cabeçalho e geometria aproximada durante o loading;
- skeleton compartilhado respeita `prefers-reduced-motion` através da fundação global;
- seletor de tema ficou neutro em repouso, sem sombra ou glow permanente, mantendo hover, tooltip e focus ring;
- contraste do token terciário foi elevado discretamente nos dois temas;
- botão de fechar da command palette e botão de fechar do modal possuem `aria-label`, tooltip, área de 40 px e foco global visível;
- scrollbars ganharam thumb ligeiramente mais largo e contrastado, incluindo hover e compatibilidade por `scrollbar-color` no Firefox;
- gradiente claro do cabeçalho operacional foi dessaturado sem alterar altura ou composição.

Causas dos defeitos críticos:
- a zebra clara vinha da variante Tailwind `odd:bg-slate-50/50`; o seletor noturno anterior tratava `.bg-slate-50/50`, mas não a classe variante gerada com prefixo `odd:`;
- o rodapé branco vinha de `bg-white/95` aplicado diretamente no `StudentForm`, variante que não fazia parte do mapeamento noturno de utilitários.

Validações desta rodada:
- `npm run lint`: sem erros; permanecem cinco avisos preexistentes de dependências de hooks;
- checagem TypeScript executada por `npm run build`: aprovada;
- build Vite de produção: aprovado;
- testes do frontend no contêiner oficial: `6` aprovados;
- `git diff --check`: aprovado;
- containers frontend, Django e PostgreSQL ativos; frontend respondeu HTTP `200` e a raiz `/api/` respondeu `404` esperado por não ser um endpoint registrado.

Limitação de QA:
- o ambiente de execução continua sem navegador gráfico, Chromium, Playwright ou sessão autenticada disponível. Foi possível validar a aplicação real em execução, os estados no código, tokens compilados, responsividade declarada e navegação por teclado, mas não produzir screenshots autenticados nas matrizes de viewport. A inspeção humana final nos dois temas e nas alturas `900`, `768` e `640` px permanece necessária.

---

## 48.7 Consolidação dos dez pontos seguintes do roadmap — 25/08/2026

Esta rodada auditou em conjunto P1.9, P1.11, P2.19, P2.21 a P2.24, P3.25, P3.26 e P3.28. Ela não substituiu módulos funcionais: consolidou as fundações existentes, corrigiu integrações desconectadas e completou preferências pessoais que não exigem novo domínio server-side.

Estado confirmado por ponto:
- permissões: a matriz backend continua como fonte de autorização e a política de rotas do frontend foi validada para perfis administrativos, operacionais e portal; a homologação humana com contas reais dos seis perfis foi confirmada pelo usuário em 28/08/2026;
- check-ins e dispositivos: monitor, diagnóstico, latência, estados `never_connected`, `online`, `offline` e `error`, webhook autenticado, idempotência e comandos de conectores possuem cobertura automatizada; homologação física Topdata/Control iD permanece externa;
- relatórios: período e escopo estão explícitos, a exportação reflete o período ativo, contatos alimentam o histórico do aluno e visões pessoais reproduzíveis foram adicionadas;
- planos e matrículas: prévia comercial, histórico, unidade, contrato e cobranças permanecem usando as fontes existentes; nenhuma regra comercial foi duplicada no frontend;
- unidades: comparação consolidada continua servida pela API e respeita a unidade ativa e capacidades da sessão; normalização total depende do particionamento incremental de todos os domínios históricos;
- Comercial e Turmas: origem do lead, conversão, capacidade, espera, presença, cancelamento e vínculo com unidade permanecem integrados às APIs operacionais;
- Documentos: versões, validade, aceite imutável e acesso do portal permanecem vinculados ao aluno; armazenamento externo e assinatura qualificada não são apresentados como prontos;
- Dashboard: seções opcionais podem ser ocultadas e restauradas sem alterar dados, escopo ou permissões;
- relatórios salvos: nome, período, favoritos, visão padrão e exclusão confirmada persistem localmente, com escopo pessoal explícito;
- portal: avaliações foram incorporadas à visão do aluno e os domínios passaram a ter loading, erro, retry, vazio e proteção contra ações concorrentes.

Decisões duráveis desta etapa:
- preferências exclusivamente visuais podem usar armazenamento local quando o escopo for identificado como pessoal neste navegador e houver restauração do padrão;
- preferências locais nunca concedem capacidade, revelam rota proibida ou alteram o escopo confiável de academia/unidade;
- visões salvas devem armazenar filtros reproduzíveis, não resultados calculados, para evitar dados obsoletos;
- o Portal consome as mesmas fontes administrativas e o backend filtra sempre pelo `portal_student`; o frontend não recebe identificador livre para escolher outro aluno;
- linhas da tabela de alunos aplicam `--cfit-table-divider` diretamente e não dependem de utilitários `divide-slate-*`; isso evita divisores claros residuais entre alunos no modo noturno;
- integração com equipamento físico, assinatura qualificada, compartilhamento entre usuários e particionamento histórico completo não podem ser marcados como concluídos apenas por simulação ou persistência local.

Validações desta consolidação:
- `npm run lint`: sem erros; cinco avisos preexistentes de dependências de hooks;
- `npx tsc --noEmit`: aprovado;
- testes do frontend: `9` aprovados;
- build Vite de produção: aprovado;
- suíte integrada Django: `116` testes aprovados;
- `python manage.py check`: aprovado;
- `makemigrations --check --dry-run`: nenhuma alteração pendente.

---

## 48.8 Roadmap final consolidado — Fase 0 de 26/08/2026

Esta seção consolida a auditoria solicitada para a etapa final de evolução do Cfit. Ela complementa o roadmap oficial da seção 48.3 e prevalece quando houver divergência de estado com retratos históricos. O SCA é somente referência de eficiência operacional; identidade, textos, telas e implementação do Cfit permanecem próprios.

### 48.8.1 Regra de leitura dos estados

- `[ ]`: pendente, sem fluxo vertical suficiente;
- `[~]`: em andamento ou parcial; interface isolada não significa conclusão;
- `[x]`: frontend, backend, persistência, permissões, estados e testes confirmados no escopo descrito;
- `[!]`: bloqueado por integração, homologação, infraestrutura ou decisão externa.

Uma fase ampla pode permanecer `[~]` mesmo quando algumas fatias internas estão `[x]`. Não promover uma fase para `[x]` antes de cumprir sua definição de concluído e validar os dois temas e breakpoints previstos.

### 48.8.2 Mapa técnico atual

| Domínio | Backend e persistência | Frontend e rota | Estado real |
|---|---|---|---|
| Agenda | `apps.schedule.ScheduleEvent`, API `/api/schedule/events/`, recorrência diária/semanal, série, conflito por profissional/local, confirmação e cancelamento | `/schedule` possui filtros, criação e lista | `[~]` funcional parcial: Dia/Semana/Mês apenas mudam datas; faltam grade, navegação por período, edição/detalhe, sala estruturada, capacidade, presença e exceções de série |
| Turmas | `GroupClass` e `ClassBooking` em `apps.operations`, capacidade, espera, presença/falta/cancelamento e duplicação | aba embutida em `/growth` | `[~]` persistida, mas misturada ao Comercial, sem paginação/filtros/histórico e sem vínculo com `ScheduleEvent` |
| Central operacional | dispositivos, campanhas, avaliações e onboarding em `apps.operations` | `/operations` reúne os quatro fluxos | `[~]` composição atual contradiz a nova responsabilidade; ainda não existe entidade genérica de pendência, atribuição, SLA e resolução por origem |
| Treinos | `apps.workouts` cobre biblioteca, modelos, prescrição, exercícios, progresso e sessões | `/workouts` e ficha do aluno | `[~]` avançado; falta confirmar filtros/escala, histórico administrativo completo e integração vertical com avaliação/revisão |
| Avaliações | `PhysicalAssessment` persiste medidas, sinais, foto, responsável e próxima avaliação | Central, ficha e Portal consomem o domínio | `[~]` persistida; precisa sair da Central, consolidar validações/unidades, comparação temporal, gráficos, permissões próprias e vínculo com revisão do treino |
| Comercial | `Lead`, conversão com prevenção por CPF e auditoria de atualização/conversão | `/growth` usa lista linear e formulário exposto | `[~]` persistido; faltam Kanban/tabela, busca, paginação, histórico de contatos/propostas e associação segura a aluno existente/matrícula |
| Relacionamento | `CommunicationCampaign` e `MessageDelivery`, preparação e sandbox | misturado à Central | `[~]` persistido e protegido contra envio implícito, mas sem área própria, segmentos reutilizáveis e governança completa de execução real |
| Documentos | `StudentDocument` possui arquivo, versão numérica, validade, vínculo com matrícula e aceite | `/documents` e Portal | `[~]` persistido; versões ainda são registros soltos, sem entidade de modelo/solicitação de aceite/arquivamento; armazenamento externo e assinatura qualificada estão bloqueados |
| Automações | regras e execuções com SLA, tentativas, pausa e idempotência | `/automations` | `[~]` backend avançado; faltam paginação/filtros/drawer/histórico escalável e auditoria visual completa; textos internos devem permanecer traduzidos no frontend |
| Relatórios | API gerencial e comparação por unidades; visões salvas server-side em alteração local atual | `/reports` orientado a perguntas | `[~]` avançado; faltam cache/progresso por seção, relatórios dos novos domínios e QA de compartilhamento/permissões |
| Configurações e governança | academia, unidades, membros, preferências, sessões e auditoria possuem APIs | `/settings` concentra seções | `[~]` avançado; faltam rotas/seções independentes, proteção de alterações não salvas e filtros de escala em todas as superfícies |
| Unidades | `Unit`, contexto ativo e relatório comparativo | `/units` | `[~]` fundação funcional; domínios históricos ainda não estão integralmente particionados e as métricas precisam explicitar fotografia, movimento, caixa e competência |
| UX compartilhada | tokens semânticos, tema síncrono, skeletons, modal, cabeçalho, busca e divisores | área autenticada inteira | `[~]` fundação sólida; falta tabela compartilhada completa, preservação generalizada de filtros, QA visual automatizado e modo compacto avaliado |

### 48.8.3 Checklist rastreável por fase

#### Fase 0 — diagnóstico, documentação e regressão

- [x] Mapear rotas, apps, modelos, APIs e componentes diretamente envolvidos no roadmap.
- [x] Classificar fundações persistidas, interfaces parciais e dependências externas sem duplicar módulos.
- [x] Registrar dependências, riscos, migrations previstas e divisão incremental neste arquivo.
- [x] Revisar a matriz atual de capacidades e identificar capacidades genéricas reutilizadas por domínios novos.
- [~] Consolidar proteção automatizada: há suítes Django e frontend, mas não existe E2E autenticado nem matriz visual automatizada.
- [!] Homologar visualmente temas e breakpoints com sessão e dados reais; depende de navegador/sessão de QA disponíveis.

#### Fase 1 — Agenda operacional e Turmas

- [x] Agenda persistida com período, tipos, recorrência simples, confirmação, cancelamento e conflitos de toda a série.
- [x] Grade real de Dia/Semana/Mês, navegação anterior/próximo, hoje, detalhe e edição contextual.
- [x] Filtros por tipo, profissional, turma, sala/local e unidade ativa; sala/local ainda é catálogo textual derivado e poderá virar recurso estruturado em evolução posterior.
- [x] Recorrência com ocorrências independentes, reposição e cancelamento por ocorrência ou série.
- [x] Turmas persistidas com capacidade, espera, vagas, ocupação e chamada.
- [x] Consulta de Turmas separada da criação, com busca, filtros, paginação, ocupação e ações operacionais.
- [x] Turma/aula vinculada à Agenda por `schedule_event`, com criação transacional e sincronização de edição/cancelamento.
- [x] Auditoria de criação, edição, duplicação, inativação, inscrição, chamada, cancelamento e reposição.
- [~] Permissões, conflitos, capacidade, estados vazios/erro e fluxo backend possuem cobertura; E2E autenticado e inspeção visual nos temas/breakpoints permanecem pendentes.

#### Fase 2 — Central operacional

- [x] Modelo/API de pendência operacional com prioridade, origem, responsável, SLA, status, próxima ação e histórico.
- [x] Adaptadores idempotentes para financeiro, retenção, acesso, comercial, documentos, agenda e automações.
- [x] Pesquisa, filtros, atribuição, resolução, histórico e atualização individual sem recarregar toda a página.
- [x] Central dedicada à fila diária; dispositivos permanecem em Check-ins/Acesso, campanhas ganharam `/relationship`, avaliações permanecem na ficha/Treinos e onboarding em `/onboarding`.
- [x] URL `/operations` preservada como Central e APIs antigas mantidas para compatibilidade.

#### Fase 3 — Treinos, avaliações e evolução

- [x] Biblioteca, modelos, prescrição, exercícios, execução, aderência, carga, revisão e histórico básico existem no frontend web.
- [x] Avaliações possuem persistência, medidas, composição, objetivo, responsável, foto opcional e próxima data.
- [x] Avaliações estão consolidadas na ficha, com formatos validados, comparação e gráficos com alternativa textual.
- [x] Próxima avaliação pode atualizar a revisão do treino; evolução de carga e ações de treino são auditadas.
- [!] Aplicativo dedicado do aluno permanece fora do frontend web atual.

#### Fase 4 — Comercial e Relacionamento

- [x] Lead, etapas, responsável, próxima ação, motivo de perda e conversão auditada existem.
- [x] Kanban e lista paginada, busca, filtros, ação vencida, contatos e propostas estão disponíveis.
- [~] A API permite associação explícita e segura a aluno existente e impede duplicidade por CPF; a matrícula continua no fluxo contratual próprio após a conversão.
- [x] Campanhas possuem rascunho, canal, segmento, sandbox/preparação e segmentos reutilizáveis.
- [x] Relacionamento possui área própria; execução externa continua condicionada a provedor configurado.
- [!] Métricas e envio por provedor externo dependem de integração configurada; não simular entrega real.

#### Fase 5 — Documentos e Portal

- [x] Arquivo, versão, validade, aceite, vínculo com aluno/matrícula e isolamento do Portal existem.
- [~] Versões são registros imutáveis e aceites consumados não podem ser regravados; solicitação de aceite ainda usa o estado do próprio documento.
- [~] Pesquisa, filtros, paginação, renovação, arquivamento, download autorizado e alertas de validade existem; modelos reutilizáveis permanecem pendentes.
- [!] Armazenamento externo seguro e assinatura qualificada dependem de provedor e decisão externa.

#### Fase 6 — Automações

- [x] Separação entre teste, simulação e execução real, tentativas, SLA, pausa e idempotência existem no backend atual.
- [~] UI possui busca, filtros, paginação e áreas separadas de regras/execuções; drawer cronológico permanece pendente.
- [x] Pausa, retomada, duplicação inativa, resolução e execução real são auditadas; idempotência protege o processamento de eventos.
- [~] Modos principais estão traduzidos; revisar rótulos residuais durante a auditoria visual autenticada.

#### Fase 7 — Relatórios e desempenho percebido

- [x] Perguntas gerenciais, período/escopo, fórmulas/fontes e exportação inicial existem.
- [x] Favoritos e visões salvas possuem persistência server-side e escopos pessoal, unidade e academia.
- [~] Relatório gerencial usa cache curto por academia, unidade e período; carregamento independente por bloco permanece como refinamento.
- [x] Relatórios gerenciais incluem Agenda, Turmas, Comercial, Retenção e Treinos com fontes persistidas.
- [ ] Garantir navegação para origem e exportação idêntica aos filtros.

#### Fase 8 — Configurações, usuários e governança

- [~] Seções pesquisáveis, membros, capacidades, sessões, auditoria e preferências existem.
- [~] A rota `/settings/:section` separa a apresentação das seções sem duplicar os módulos, mas a implementação ainda compartilha a página principal e não constitui uma divisão completa em páginas independentes.
- [~] Busca aceita foco pelo atalho `/`; salvamentos são por seção e ações sensíveis exigem confirmação. Alterações de academia e regras operacionais possuem aviso visual e proteção ao sair da página, mas a proteção ainda não cobre todos os formulários da área.
- [~] Membros e auditoria possuem filtros server-side; acesso simultâneo a várias unidades ainda exige decisão de escopo.
- [x] Homologação interativa concluída com contas reais dos seis perfis: Proprietário, Administrador, Gerente, Recepção, Professor e Financeiro; confirmação registrada pelo usuário em 28/08/2026.

#### Fase 9 — Gestão e comparação entre unidades

- [~] Cadastro, unidade ativa, isolamento de APIs novas e comparação inicial existem.
- [~] Cartões e tabela consolidada possuem período, ranking, alertas, receita por aluno, variações contra o mês anterior, ordenação, densidade e persistência dos controles na URL; filtros adicionais e particionamento histórico permanecem como refinamento.
- [x] O diagnóstico somente leitura `/api/academies/units/unit-coverage/` explicita registros sem unidade por domínio e exige revisão manual, sem atribuição automática.
- [ ] Particionar e migrar incrementalmente os domínios históricos antes de declarar consolidado confiável.
- [!] Dados históricos ambíguos exigem regra de migração aprovada; não inferir unidade silenciosamente.

#### Fase 10 — refinamentos gerais de UX/UI

- [x] Tema semântico, carregamento inicial, busca global, favoritos, grupos recolhíveis, foco visível e `prefers-reduced-motion` possuem fundação.
- [~] Grupos recolhidos e uso local da navegação possuem persistência; modo compacto continua não validado.
- [~] Paginação reutilizável começou a ser consolidada; ordenação, densidade, colunas e preservação global de retorno ainda não formam um componente único.
- [ ] Remover formulários longos expostos conforme cada domínio migrar para modal, drawer ou fluxo próprio.
- [ ] Executar auditoria final de contraste, teclado, gráficos textuais, temas e breakpoints após os fluxos funcionais.

### 48.8.3.1 Decisões duráveis das evoluções internas

- alterações de carga, séries ou repetições de um exercício prescrito devem criar histórico de evolução e auditoria; não sobrescrever a única evidência anterior;
- conversão comercial pode criar um aluno novo somente após validar CPF único, ou associar explicitamente um aluno existente da mesma academia e unidade; associação implícita por semelhança de nome, telefone ou e-mail é proibida;
- criação de matrícula após conversão continua no fluxo próprio, pois preço, cobrança e aceite contratual não podem ser inferidos pelo funil;
- segmentos de relacionamento são reutilizáveis e validados por critérios permitidos; sandbox, preparação e envio externo precisam permanecer visual e tecnicamente distintos;
- aceite documental consumado é imutável; renovação cria nova versão e arquivamento preserva versões e evidências anteriores;
- download de documento passa pela API autenticada e pelo mesmo escopo de academia/unidade da listagem;
- automação duplicada nasce inativa para revisão; teste, simulação e execução real continuam estados inequívocos e ações operacionais geram auditoria;
- cache de relatório deve incluir academia, unidade e período na chave e ter duração curta; nunca compartilhar resultado entre escopos;
- comparação de unidades deve declarar período e base de cálculo, apresentar período anterior quando houver e nunca atribuir registros históricos sem unidade por inferência silenciosa;
- paginação reutilizável deve manter área de toque, estado desabilitado e anúncio da quantidade; tabelas mais avançadas só devem consolidar ordenação e colunas depois de preservar filtros e retorno por rota.

### 48.8.4 Dependências e ordem executável

```text
Fase 0
  ↓
Fase 1: Turma ↔ Agenda ──────────────┐
  ↓                                  │
Fase 2: Pendências operacionais      │
  ↑                                  │
Fases 3, 4, 5 e 6 produzem origens ──┘
  ↓
Fase 7: Relatórios reconciliados
  ↓
Fase 8: Governança consolidada
  ↓
Fase 9: Comparação confiável por unidade
  ↓
Fase 10: acabamento transversal
```

Fases 3 a 6 podem avançar em fatias independentes depois que o contrato mínimo de origem da Central estiver definido. Fase 9 depende do particionamento real dos dados; Fase 10 acompanha cada entrega em acessibilidade e responsividade, mas seu fechamento global ocorre por último.

### 48.8.5 Migrations previstas

- Fase 1: vínculo explícito entre turma, ocorrência e evento; recorrência/exceções; sala/recurso estruturado; estado e histórico da aula. Preferir evoluir `apps.schedule` e migrar gradualmente `GroupClass`, sem mover tabelas em uma única migration.
- Fase 2: `OperationalIssue` e histórico de transições/comentários, com chave idempotente de origem.
- Fase 3: vínculo entre avaliação e revisão de treino; somente adicionar entidade de anexo se o armazenamento atual for mantido com autorização adequada.
- Fase 4: interações/propostas do lead, etapas configuráveis apenas se houver necessidade comprovada e segmentos de campanha reutilizáveis.
- Fase 5: documento lógico, versão, solicitação de aceite e aceite imutável; migração das linhas atuais agrupada por aluno/título com regra explícita.
- Fase 6: evitar migration se os campos atuais bastarem; primeiro auditar índices e contratos da API.
- Fase 7: cache pode começar sem persistência permanente; não criar tabela antes de medir necessidade.
- Fase 8: escopo de unidade por membro pode exigir relação própria caso um usuário deva acessar várias unidades simultaneamente.
- Fase 9: migrations por domínio histórico, com backfill revisável e relatório de registros sem unidade.

### 48.8.6 Riscos e proteções

1. `apps.operations` concentra acesso, campanhas, avaliações, onboarding, leads, turmas, documentos e sessões. Separar responsabilidade primeiro por APIs/rotas e serviços; evitar migração física em lote.
2. `GroupClass` e `ScheduleEvent` mantêm horários independentes. Criar sincronização bidirecional improvisada causaria divergência; a primeira entrega deve definir uma fonte única e vínculo explícito.
3. Capacidades de Comercial, Turmas, Documentos e Avaliações reutilizam `students.*`, `schedule.*` ou uma combinação ampla. Consolidar capacidades gradualmente no backend antes de depender apenas da ocultação no frontend.
4. A unidade ativa é uma unidade única no vínculo atual. Redes com acesso simultâneo a várias unidades exigem decisão de escopo antes da Fase 9.
5. Arquivos e fotos usam armazenamento Django local. Escala, download autorizado e retenção precisam de política antes de armazenamento externo.
6. O frontend não possui Playwright/Cypress nem navegador configurado. Não declarar QA visual/E2E completo a partir de lint e build.
7. O workspace contém alterações funcionais locais anteriores ainda sem commit. Preservá-las, não reverter nem misturar correções alheias; validar o conjunto antes de cada entrega.
8. APIs paginadas podem ser consumidas como listas completas em páginas iniciais. Toda evolução de escala deve confirmar contrato paginado e preservar filtros durante atualização.

### 48.8.7 Divisão em entregas pequenas

1. **F1-A — contrato Turma–Agenda:** modelo/vínculo, conflito único, criação transacional, leitura na Agenda, auditoria e testes de capacidade/permissão.
2. **F1-B — Agenda navegável:** grade Dia/Semana responsiva, hoje/anterior/próximo, detalhe e edição; Mês como visão resumida real.
3. **F1-C — operação de Turmas:** listagem paginada, filtros, drawer de criação/edição, ocupação, espera e chamada.
4. **F1-D — séries e exceções:** cancelamento/reposição por ocorrência ou série, lembretes idempotentes e histórico.
5. **F2-A — núcleo de pendências:** entidade, transições, atribuição, SLA, auditoria e API paginada.
6. **F2-B — adaptadores:** financeiro e acesso primeiro; depois Agenda, Comercial, Documentos, Retenção e Automações.
7. **F2-C — redistribuição de rotas:** mover interfaces mantendo compatibilidade de URLs.
8. Fases seguintes devem repetir o padrão: contrato e testes backend, fatia de UI operacional, integração/auditoria e QA.

Primeira entrega implementável recomendada: **F1-A — contrato Turma–Agenda**. Ela resolve a maior inconsistência da prioridade funcional sem redesenhar a Agenda, cria a fundação para grade, chamada, ocupação e relatórios, e pode ser validada verticalmente em uma alteração pequena.

### 48.8.8 Estado desta entrega

- Escopo: Fase 0 documental e diagnóstico técnico; nenhuma nova regra de negócio foi implementada nesta seção.
- APIs e migrations: nenhuma API alterada e nenhuma migration criada especificamente pela Fase 0.
- Componentes: nenhum componente criado pela Fase 0; foram identificados para reutilização `PageHeader`, `Modal`, `ConfirmDialog`, `AsyncState`, `RecordList`, `DashboardLayout`, cliente `Api` e política `ScopedCapability`.
- Permissões: backend continua sendo a fonte; lacunas de granularidade foram registradas, sem ampliar acesso nesta entrega.
- Auditoria: catálogo existente preservado; eventos ausentes por domínio foram registrados como pendência.
- Validação visual: bloqueada nesta entrega pela ausência de navegador autenticado configurado; não inferir aprovação dos dois temas apenas pelo código.
- Validações de baseline em 26/08/2026: `python manage.py check` aprovado; `makemigrations --check --dry-run` sem alterações pendentes; suíte Django completa com `121` testes aprovados; lint do frontend com zero erros e cinco avisos preexistentes de dependências de hooks; `12` testes do frontend aprovados; TypeScript e build Vite de produção aprovados.
- O baseline inclui as alterações funcionais locais anteriores ainda não commitadas; esta Fase 0 adicionou somente documentação e não autorizou commit, push, deploy ou infraestrutura.

---

## 48.9 Entrega da Fase 1 — Agenda operacional e Turmas — 26/08/2026

Esta entrega executou os dez pontos prioritários da Fase 1 sem alterar as URLs `/schedule` e `/growth` e sem reconstruir os demais domínios.

Implementação confirmada:
- `GroupClass` possui situação operacional, série, recorrência e vínculo individual protegido com `ScheduleEvent`;
- a migration `operations.0008_groupclass_schedule_integration` cria os campos e vincula turmas históricas a eventos sem excluir dados;
- criação de turma simples ou recorrente valida todas as ocorrências antes de persistir e ocorre dentro de transação;
- conflitos consideram professor e sala/local no contexto da unidade ativa;
- edição e cancelamento permanecem sincronizados quando iniciados pela Agenda ou por Turmas;
- cancelamento exige motivo e pode afetar ocorrência ou série; reposição cria nova turma/evento auditável;
- capacidade, inscritos, vagas, ocupação e lista de espera são calculados no backend;
- cancelamento de inscrição promove o primeiro aluno da espera;
- chamada registra presença, falta ou cancelamento;
- consulta de Turmas possui busca, situação, modalidade, período e paginação server-side;
- criação e edição usam modal; consulta e formulário deixaram de ficar permanentemente misturados;
- Agenda possui visões Dia e Semana com grade horária de `06h` a `22h` e visão Mês por data;
- navegação anterior/próximo, atalho `Hoje`, filtros por tipo, profissional, turma e sala/local foram conectados à API;
- evento abre detalhe contextual com horário, profissional, local, situação, confirmação, edição, cancelamento e ocupação da turma;
- telas mantêm loading por skeleton, vazio acionável, erro com nova tentativa e layout com overflow controlado para larguras menores;
- estilos de botões, filtros, chips e foco usam tokens semânticos compartilhados nos dois temas.

APIs evoluídas, preservando os endpoints existentes:
```text
GET/PATCH/POST /api/schedule/events/
GET            /api/schedule/events/options/
POST           /api/schedule/events/:id/confirm/
POST           /api/schedule/events/:id/cancel/
GET/POST/PATCH /api/operations/classes/
POST           /api/operations/classes/:id/book/
PATCH          /api/operations/classes/:id/bookings/:booking_id/
POST           /api/operations/classes/:id/cancel/
POST           /api/operations/classes/:id/duplicate/
POST           /api/operations/classes/:id/replace/
POST           /api/operations/classes/:id/deactivate/
```

Permissões e auditoria:
- Agenda e Turmas continuam protegidas por `ScopedCapability`, com `schedule.view` para leitura e `schedule.manage` para escrita;
- academia e unidade são obtidas exclusivamente da sessão; professor e aluno são validados contra esse contexto;
- eventos auditados: `schedule.created`, `schedule.updated`, `schedule.canceled`, `group_class.created`, `group_class.updated`, `group_class.booking_updated`, `group_class.attendance_updated`, `group_class.canceled`, `group_class.duplicated`, `group_class.replacement_created` e `group_class.deactivated`.

Validações desta entrega:
- `python manage.py check`: aprovado;
- `makemigrations --check --dry-run`: nenhuma alteração pendente;
- migration `operations.0008_groupclass_schedule_integration`: aplicada no banco de desenvolvimento;
- suíte Django completa: `123` testes aprovados;
- testes de Agenda e Operações: `16` aprovados, incluindo vínculo de série, atomicidade de conflito, capacidade/espera e sincronização de cancelamento;
- lint do frontend: zero erros e cinco avisos preexistentes de dependências de hooks;
- testes do frontend: `12` aprovados;
- TypeScript e build Vite de produção: aprovados após a grade horária final;
- `git diff --check`: deve permanecer como verificação obrigatória antes de encerramento ou commit.

Limitações deliberadas:
- sala/local continua sendo texto normalizado por consulta, não uma entidade de recurso com capacidade própria;
- recorrência atual suporta diária e semanal, com até `52` ocorrências; regras mensais/configuráveis permanecem futuras;
- a UI permite exceções por edição individual e reposição, mas ainda não possui editor em lote de uma série existente;
- o intervalo visual padrão da grade é `06h–22h`; eventos fora desse horário permanecem nos dados e na visão Mês, mas uma configuração de horário por unidade ainda é futura;
- QA visual autenticado nos temas claro/noturno e breakpoints reais continua pendente por ausência de navegador/sessão automatizada no ambiente;
- não houve commit, push, deploy, publicação ou integração externa.

Próxima entrega recomendada: **F2-A — núcleo de pendências da Central operacional**, começando por modelo, transições, responsável, SLA, origem idempotente, auditoria e API paginada antes da reorganização visual dos módulos atuais.

---

## 48.10 Entrega da Fase 2 — Central operacional — 26/08/2026

- `OperationalIssue` e `OperationalIssueHistory` persistem origem idempotente, prioridade, responsável, SLA, situação, próxima ação, resolução e linha do tempo;
- a listagem sincroniza fontes reais de cobranças/recorrências, retenção, dispositivos, turmas canceladas, leads vencidos, documentos e automações com falha;
- uma causa eliminada na origem resolve automaticamente a pendência correspondente, preservando histórico;
- `/api/operations/issues/` é paginada e aceita pesquisa, origem, prioridade, situação, responsável e SLA vencido;
- atualização de uma pendência ocorre por `PATCH`, valida responsável da academia, exige resolução ao concluir e registra auditoria administrativa;
- `/operations` tornou-se a fila diária com indicadores, filtros, responsável, ação de origem e drawer de resolução;
- campanhas foram movidas para `/relationship`, com rascunho e preparação explícita em sandbox; nenhuma execução externa é inferida;
- dispositivos continuam no domínio de Check-ins/Acesso, avaliações na ficha do aluno/Treinos e onboarding em `/onboarding`; APIs anteriores foram preservadas;
- capacidades `operations.view` e `operations.manage` foram adicionadas aos perfis operacionais adequados, mantendo backend como fonte de autorização;
- migration aplicada: `operations.0009_operationalissue_operationalissuehistory`;
- validações: Django check e migrations aprovados, `124` testes Django, `12` testes frontend, lint sem erros (cinco avisos preexistentes), TypeScript e build aprovados;
- QA visual autenticado nos dois temas permanece pendente; nenhum commit, push, deploy ou envio externo foi realizado.

Próxima entrega recomendada: Fase 3, consolidando Avaliações na ficha do aluno e no ciclo de revisão de Treinos.

---

## 48.11 Entrega da Fase 3-A — Equipamentos e avaliações físicas — 26/08/2026

- [x] Equipamentos foram consolidados em `/checkins`, no bloco “Acesso e equipamentos”, com cadastro, edição, ativação/inativação, saúde, último contato, latência, firmware e diagnóstico;
- [x] eventos, diagnósticos, comandos, tentativas, falhas e resultados ficam disponíveis em histórico contextual, sem retornar à Central operacional;
- [x] falhas reais de comunicação continuam produzindo pendências na Central por adaptador idempotente; o diagnóstico força nova sincronização da origem;
- [x] troca de unidade do equipamento é validada contra academia e unidade ativas no backend;
- [x] criação e alteração de equipamentos alimentam `AdministrativeAudit`;
- [x] avaliações físicas são cadastradas diretamente na aba Avaliações da ficha do aluno, com data, peso, altura, gordura corporal, pressão, frequência em repouso, objetivo, observações e medidas estruturadas;
- [x] histórico, variações de peso/gordura e gráfico de evolução com alternativa textual usam somente avaliações persistidas;
- [x] uma avaliação pode ser vinculada a um treino do mesmo aluno; a próxima avaliação atualiza a data persistida de revisão desse treino;
- [x] criação e alteração de avaliações alimentam a auditoria administrativa;
- [x] leitura preserva `students.view`; escrita de avaliações preserva `workouts.manage`; equipamentos preservam `checkins.view` e `checkins.manage`, evitando criar capacidades redundantes;
- [x] migration aplicada: `operations.0010_physicalassessment_workout_plan`;
- [x] validações aprovadas: Django check, migrations sem divergência, `126` testes backend, `12` testes frontend, lint sem erros (cinco avisos preexistentes), TypeScript, build Vite e `git diff --check`;
- [~] os campos disponíveis cobrem a avaliação operacional atual; anexos permanecem condicionados à política de armazenamento e autorização já registrada no roadmap;
- [!] QA visual autenticado nos temas claro/noturno e breakpoints reais continua dependente de navegador e sessões por perfil no ambiente.

APIs preservadas e evoluídas:
```text
GET/POST/PATCH /api/operations/devices/
POST           /api/operations/devices/:id/diagnose/
GET            /api/operations/devices/:id/events/
GET/POST       /api/operations/devices/:id/commands/
GET/POST/PATCH /api/operations/assessments/
GET            /api/operations/assessments/comparison/?student=:id
```

Próxima entrega recomendada: continuar a Fase 3 pelos refinamentos de Treinos que ainda não atendam integralmente criação de biblioteca/modelos, execução, aderência, evolução de carga e alertas de revisão, sem duplicar o módulo já funcional.

---

## 48.12 Preparação de deploy Vercel + Neon — 26/08/2026

- o monorepo deve ser importado em dois projetos Vercel: Django na raiz e Vite em `frontend`;
- `vercel.json` da raiz usa o preset Django e região `iad1`; selecionar Neon em AWS US East (N. Virginia) mantém aplicação e banco próximos;
- `frontend/vercel.json` usa o preset Vite, fallback SPA para `index.html` e cache imutável dos assets versionados;
- frontend lê a API de `VITE_API_URL`, mantendo `localhost` somente como fallback de desenvolvimento;
- backend aceita `DATABASE_URL` Neon pooled com SSL, mantém as variáveis PostgreSQL separadas para Docker local e desativa conexões persistentes na Vercel;
- o script `scripts/vercel-build.sh` executa migrations em produção usando exatamente `DATABASE_URL`, a mesma conexão usada pelo Django em runtime; depois executa `migrate --check`, cria o superusuário inicial de forma idempotente e coleta estáticos;
- após a correção de 31/08/2026, o `vercel.json` da raiz voltou a declarar `buildCommand: "bash scripts/vercel-build.sh"`; em deploy de produção, migrations, bootstrap idempotente e `collectstatic` voltam a ser executados explicitamente pelo script versionado;
- o comando idempotente `bootstrap_superuser` cria o primeiro administrador somente quando as duas variáveis `DJANGO_BOOTSTRAP_SUPERUSER_*` estiverem presentes; nunca atualiza a senha de uma conta existente e não imprime a senha;
- hosts, CORS e CSRF são configurados por ambiente; HTTPS, cookies seguros, HSTS e proteção de conteúdo ficam ativos quando `DEBUG=False`;
- deploy Vercel falha explicitamente sem `DJANGO_SECRET_KEY` ou `DATABASE_URL`;
- arquivos enviados usam `/tmp` na Vercel apenas para compatibilidade transitória e não possuem persistência durável; antes de liberar logos, fotos ou documentos em produção é obrigatório integrar armazenamento de objetos privado. Não tratar Vercel Functions como armazenamento de mídia;
- nenhum segredo foi adicionado ao repositório; `.env`, ambientes Vercel e artefatos locais permanecem ignorados.

---

## 48.13 Estado confirmado após as alterações de 28/08/2026 — auditado em 31/08/2026

O commit `4d07282` foi enviado para `origin/main` e o workspace foi encontrado limpo e sincronizado na auditoria de retomada. A mensagem do commit o identificou como visualmente incompleto; não havia arquivos locais perdidos, mudanças em staging ou arquivos não rastreados.

Alterações confirmadas no código:
- Agenda recebeu refinamento amplo das visões Dia, Semana e Mês e passou a reutilizar o novo `DatePicker` nos fluxos de data;
- Central operacional recebeu organização visual e preserva leitura para `operations.view`, restringindo atribuição, prioridade, início e resolução a `operations.manage`;
- Check-ins concentra uma gestão de equipamentos mais detalhada, incluindo estados, diagnóstico, histórico e comandos já sustentados pelas APIs existentes;
- relatórios respeitam capacidades por domínio antes de carregar dados financeiros, de alunos, check-ins e retenção;
- resumo operacional do aluno omite dados de matrícula, financeiro, check-ins e treinos quando a sessão não possui a capacidade correspondente;
- notificações operacionais consultam e apresentam somente fontes autorizadas para a sessão;
- Configurações aceita `/settings/:section`, normaliza contato e possui proteção parcial contra saída com alterações não salvas;
- Unidades apresenta comparação consolidada configurável e diagnóstico explícito dos registros históricos ainda sem unidade;
- cadastro de aluno valida CPF, normaliza e-mail e mantém máscaras compartilhadas;
- logos internos passaram a usar os assets WebP adicionados ao repositório.

Correção de retomada em 31/08/2026:
- duas classes Tailwind concatenadas em `frontend/src/pages/Operations.tsx` foram separadas, restaurando o `padding` do rodapé da lista e do bloco de detalhes da pendência, além das classes semânticas de borda e superfície associadas.

Validações confirmadas em 31/08/2026:
- `npm run lint`: aprovado sem erros, com três avisos de dependências de hooks;
- `npm run build`: TypeScript e build Vite de produção aprovados;
- `git diff --check`: aprovado;
- a execução local de `npm run test` iniciou quatro arquivos: dois passaram e dois não foram carregados porque o Node `22.22.1` disponível foi compilado sem suporte a TypeScript para `--experimental-strip-types`; não registrar essa limitação do ambiente como regressão funcional;
- validações Django não foram repetidas porque o comando `docker` não estava disponível na distribuição WSL durante a retomada.

Pendências reais preservadas:
- executar QA visual autenticado nos temas claro e noturno e nos breakpoints definidos quando houver navegador e sessões disponíveis;
- repetir a suíte Django e os testes frontend em ambiente Docker/Node compatível;
- estender a proteção contra alterações não salvas aos formulários de Configurações ainda não cobertos;
- concluir o particionamento histórico por unidade somente com política explícita de migração; o diagnóstico atual não atribui dados ambiguamente.

Correção do carregamento dos módulos em 31/08/2026:
- a remoção anterior do `buildCommand` deixou de executar automaticamente as migrations de produção; as migrations `operations.0011` a `operations.0014` sustentam interações e propostas de leads, segmentos de campanhas e os campos/garantias novos de documentos usados por Comercial e Turmas, Relacionamento, Documentos, Portal e pela sincronização da Central operacional;
- `vercel.json` voltou a executar `scripts/vercel-build.sh`, conforme suporte oficial da configuração estática da Vercel, para aplicar migrations antes da nova versão entrar em operação;
- a política do frontend passou a tratar `portal.view` como capacidade exclusiva: o curinga administrativo `*` não libera mais `/portal`, mantendo a rota coerente com a API `/api/users/portal/me/`, que aceita somente contas de aluno;
- a correção versionada exige um novo deploy do backend para aplicar as migrations ao banco publicado; até esse deploy, o banco remoto pode continuar sem as tabelas e colunas necessárias.
- os logs do primeiro deploy corretivo confirmaram que o banco de runtime permaneceu sem `operations.0011` a `operations.0014`: `operations_campaignsegment` não existia e `operations_studentdocument.requires_acceptance` não existia;
- a causa operacional foi a possibilidade de o build migrar `DATABASE_URL_UNPOOLED` enquanto a aplicação publicada consultava `DATABASE_URL`; o script passou a migrar somente `DATABASE_URL` e a executar `migrate --check`, impedindo sucesso do build quando esse mesmo banco ainda possuir migrations pendentes.

---

## 49. Protocolo de encerramento da sessão
Frase-gatilho exata:
```text
Vamos encerrar por hoje
```

Ao receber essa frase, NÃO executar imediatamente alterações, commit ou push.

Primeiro:
1. revisar o trabalho realizado na sessão;
2. consultar `git status` e o diff atual;
3. apresentar um resumo curto do que será registrado no `AGENTS.md`, dos testes relevantes e dos arquivos que entrarão no commit;
4. perguntar explicitamente se o usuário realmente deseja prosseguir com o encerramento completo.

Somente após uma confirmação clara do usuário:
1. atualizar o `AGENTS.md` com fatos confirmados no código e no histórico da sessão;
2. preservar decisões anteriores que continuem válidas;
3. registrar o estado atual, validações executadas, pendências reais e o ponto exato de retomada;
4. não incluir hipóteses, tarefas concluídas como pendentes ou informações não verificadas;
5. executar os testes e verificações relevantes possíveis;
6. revisar `git diff`, `git diff --check` e `git status`;
7. garantir que secrets, arquivos `.env` e alterações alheias ao trabalho não sejam incluídos;
8. criar um commit com mensagem coerente com as mudanças da sessão;
9. enviar o commit para `origin main`;
10. informar o hash do commit, o resultado do push e qualquer validação que não tenha sido possível executar.

A confirmação vale apenas para o encerramento solicitado naquela ocasião. A frase-gatilho deve exigir nova confirmação em cada sessão e não concede autorização permanente para commits ou pushes futuros.

Se houver alterações inesperadas, conflito, teste relevante falhando ou dúvida sobre o que deve entrar no commit, interromper o encerramento antes do commit/push e pedir orientação.

---

## 50. Instrução final
Antes de qualquer alteração no Cfit:
```text
Leia AGENTS.md.
Leia os arquivos envolvidos.
Faça somente a alteração solicitada.
Preserve o que já funciona.
Teste antes de considerar concluído.
```
