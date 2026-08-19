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
- Porta externa PostgreSQL: `15432`
- Porta interna PostgreSQL: `5432`
- Django: `8000`
- Frontend/Vite: `5173`

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

## 16. PONTO EXATO DE RETOMADA
O Turnstile já está funcionando corretamente de ponta a ponta.

Fluxo testado com sucesso:
```text
Turnstile → React → Django → Cloudflare → JWT → Dashboard
```

### Próximo problema
Tokens do Cloudflare Turnstile são de uso único.

Se:
1. o Turnstile gerar um token;
2. o usuário tentar login;
3. login falhar por e-mail/senha incorretos;
4. usuário tentar novamente;

o mesmo token não deve ser reutilizado.

### Próxima tarefa
Implementar reset/renovação automática do Turnstile após uma tentativa de login que falhar.

Provavelmente envolverá:
```text
TurnstileWidget.tsx
LoginForm.tsx
```

Possível solução:
- expor função de reset;
- usar `window.turnstile.reset(widgetId)`;
- limpar `turnstileToken`;
- obter novo token após erro.

Antes de implementar:
1. ler `TurnstileWidget.tsx` atual;
2. ler `LoginForm.tsx` atual;
3. preservar o visual atual;
4. fazer a menor alteração possível.

Não reescrever o fluxo inteiro.

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
- lembrar-me visual;
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
saveTokens(data.access, data.refresh);
navigate("/dashboard", { replace: true });
```

---

## 18. Autofill dos inputs
Chrome estava deixando inputs preenchidos automaticamente com fundo branco.

Foi adicionada correção visual de autofill em e-mail e senha.

Ao alterar `LoginForm.tsx`, não remover essa correção. O input deve continuar integrado ao card escuro.

---

## 19. Tokens frontend
JWT usa localStorage.

Chaves:
```text
cfit_access_token
cfit_refresh_token
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

---

## 21. Rotas frontend
```text
/                  Homepage + Login
/dashboard         Dashboard
/students          Lista de alunos
/students/:id      Detalhes do aluno
/plans             Planos
```

A rota `/` é homepage institucional + login, não só login.

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
Dashboard ainda usa dados demonstrativos em algumas áreas. Isso é intencional.

Prioridade recente:
```text
Homepage + identidade visual + login
```

Não conectar todo o Dashboard ao backend sem solicitação.

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

---

## 32. Students API
Regra importante: CPF é único.

`StudentViewSet`:
```python
search_fields = ["name", "cpf"]
ordering_fields = ["name", "created_at"]
ordering = ["name"]
```

Busca usa selector:
```python
search_students(search)
```

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
Previsto:
- pagamentos;
- pendências;
- entradas;
- saídas;
- caixa;
- inadimplência;
- recorrência.

Tolerância inicial planejada: `7 dias`, configurável futuramente.

---

## 38. Check-in
Primeira versão: check-in básico.

Futuro: reconhecimento facial.

Aluno deve possuir identificador único adequado para essa evolução.

---

## 39. Logs
Ações importantes deverão ser registradas futuramente, por exemplo:
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
O projeto está funcionando via Docker.

- Homepage institucional implementada.
- Login JWT funcionando.
- ProtectedRoute funcionando.
- Cloudflare Turnstile integrado visualmente.
- Cloudflare Turnstile validado no backend.
- Login completo testado com sucesso.

Estado atual:
```text
Turnstile
✅ frontend
✅ envio do token
✅ backend
✅ Siteverify
✅ JWT
✅ acesso ao Dashboard
```

---

## 48. PRÓXIMA TAREFA
Ao iniciar nova sessão, começar daqui:
```text
Implementar reset/renovação automática do Cloudflare Turnstile quando uma tentativa de login falhar.
```

Antes de mudar código, ler:
```text
frontend/src/features/auth/components/TurnstileWidget.tsx
frontend/src/features/auth/components/LoginForm.tsx
```

Objetivo:
```text
falhou login
↓
invalidar token atual
↓
resetar Turnstile
↓
obter novo token
↓
permitir nova tentativa
```

Preservar integralmente o layout atual.

---

## 49. Instrução final
Antes de qualquer alteração no Cfit:
```text
Leia AGENTS.md.
Leia os arquivos envolvidos.
Faça somente a alteração solicitada.
Preserve o que já funciona.
Teste antes de considerar concluído.
```
