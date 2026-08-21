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
```

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
- sem access token → redirect `/`
- com token → `Outlet`

Fluxo já testado. Logout remove token e retorna ao login. Não alterar sem necessidade.

O interceptor HTTP adiciona o access token às requisições privadas. Em resposta `401`, tenta renovar a sessão com o refresh token e repete a requisição original. Se não houver refresh token ou a renovação falhar, limpa os dois storages e redireciona para `/`.

---

## 21. Rotas frontend
```text
/                  Homepage + Login
/dashboard         Dashboard
/students          Lista de alunos
/students/:id      Detalhes do aluno
/plans             Planos
/finance           Gestão financeira
/workouts          Gestão de treinos e biblioteca de exercícios
/schedule          Em desenvolvimento: Agenda
/reports           Em desenvolvimento: Relatórios
/settings          Em desenvolvimento: Configurações
```

A rota `/` é homepage institucional + login, não só login.

Todas essas rotas estão registradas em `frontend/src/routes/index.tsx`. Agenda, Relatórios e Configurações usam o componente compartilhado `ComingSoon` para evitar páginas brancas, mas não devem ser documentados como módulos funcionais.

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

## 22. Homepage
Estrutura atual:
```text
HomeHeader
↓
Hero + Login
↓
HomeFeatures
↓
HomeBenefits
↓
HomeSystem
↓
HomeAccess
↓
HomeFooter
```

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
Card escuro premium integrado ao Hero.

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
O Dashboard possui integração parcial com dados reais: resumo financeiro, histórico de receita, pagamentos recentes, check-ins recentes e cobranças em atraso usam as APIs operacionais. Alguns indicadores e conteúdos ainda permanecem demonstrativos.

Não apresentar a parte demonstrativa como consolidação real e não conectar ou redesenhar todo o Dashboard sem solicitação.

Visual atual:
- fundo interno claro `#f4f7fb`, com iluminação azul/ciano controlada;
- largura de conteúdo limitada a `1600px`;
- cards brancos com bordas suaves, cantos grandes e sombras discretas;
- títulos fortes e compactos;
- azul e ciano como assinatura, com cores semânticas nos indicadores;
- layout responsivo em grids de uma, duas ou quatro colunas conforme a largura.

Componentes principais:
```text
DashboardLayout
DashboardHeader
StatCard
RevenueChart
RecentPayments
RecentCheckins
PendingStudents
```

Alguns são reutilizados na homepage.

Preservar a linguagem visual atual e não substituir os dados demonstrativos por integrações de backend sem solicitação específica.

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
- bloco “Ambiente seguro” no rodapé;
- botão “Sair da conta” no rodapé.

