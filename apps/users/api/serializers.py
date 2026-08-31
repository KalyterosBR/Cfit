from rest_framework import serializers

from apps.academy.models import Unit
from apps.users.models import AcademyUser, AdministrativeAudit, DashboardPreference, SavedReportView, User


class DashboardPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardPreference
        fields = ["hidden_sections", "section_order"]

    def validate_hidden_sections(self, value):
        allowed = {"goals", "attention", "indicators"}
        if not isinstance(value, list) or any(item not in allowed for item in value):
            raise serializers.ValidationError("Informe somente seções válidas.")
        return list(dict.fromkeys(value))

    def validate_section_order(self, value):
        allowed = {"goals", "attention", "indicators"}
        if not isinstance(value, list) or set(value) != allowed or len(value) != len(allowed):
            raise serializers.ValidationError("Informe todas as seções uma única vez.")
        return value


class SavedReportViewSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    editable = serializers.SerializerMethodField()

    class Meta:
        model = SavedReportView
        fields = ["id", "name", "period", "favorite_questions", "is_default", "scope", "unit", "owner_name", "editable"]
        read_only_fields = ["id", "owner_name", "editable"]

    def get_owner_name(self, obj):
        return obj.owner.get_full_name() or obj.owner.email

    def get_editable(self, obj):
        return obj.owner_id == self.context["request"].user.id

    def validate_period(self, value):
        from datetime import date
        try:
            date.fromisoformat(f"{value}-01")
        except ValueError as error:
            raise serializers.ValidationError("Informe o período no formato AAAA-MM.") from error
        return value


class AcademyUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.SerializerMethodField()
    role_label = serializers.CharField(source="get_role_display", read_only=True)
    reason = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)

    class Meta:
        model = AcademyUser
        fields = ["id", "email", "name", "role", "role_label", "active", "active_unit", "joined_at", "reason"]
        read_only_fields = ["id", "email", "name", "role_label", "joined_at"]

    def validate_active_unit(self, unit):
        if unit and self.instance and unit.academy_id != self.instance.academy_id:
            raise serializers.ValidationError("Selecione uma unidade da mesma academia.")
        return unit

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def validate(self, attrs):
        if self.instance:
            changed = any(
                field in attrs and attrs[field] != getattr(self.instance, field)
                for field in ("role", "active", "active_unit")
            )
            if changed and not str(attrs.get("reason", "")).strip():
                raise serializers.ValidationError({"reason": "Informe o motivo desta alteração."})
        return attrs

    def update(self, instance, validated_data):
        validated_data.pop("reason", None)
        return super().update(instance, validated_data)


class MembershipInviteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=AcademyUser.Role.choices)
    active_unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.filter(active=True), required=False, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Já existe um usuário com este e-mail.")
        return value.lower()


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("A senha atual está incorreta.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)


class AdministrativeAuditSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)
    action_label = serializers.SerializerMethodField()
    entity_label = serializers.SerializerMethodField()
    changes = serializers.SerializerMethodField()

    ACTION_LABELS = {
        "academy.onboarding_completed": "Configuração inicial concluída",
        "academy.updated": "Dados da academia atualizados",
        "settings.updated": "Configurações operacionais atualizadas",
        "unit.created": "Unidade cadastrada",
        "unit.updated": "Unidade atualizada",
        "membership.invited": "Usuário convidado",
        "membership.updated": "Usuário e permissões alterados",
        "ownership.transferred": "Propriedade transferida",
        "charge.payment_registered": "Pagamento registrado",
        "charge.reconciled": "Cobrança conciliada",
        "charge.canceled": "Cobrança cancelada",
        "financial.inconsistency_updated": "Tratativa financeira atualizada",
        "student.created": "Aluno cadastrado",
        "student.updated": "Cadastro do aluno atualizado",
        "student.interaction_created": "Interação com aluno registrada",
        "enrollment.created": "Matrícula criada",
        "plan.created": "Plano cadastrado",
        "plan.updated": "Plano atualizado",
        "checkin.created": "Check-in registrado",
        "access_policy.updated": "Política de acesso atualizada",
        "access_device.created": "Dispositivo de acesso cadastrado",
        "schedule.created": "Evento de agenda criado",
        "automation.created": "Automação criada",
        "automation.duplicated": "Automação duplicada",
        "automation.execution_updated": "Execução da automação atualizada",
        "automation.updated": "Automação atualizada",
        "automation.paused": "Automação pausada",
        "automation.resumed": "Automação retomada",
        "document.created": "Documento criado",
        "document.archived": "Documento arquivado",
        "document.renewed": "Documento renovado",
        "campaign.segment_created": "Segmento de campanha criado",
        "access_device.updated": "Dispositivo de acesso atualizado",
        "group_class.created": "Turma criada",
        "group_class.updated": "Turma atualizada",
        "group_class.canceled": "Turma cancelada",
        "group_class.deactivated": "Turma desativada",
        "group_class.duplicated": "Turma duplicada",
        "group_class.replacement_created": "Reposição de turma criada",
        "group_class.booking_updated": "Inscrição na turma atualizada",
        "group_class.attendance_updated": "Chamada da turma atualizada",
        "lead.created": "Oportunidade comercial criada",
        "lead.updated": "Oportunidade comercial atualizada",
        "lead.converted": "Oportunidade convertida em aluno",
        "lead.associated": "Oportunidade associada a um aluno",
        "lead.interaction_created": "Interação comercial registrada",
        "lead.proposal_created": "Proposta comercial criada",
        "operational_issue.updated": "Pendência operacional atualizada",
        "physical_assessment.created": "Avaliação física registrada",
        "physical_assessment.updated": "Avaliação física atualizada",
        "schedule.updated": "Evento da agenda atualizado",
        "schedule.canceled": "Evento da agenda cancelado",
        "goal.revenue_updated": "Meta de receita atualizada",
        "goal.checkins_updated": "Meta de check-ins atualizada",
        "goal.active_students_updated": "Meta de alunos ativos atualizada",
        "security.2fa_updated": "Verificação em duas etapas alterada",
        "security.session_revoked": "Sessão encerrada",
        "report_view.created": "Visão de relatório criada",
        "report_view.deleted": "Visão de relatório excluída",
        "dashboard_preference.updated": "Padrão do Dashboard atualizado",
    }
    ENTITY_LABELS = {
        "academy": "Academia", "academy_user": "Usuário", "charge": "Cobrança",
        "membership": "Matrícula", "student": "Aluno", "access_device": "Dispositivo",
        "login_session": "Sessão", "user": "Usuário", "unit": "Unidade", "saved_report_view": "Visão de relatório",
        "access_policy": "Política de acesso", "checkin": "Check-in", "dashboard_preference": "Preferência do Dashboard",
        "schedule_event": "Evento da agenda", "automation_rule": "Automação",
        "plan": "Plano", "student_document": "Documento", "lead": "Oportunidade",
        "monthly_revenue_goal": "Meta de receita",
        "monthly_checkin_goal": "Meta de check-ins",
        "monthly_active_student_goal": "Meta de alunos ativos",
        "academy_settings": "Configurações da academia",
        "automation_execution": "Execução da automação",
        "campaign_segment": "Segmento de campanha",
        "class_booking": "Inscrição em turma",
        "group_class": "Turma",
        "lead_interaction": "Interação comercial",
        "lead_proposal": "Proposta comercial",
        "operational_issue": "Pendência operacional",
        "physical_assessment": "Avaliação física",
        "cash_transaction": "Movimentação de caixa",
        "reconciliation": "Conciliação financeira",
        "recurring_attempt": "Tentativa de recorrência",
        "enrollment": "Matrícula",
    }
    FIELD_LABELS = {
        "active": "Situação ativa",
        "active_unit": "Unidade ativa",
        "amount": "Valor",
        "assigned_to": "Responsável",
        "attendance_status": "Presença",
        "automations_enabled": "Automações ativas",
        "cancellation_reason": "Motivo do cancelamento",
        "capacity": "Capacidade",
        "due_date": "Vencimento",
        "email": "E-mail",
        "enabled": "Ativação",
        "end_at": "Término",
        "expires_at": "Validade",
        "name": "Nome",
        "next_action": "Próxima ação",
        "next_action_at": "Data da próxima ação",
        "notes": "Observações",
        "owner": "Proprietário",
        "payment_method": "Forma de pagamento",
        "priority": "Prioridade",
        "reason": "Motivo",
        "role": "Perfil de acesso",
        "source": "Origem",
        "stage": "Etapa comercial",
        "start_at": "Início",
        "status": "Situação",
        "target_amount": "Valor da meta",
        "target_count": "Quantidade da meta",
        "title": "Título",
        "two_factor_enabled": "Verificação em duas etapas",
        "unit": "Unidade",
    }

    class Meta:
        model = AdministrativeAudit
        fields = [
            "id", "actor_email", "action", "action_label", "entity_type", "entity_label", "entity_id",
            "previous_state", "new_state", "changes", "reason", "origin", "created_at",
        ]

    def get_action_label(self, obj):
        return self.ACTION_LABELS.get(obj.action, obj.action.replace(".", " · ").replace("_", " ").capitalize())

    def get_entity_label(self, obj):
        return self.ENTITY_LABELS.get(obj.entity_type, obj.entity_type.replace("_", " ").capitalize())

    def get_changes(self, obj):
        hidden_terms = ("password", "secret", "token")
        keys = sorted(set(obj.previous_state) | set(obj.new_state))
        return [{
            "field": self.FIELD_LABELS.get(key, key.replace("_", " ").capitalize()),
            "field_key": key,
            "previous": "••••••" if any(term in key.lower() for term in hidden_terms) else obj.previous_state.get(key),
            "current": "••••••" if any(term in key.lower() for term in hidden_terms) else obj.new_state.get(key),
        } for key in keys]
