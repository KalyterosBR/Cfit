# Operação do Cfit em produção

## Saúde e observabilidade

`GET /api/health/` verifica aplicação e PostgreSQL. `X-Request-ID` correlaciona respostas e logs. Produção deve alertar indisponibilidade, erro de tarefas, crescimento anormal de falhas e integrações degradadas.

## Rotinas

O repositório fornece comandos, mas não agenda sua execução:

```bash
docker compose exec django python manage.py run_daily_financial
docker compose exec django python manage.py run_operational_tasks
```

A infraestrutura deve definir frequência, exclusão mútua quando necessária, logs e alerta de falha.

## Backup e restauração

Backups devem ficar fora do host, criptografados e com retenção definida. Exemplo manual:

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > cfit.dump
```

O arquivo contém dados sensíveis. Proteja-o, teste restauração em ambiente isolado e registre RPO/RTO. Nunca restaure diretamente sobre produção sem plano aprovado.

## Deploy seguro

1. validar backend, frontend e migrações;
2. gerar e verificar backup;
3. publicar artefato versionado;
4. aplicar migrações compatíveis;
5. verificar `/api/health/`;
6. testar login, aluno, pagamento e check-in;
7. observar logs e métricas;
8. manter rollback da aplicação disponível.

Rollback de código não desfaz automaticamente migração ou alteração de dados.

## Secrets e integrações

Secrets ficam no ambiente/secret manager, nunca no frontend ou repositório. Rotacione chaves de webhook e dispositivo, restrinja acessos e mantenha sandbox separado de produção.

## Incidentes

Preserve request ID, horário, usuário/academia afetada, versão publicada e evidências sem registrar passwords ou tokens. Para incidente de segurança, revogue sessões/chaves e avalie exposição antes de restaurar o serviço.
