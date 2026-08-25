# Padrões de desenvolvimento

## Idioma e nomenclatura

- código, campos e contratos internos em inglês;
- documentação e textos da interface em português;
- Python: `snake_case` para arquivos, funções e variáveis; `PascalCase` para classes;
- React: componentes e tipos em `PascalCase`, hooks iniciados por `use`, demais símbolos em `camelCase`;
- nomes devem refletir o domínio, não detalhes temporários da interface.

## Forma de trabalhar

1. leia `AGENTS.md` e os arquivos envolvidos;
2. identifique a causa ou lacuna;
3. faça a menor alteração coerente;
4. preserve comportamento existente;
5. teste proporcionalmente ao risco;
6. atualize documentação durável quando necessário.

Evite refactors espontâneos, abstrações sem uso real e alterações de muitos arquivos para um problema simples.

## Qualidade

- backend é fonte de regra, autorização e escopo;
- nenhuma regra financeira deve existir apenas no frontend;
- ações sensíveis devem ser confirmadas, autorizadas e auditáveis;
- carregamento, vazio, erro e sem permissão são estados diferentes;
- código novo deve ser legível antes de ser compacto;
- migrações e integrações exigem testes específicos.

## Git

- preserve alterações locais do usuário;
- não versione `.env`, secrets, builds ou arquivos temporários;
- use mensagens de commit claras;
- revise `git diff --check` e `git status`;
- não execute commit ou push sem autorização no fluxo em uso.
