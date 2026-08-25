# Infraestrutura do Cfit

## Desenvolvimento

```text
Navegador
├─ :5173 → Vite/React
└─ :8000 → Django/DRF
              └─ postgres:5432
```

O `docker-compose.yml` contém:

- `postgres`: PostgreSQL 17 com volume `postgres_data`;
- `django`: backend montado em `/app`;
- `frontend`: aplicação React montada em `/frontend`.

## Produção esperada

```text
Internet
  └─ HTTPS / reverse proxy
       ├─ frontend estático
       └─ Django
            └─ PostgreSQL

Serviços gerenciados/externos
  ├─ armazenamento de backup
  ├─ SMTP e WhatsApp
  ├─ gateway de pagamentos
  ├─ Cloudflare Turnstile
  └─ monitoramento e alertas
```

O repositório ainda não define uma plataforma definitiva de hospedagem, reverse proxy ou scheduler. Redis e Celery não fazem parte da stack atual; só devem ser introduzidos quando houver uma necessidade operacional concreta.

## Requisitos de produção

- HTTPS e headers seguros;
- secrets fora da imagem e do repositório;
- PostgreSQL com backup externo e restauração testada;
- execução programada das rotinas financeiras e operacionais;
- logs estruturados correlacionáveis por `X-Request-ID`;
- alertas de indisponibilidade, falha de tarefas e integrações;
- política de retenção e privacidade;
- rollback de aplicação separado de rollback de dados.

Consulte [Operação em produção](../operacao-producao.md) e [Homologação](../homologacao-final.md).
