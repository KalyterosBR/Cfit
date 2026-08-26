#!/usr/bin/env bash
set -eu

if [ "${VERCEL_ENV:-}" = "production" ]; then
    if [ -n "${DATABASE_URL_UNPOOLED:-}" ]; then
        DATABASE_URL="${DATABASE_URL_UNPOOLED}" python manage.py migrate --noinput
    else
        python manage.py migrate --noinput
    fi
    python manage.py bootstrap_superuser
fi

python manage.py collectstatic --noinput
