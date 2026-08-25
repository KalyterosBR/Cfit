# Convenções do frontend

## Stack e execução

React 19, TypeScript, Vite, Tailwind CSS, Base UI/shadcn, React Router, Axios, Recharts, Lucide e react-hot-toast.

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm test
docker compose exec frontend npm run build
```

## Organização

- `components/`: elementos realmente compartilhados;
- `features/`: componentes, hooks, serviços e tipos de um domínio;
- `pages/`: composição dos módulos principais;
- `layouts/`: estrutura persistente da aplicação;
- `routes/`: registro, lazy loading e proteção;
- `services/`: infraestrutura HTTP e feedback.

Use o alias `@/`. Evite criar uma segunda implementação de autenticação, tokens, toast, modal ou tema.

## Dados e regras

- O backend é a fonte de regras e autorização.
- Serviços de frontend encapsulam contratos HTTP; páginas não devem recalcular regras financeiras.
- Estados devem distinguir carregando, vazio real, vazio por filtro, erro, sem permissão e indisponível.
- Filtros e paginação devem permanecer estáveis durante atualização quando possível.

## Tema

Use tokens semânticos e padrões definidos em `index.css`. Não espalhe novos hexadecimais para superfícies internas quando um token existente resolver.

O tema inicial é aplicado em `index.html` antes da renderização. A preferência `cfit_theme` aceita `light` ou `dark`; a preferência do sistema vale apenas sem escolha salva. Não introduza atrasos artificiais ou transições durante o bootstrap.

## Carregamento

Use `AsyncState.tsx`:

- `AppBootSkeleton` para o boot autenticado;
- `ModuleSkeleton` para módulos lazy;
- `CardSkeleton`, `TableSkeleton`, `DetailSkeleton` e `FormSkeleton` conforme a geometria;
- `ErrorState`, `EmptyState`, `FilteredEmptyState`, `PermissionState` e `UnavailableState` para estados finais.

Skeletons são decorativos, ficam ocultos para leitores de tela e acompanham um estado textual acessível.

## Acessibilidade

- Botões apenas com ícone exigem `aria-label`.
- Menus, listboxes e opções informam expansão/seleção.
- Foco por teclado deve permanecer visível.
- Não represente estado somente por cor ou glow.
- Modais e elementos flutuantes precisam de fechamento previsível.
- Respeite `prefers-reduced-motion`.

## Responsividade

Valide desktop amplo, notebook, tablet e móvel. Evite overflow horizontal acidental, controles cortados, rodapé de modal cobrindo campos e skeleton maior que o contêiner. Tabelas que precisam de largura mínima devem usar contêiner de rolagem explícito.

## Preferências locais

Preferências visuais podem usar `localStorage` quando o escopo é claramente pessoal e local. Elas nunca podem conceder capacidade ou revelar rota proibida. Chaves atuais incluem tema, favoritos da Sidebar, colunas de alunos, visão do Dashboard, seções ocultas e relatórios salvos.