Fluxo de logout:
```text
clique em “Sair da conta”
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
- após o registro, a primeira página é recarregada;
- existem estados de carregamento, vazio, erro e nova tentativa.

O modelo `CheckIn` preserva:
- aluno com `ForeignKey(..., on_delete=models.PROTECT)`;
- data e horário em `checked_in_at`;
- origem `manual`, `access_control` ou `facial_recognition`;
- observação opcional;
- índice por aluno e data do check-in.

A API permite somente leitura e criação por HTTP (`GET` e `POST`). Não adicionar alteração ou exclusão sem uma decisão explícita sobre preservação do histórico.

Existem testes para autenticação obrigatória, filtro/ordenação do histórico e persistência de um novo check-in.

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

Projetar serviços novos pensando em auditabilidade quando fizer sentido.

---

## 40. Permissões
Primeira etapa: `Administrador`.

Permissões complexas serão implementadas futuramente. Não criar RBAC avançado prematuramente sem solicitação.

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
- rota `/workouts` funcional para gestão global de treinos e biblioteca de exercícios;
- rotas `/schedule`, `/reports` e `/settings` registradas com páginas seguras de `Em desenvolvimento`;
- títulos das páginas apresentados em português no documento do navegador;
- README atualizado para refletir arquitetura, setup, rotas, APIs e validações atuais;
- artefatos gerados, assets padrão, templates server-side antigos e arquivos comprovadamente órfãos removidos da estrutura;
- app `apps/checkins`, API privada, migração e testes adicionados ao backend;
- workspace oficial migrado para `/home/kalyteros/projetos/Cfit`;
- Django e frontend executam nos containers com UID/GID `1000`;
- arquivos gerados `frontend/node_modules` e `frontend/dist` pertencem a `kalyteros`;
- containers Django, frontend e PostgreSQL estão ativos a partir do novo workspace.

Limites atuais confirmados:
- Agenda, Relatórios e Configurações possuem somente páginas de `Em desenvolvimento`;
- a aba “Treinos” do detalhe do aluno possui treino atual, criação, conclusão e histórico;
- busca, notificações e menu do usuário da Topbar são apenas visuais;
- o Dashboard possui período configurável, comparações, metas, personalização visual por função e seção `Requer atenção`; a personalização ainda não representa RBAC;
- permissões continuam na primeira etapa de Administrador, sem RBAC avançado;
- o lint do frontend possui pendências preexistentes, principalmente pela regra `react-hooks/set-state-in-effect`.

---

## 48. PONTO EXATO DE RETOMADA
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
- gestão de Treinos implementada em primeira etapa;
- busca, notificações e menu do usuário da Topbar permanecem visuais.

O reset do Turnstile, a persistência opcional do login, o logout da Sidebar, o Check-in básico e o módulo Financeiro central já estão implementados. Diagnosticar antes de alterar caso algum desses fluxos apresente falha em validação manual.

---

## 48.1 Diretrizes de Produto, UX e Roadmap do Cfit

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
- Treinos;
- Agenda;
- Relatórios;
- Configurações.

No estado técnico confirmado, esses quatro itens aparecem na Sidebar e possuem rotas com páginas de `Em desenvolvimento`. Devem ser considerados espaços futuros, não módulos funcionais.

A ficha do aluno já possui abas para:
- Visão geral;
- Planos;
- Financeiro;
- Check-ins;
- Treinos;
- Histórico.

A aba Treinos ainda informa que será desenvolvida. Check-ins possui estrutura inicial, histórico e registro manual, incluindo estado vazio. O histórico atual contém principalmente movimentações de matrícula.

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
**Implementado em primeira etapa:** a rota possui gestão global de prescrições e biblioteca de exercícios; a ficha do aluno possui treino atual, criação, conclusão e histórico. O backend preserva exercícios, modelos, itens do treino e registros de evolução.

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

Depois evoluir para:
- gestão global de fichas;
- biblioteca de exercícios;
- modelos de treino;
- treinos predefinidos;
- acompanhamento de evolução;
- comparação entre períodos;
- impressão e acesso pelo aplicativo.

#### B. Agenda unificada
**Ainda não implementado:** a rota exibe uma página segura de `Em desenvolvimento`.

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
- estados como novo, em andamento, realizado e cancelado.

#### C. Relatórios orientados a perguntas
**Ainda não implementado:** a rota exibe uma página segura de `Em desenvolvimento`.

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
**Ainda não implementado:** a rota exibe uma página segura de `Em desenvolvimento`.

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
**Ainda não implementado:** para operações com múltiplas unidades:
- comparar métricas normalizadas;
- acompanhar metas;
- criar benchmarks internos;
- comparar frequência, inadimplência, conversão, receita por aluno e ocupação;
- identificar melhores práticas.

Dependências: arquitetura multiacademia/multiunidade, isolamento dos dados, métricas normalizadas e fonte única confiável.

### 48.1.8 Prioridade média

#### A. Automações orientadas por eventos
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

### 48.2 Estado confirmado em 21/08/2026 — Dashboard, busca, acessos e Treinos

Entregas consolidadas nesta etapa:
- Dashboard conectado com período mensal, comparação, causas da variação, metas de receita, check-ins e alunos ativos;
- indicadores acionáveis e seção `Requer atenção` baseada em dados reais;
- personalização visual do Dashboard para gestor, recepção, financeiro, professor e comercial, sem representar permissões RBAC;
- busca universal e command palette por `Ctrl/Cmd + K` para alunos, planos, cobranças e ações rápidas;
- monitor global de acessos em `/checkins`, com período, origem, resultado liberado/bloqueado, motivo e equipamento;
- Customer Health Score inicial e explicável baseado em plano ativo, inadimplência e frequência;
- Sidebar organizada por áreas, sem menus sanfonados; logout transferido para o menu de perfil da Topbar;
- favicon regenerado em tamanhos proporcionais a partir de matriz quadrada transparente;
- app `apps/workouts` criado com exercícios, modelos, planos, itens do treino e registros de evolução;
- aba Treinos da ficha do aluno funcional para criar, consultar, concluir e preservar histórico;
- rota `/workouts` funcional com gestão global das prescrições e biblioteca pesquisável de exercícios.

Validações confirmadas:
- 71 testes passaram para Treinos, alunos, check-ins, financeiro e planos;
- `python manage.py check` passou;
- `makemigrations --check --dry-run` não encontrou alterações pendentes;
- build de produção do frontend passou;
- lint direcionado dos componentes novos passou;
- `git diff --check` passou.

Ponto exato de retomada do lote solicitado de 10 itens:
1. itens 1–3 concluídos em uma fundação integrada de Treinos;
2. próximo item: construir a Agenda unificada;
3. depois: Relatórios, Configurações, RBAC, auditoria administrativa, automações e preparação multiunidade;
4. não considerar essas sete etapas restantes como implementadas.

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
