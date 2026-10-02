from django.conf import settings
from django.db import models


class MobileLoginBucket(models.Model):
    """Persistent limits shared by every serverless instance; keys avoid raw e-mail and IP values."""
    key = models.CharField(max_length=64, primary_key=True)
    count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(db_index=True)


class MobileLoginChallenge(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField(db_index=True)
    sent_at = models.DateTimeField()
