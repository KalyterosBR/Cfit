# Decisões arquiteturais

Esta pasta deve receber ADRs somente para decisões que tenham alternativas relevantes, impacto durável e custo de reversão. Decisões operacionais correntes permanecem no `AGENTS.md`; convenções vivem nas páginas temáticas.

## Formato recomendado

```text
# ADR-NNN — Título

Status: proposta | aceita | substituída
Data: AAAA-MM-DD

## Contexto
## Decisão
## Consequências
## Alternativas consideradas
```

## Decisões vigentes já documentadas

- Docker Compose é o ambiente oficial de desenvolvimento.
- O workspace oficial fica no filesystem nativo do WSL.
- Django REST Framework é privado por padrão e usa JWT.
- Turnstile é validado server-side antes do login.
- O backend é a fonte de capacidades e escopo.
- A arquitetura multiunidade evolui incrementalmente com migrações explícitas.
- O tema salvo é aplicado antes da primeira renderização.
- Histórico operacional não deve ser removido destrutivamente.

Crie um ADR futuro quando alguma dessas decisões for substituída, em vez de apagar o contexto anterior.
