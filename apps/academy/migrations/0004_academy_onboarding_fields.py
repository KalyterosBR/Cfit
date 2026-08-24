from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("academy", "0003_academyoperationalsettings")]

    operations = [
        migrations.AddField(model_name="academy", name="establishment_type", field=models.CharField(blank=True, choices=[("gym", "Academia"), ("studio", "Estúdio"), ("crossfit", "Cross training"), ("functional", "Treinamento funcional"), ("martial_arts", "Artes marciais"), ("swimming", "Natação"), ("club", "Clube ou centro esportivo"), ("other", "Outro")], max_length=30)),
        migrations.AddField(model_name="academy", name="size_range", field=models.CharField(blank=True, choices=[("up_to_100", "Até 100 alunos"), ("101_300", "101 a 300 alunos"), ("301_700", "301 a 700 alunos"), ("701_1500", "701 a 1.500 alunos"), ("above_1500", "Mais de 1.500 alunos")], max_length=20)),
        migrations.AddField(model_name="academy", name="primary_goal", field=models.CharField(blank=True, choices=[("organize", "Organizar a operação"), ("grow", "Atrair e converter mais alunos"), ("retain", "Aumentar retenção"), ("finance", "Melhorar o controle financeiro"), ("access", "Automatizar controle de acesso")], max_length=30)),
        migrations.AddField(model_name="academy", name="onboarding_completed_at", field=models.DateTimeField(blank=True, null=True)),
    ]
