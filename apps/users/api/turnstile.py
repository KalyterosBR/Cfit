import os

import requests


TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def validate_turnstile(token: str) -> bool:
    secret_key = os.getenv(
        "TURNSTILE_SECRET_KEY",
    )

    if not secret_key:
        return False

    if not token:
        return False

    try:
        response = requests.post(
            TURNSTILE_VERIFY_URL,
            data={
                "secret": secret_key,
                "response": token,
            },
            timeout=5,
        )

        response.raise_for_status()

        data = response.json()

        return bool(
            data.get("success"),
        )

    except requests.RequestException:
        return False
