from datetime import datetime, time, timedelta

from django.utils import timezone

from apps.automations.models import AutomationExecution
from apps.financial.models import Charge, RecurringPaymentAttempt
from apps.operations.models import AccessDevice, GroupClass, Lead, OperationalIssue, OperationalIssueHistory, StudentDocument
from apps.students.models import Student
from apps.students.selectors import get_student_health_score


def sync_operational_issues(academy, unit=None):
    now = timezone.now()
    specs = []
    charges = Charge.objects.select_related("enrollment__student").filter(enrollment__student__academy=academy, status=Charge.Status.OVERDUE)
    if unit: charges = charges.filter(unit=unit)
    for charge in charges[:200]:
        specs.append(("financial", f"charge:{charge.pk}", charge.unit_id, f"Cobrança vencida · {charge.enrollment.student.name}", charge.description, "Revisar cobrança e iniciar recuperação", "high", timezone.make_aware(datetime.combine(charge.due_date, time.max)), f"/finance?charge={charge.pk}"))
    attempts = RecurringPaymentAttempt.objects.select_related("charge__enrollment__student").filter(charge__enrollment__student__academy=academy, status=RecurringPaymentAttempt.Status.REJECTED)
    if unit: attempts = attempts.filter(charge__unit=unit)
    for item in attempts[:100]: specs.append(("financial", f"recurring:{item.pk}", item.charge.unit_id, f"Recorrência rejeitada · {item.charge.enrollment.student.name}", item.failure_reason[:255], "Revisar meio de pagamento e próxima tentativa", "critical", item.next_retry_at or now, f"/finance?charge={item.charge_id}"))
    devices = AccessDevice.objects.filter(academy=academy, active=True).exclude(status="online")
    if unit: devices = devices.filter(unit=unit)
    for item in devices: specs.append(("access", f"device:{item.pk}", item.unit_id, f"Dispositivo {item.get_status_display().lower()} · {item.name}", item.last_error or "Comunicação requer atenção", "Executar diagnóstico do dispositivo", "critical" if item.status=="error" else "high", now, "/checkins"))
    classes = GroupClass.objects.filter(academy=academy, status=GroupClass.Status.CANCELED, starts_at__gte=now-timedelta(days=1))
    if unit: classes=classes.filter(unit=unit)
    for item in classes[:100]: specs.append(("schedule", f"class:{item.pk}", item.unit_id, f"Turma cancelada · {item.title}", item.starts_at.isoformat(), "Definir reposição ou comunicar alunos", "medium", item.starts_at, f"/growth?class={item.pk}"))
    leads = Lead.objects.filter(academy=academy, next_action_at__lt=now).exclude(stage__in=["won","lost"])
    if unit: leads=leads.filter(unit=unit)
    for item in leads[:100]: specs.append(("commercial", f"lead:{item.pk}", item.unit_id, f"Próxima ação vencida · {item.name}", item.source, "Registrar contato e atualizar próxima ação", "high", item.next_action_at, f"/growth?lead={item.pk}"))
    documents = StudentDocument.objects.select_related("student").filter(student__academy=academy, expires_at__lte=timezone.localdate()+timedelta(days=30))
    if unit: documents=documents.filter(student__unit=unit)
    for item in documents[:100]: specs.append(("documents", f"document:{item.pk}", item.student.unit_id, f"Documento vencendo · {item.student.name}", item.title, "Solicitar renovação do documento", "high" if item.expires_at<timezone.localdate() else "medium", timezone.make_aware(datetime.combine(item.expires_at,time.max)), f"/documents?document={item.pk}"))
    executions = AutomationExecution.objects.select_related("rule").filter(rule__academy=academy, status=AutomationExecution.Status.FAILED)
    if unit: executions=executions.filter(rule__unit=unit)
    for item in executions[:100]: specs.append(("automations", f"execution:{item.pk}", item.rule.unit_id, f"Automação falhou · {item.rule.name}", item.last_error, "Revisar falha e reprocessar com segurança", item.priority, item.due_at or now, f"/automations?execution={item.pk}"))
    students = Student.objects.filter(academy=academy, active=True)
    if unit: students=students.filter(unit=unit)
    for student in students[:200]:
        score=get_student_health_score(student)
        if score["status"]=="risk": specs.append(("retention", f"student:{student.pk}", student.unit_id, f"Aluno em risco · {student.name}", ", ".join(item["label"] for item in score.get("factors",[]))[:255], "Abrir ficha e registrar contato de retenção", "high", now+timedelta(days=1), f"/students/{student.pk}"))
    active_keys=set()
    for source,key,unit_id,title,detail,next_action,priority,due_at,url in specs:
        active_keys.add((source,key)); issue,created=OperationalIssue.objects.update_or_create(academy=academy,source=source,source_key=key,defaults={"unit_id":unit_id,"title":title,"detail":detail,"next_action":next_action,"priority":priority,"due_at":due_at,"source_url":url})
        if created: OperationalIssueHistory.objects.create(issue=issue,event="created",message="Pendência identificada automaticamente.",new_state={"status":issue.status,"priority":issue.priority})
    for issue in OperationalIssue.objects.filter(academy=academy,status__in=["open","in_progress"]):
        if (issue.source,issue.source_key) not in active_keys and issue.source in {"financial","access","schedule","commercial","documents","automations","retention"}:
            issue.status="resolved"; issue.resolved_at=now; issue.resolution="Resolvida automaticamente na origem."; issue.save(update_fields=["status","resolved_at","resolution","updated_at"]); OperationalIssueHistory.objects.create(issue=issue,event="auto_resolved",message=issue.resolution)
