# Ambiente de desenvolvimento

## Workspace oficial

```text
/home/kalyteros/projetos/Cfit
```

O desenvolvimento ocorre no filesystem nativo do WSL. A cópia antiga sob `/mnt/c/...` é apenas segurança e não deve receber alterações.

## Pré-requisitos

- Docker com Docker Compose;
- Git;
- VS Code ou editor equivalente.

Python, Node.js e PostgreSQL não precisam ser instalados localmente.

## Variáveis

Crie `.env` na raiz com banco, Django e `TURNSTILE_SECRET_KEY`. Crie `frontend/.env` com `VITE_TURNSTILE_SITE_KEY`. Esses arquivos não são versionados. Nunca coloque a Secret Key do Turnstile no frontend.

## Subida inicial

```bash
docker compose up -d --build
docker compose exec django python manage.py migrate
docker compose exec django python manage.py createsuperuser
```

Serviços:

| Serviço | Endereço |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API Django | `http://localhost:8000/api/` |
| Admin Django | `http://localhost:8000/admin/` |
| PostgreSQL | `localhost:5432` |

Os containers Django e frontend usam `${LOCAL_UID:-1000}:${LOCAL_GID:-1000}` para não criar arquivos como root nos bind mounts.

## Rotina diária

```bash
docker compose up -d
docker compose ps
docker compose logs -f django frontend
```

Ao finalizar apenas os serviços:

```bash
docker compose down
```

Não use `docker compose down -v` sem intenção explícita de apagar o banco local.

## Validação

```bash
docker compose exec django python manage.py check
docker compose exec django python manage.py makemigrations --check --dry-run
docker compose exec django python manage.py test
docker compose exec frontend npm run lint
docker compose exec frontend npm test
docker compose exec frontend npm run build
git diff --check
```

## Git

Antes de editar, confira `git status --short --branch`. Preserve alterações locais existentes. Commit e push só devem ocorrer quando fizerem parte do fluxo autorizado.
