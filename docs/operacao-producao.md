# Operação do Cfit em produção

## Verificação de saúde

`GET /api/health/` valida a aplicação e a conexão com o PostgreSQL. Cada resposta também recebe `X-Request-ID`, útil para correlacionar erros com os logs.

## Backup e restauração

Faça backups fora do host da aplicação, criptografados e com retenção definida. Exemplo manual dentro da infraestrutura Docker:

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > cfit.dump
```

Teste a restauração regularmente em uma base isolada; não restaure sobre produção. Antes de atualizações, execute o backup e registre quem o validou.

## Deploy seguro

1. validar testes de backend e build do frontend;
2. criar backup verificado;
3. aplicar migrações com `python manage.py migrate`;
4. verificar `/api/health/`;
5. testar login, criação de aluno, pagamento e check-in;
6. manter uma versão anterior disponível para rollback da aplicação.

## Serviços externos

Credenciais de e-mail, WhatsApp e dispositivos ficam exclusivamente no ambiente. Primeiro use os adaptadores sandbox, depois valide o provedor real em homologação e só então habilite-o em produção.
