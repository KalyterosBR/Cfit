# Convenções do backend

## Ambiente

Use o container `django`; não exija instalação local de Python ou PostgreSQL.

```bash
docker compose exec django python manage.py check
docker compose exec django python manage.py makemigrations --check --dry-run
docker compose exec django python manage.py test
```

## Responsabilidades

- **models**: estado persistido, constraints e relacionamentos;
- **serializers**: contrato, validação de entrada e representação;
- **selectors**: consultas reutilizáveis e otimizadas;
- **services**: operações de negócio com efeitos;
- **viewsets/views**: transporte HTTP, autorização e orquestração;
- **tests**: comportamento, escopo, autorização e regressões.

Não mova lógica para uma camada apenas para cumprir uma estrutura teórica. Evite duplicar regra no frontend.

## Modelagem

- Modelos de domínio normalmente herdam de `BaseModel` e usam UUID, `created_at` e `updated_at`.
- Use `PROTECT` quando apagar o relacionado destruiria histórico operacional.
- Use constraints no banco para invariantes críticas.
- Matrículas, cobranças, check-ins e auditorias preservam histórico; exclusão destrutiva não é padrão.
- Novos domínios devem considerar academia e unidade sem assumir que toda tabela histórica já está particionada.

## Segurança

- Todas as APIs são privadas por padrão.
- Valide capacidades no backend e derive o escopo da sessão.
- Nunca registre senhas, JWT, Turnstile, chaves de webhook ou secrets.
- Dados pessoais devem ser mascarados quando a capacidade exigir.
- Webhooks públicos precisam de autenticação própria e idempotência.

## Consultas

Evite N+1 com `select_related` e `prefetch_related`. Paginação e filtros devem acontecer no servidor quando o volume puder crescer. Ordenação deve ser determinística.

## Alterações de banco

1. altere o modelo;
2. gere a migração dentro do container;
3. leia a migração gerada;
4. teste aplicação e compatibilidade dos dados;
5. execute `makemigrations --check --dry-run` no encerramento.

Migrações de unidade ou mudanças de semântica exigem estratégia explícita para dados existentes.

## Testes

Cubra o caminho feliz e, proporcionalmente ao risco:

- autenticação e capacidade;
- isolamento entre academias/unidades;
- validações e conflitos;
- preservação de histórico;
- auditoria;
- idempotência;
- paginação/filtros relevantes.

Não trate simulador de integração externa como homologação física.
