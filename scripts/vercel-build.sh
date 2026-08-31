#!/usr/bin/env bash
set -eu

if [ "${VERCEL_ENV:-}" = "production" ]; then
    # Migre exatamente a mesma conexão que o Django usa em runtime. Usar uma
    # URL alternativa aqui pode atualizar outra branch ou outro banco Neon e
    # publicar código novo sobre um schema antigo.
    python manage.py migrate --noinput
    python manage.py migrate --check
    python manage.py bootstrap_superuser
fi

python manage.py collectstatic --noinput
