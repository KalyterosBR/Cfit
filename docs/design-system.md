# Design system do Cfit

## Identidade

**Tecnologia + Performance + Gestão Premium**.

O Cfit deve parecer uma plataforma de performance da academia, não um template SaaS genérico. Priorize controle, clareza, organização e confiança. Evite excesso de cards iguais, pills, gradientes, glow e referências visuais de musculação/suplementos.

## Fundação visual

- fonte: Geist Variable;
- ícones: Lucide React;
- ações: azul elétrico;
- assinatura tecnológica: ciano;
- estrutura premium: azul quase preto;
- superfícies claras: branco gelo;
- largura interna máxima: 1600 px.

Tokens semânticos vivem em `frontend/src/index.css`, incluindo canvas, superfícies, texto, bordas, sombras, divisores, estados de tabela, cores de estado, motion e raios.

## Temas

Os modos claro e escuro devem preservar a mesma hierarquia:

1. fundo da aplicação;
2. Sidebar e Topbar;
3. cartões e tabelas;
4. modais e menus elevados;
5. campos e controles.

Não use branco fixo como divisor no modo escuro. A tabela de alunos aplica `--cfit-table-divider` diretamente em cada linha. `color-scheme` acompanha o tema e a preferência é aplicada antes do primeiro frame.

## Layout autenticado

- Sidebar com 280 px no desktop e drawer sobreposto em telas menores;
- Topbar compacta com contexto, busca, notificações e perfil;
- conteúdo rolável sem scroll concorrente externo;
- Sidebar e Topbar permanecem estáveis durante carregamentos internos.

## Componentes

Reutilize Button, Input, SearchInput, Modal, PageHeader, ConfirmDialog, ThemeToggle e os estados de `AsyncState.tsx`. Novos componentes compartilhados precisam ter contrato claro, acessibilidade e suporte aos dois temas.

## Tabelas e estados

- divisores discretos e abaixo da hierarquia do texto;
- hover, seleção e foco distintos;
- sem zebra clara incompatível com o modo noturno;
- chips semânticos com texto e ponto, nunca apenas cor;
- skeleton com geometria próxima do conteúdo e sem dados simulados.

## Motion

Use movimentos curtos com `--cfit-motion-fast`, `--cfit-motion-base` e `--cfit-motion-ease`. Modais, menus, busca e skeletons respeitam `prefers-reduced-motion`. Não esconda inicialização com atrasos artificiais.

## Acessibilidade e responsividade

- foco visível por teclado;
- nome acessível em botão de ícone;
- contraste nos dois temas;
- estado/seleção não dependem apenas de cor;
- sem overflow acidental ou controles cortados;
- validar desktop amplo, notebook, tablet e móvel.
