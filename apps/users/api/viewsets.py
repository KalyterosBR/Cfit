from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.db import models, transaction
from rest_framework.generics import ListCreateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils import timezone
from django.conf import settings
import secrets

from apps.users.api.turnstile import validate_turnstile
from apps.users.api.serializers import AcademyUserSerializer, AdministrativeAuditSerializer, DashboardPreferenceSerializer, MembershipInviteSerializer, PasswordChangeSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer, SavedReportViewSerializer
from apps.users.models import AcademyUser, AdministrativeAudit, DashboardPreference, OperationalNotificationState, SavedReportView, User
from apps.users.permissions import ROLE_CAPABILITIES, HasCapability, get_active_membership, user_has_capability
from apps.academy.models import Academy
from apps.academy.models import Unit


class TurnstileTokenObtainPairView(
    TokenObtainPairView,
):
    def post(
        self,
        request,
        *args,
        **kwargs,
    ):
        email_key = str(request.data.get("email", "")).strip().lower()
        attempt_key = f"cfit:login-attempts:{request.META.get('REMOTE_ADDR')}:{email_key}"
        if int(cache.get(attempt_key, 0)) >= 5:
            return Response({"detail": "Muitas tentativas de acesso. Aguarde 15 minutos."}, status=429)
        turnstile_token = request.data.get(
            "turnstile_token",
        )

        if not validate_turnstile(
            turnstile_token,
        ):
            return Response(
                {
                    "detail": ("Falha na verificação de segurança."),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email__iexact=request.data.get("email", "")).first()
        if user and user.academy_users.exists() and not user.academy_users.filter(active=True).exists():
            return Response(
                {"detail": "Este acesso foi desativado. Procure o administrador da academia."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user and user.two_factor_enabled:
            authenticated = authenticate(request, email=user.email, password=request.data.get("password"))
            if authenticated:
                cache_key = f"cfit:login-otp:{user.pk}"
                supplied_code = str(request.data.get("two_factor_code", "")).strip()
                expected_code = cache.get(cache_key)
                if not supplied_code:
                    code = f"{secrets.randbelow(1_000_000):06d}"
                    cache.set(cache_key, code, timeout=300)
                    send_mail("Código de acesso do Cfit", f"Seu código de verificação é {code}. Ele expira em 5 minutos.", getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@cfit.local"), [user.email], fail_silently=False)
                    return Response({"detail": "Enviamos um código de verificação para o seu e-mail.", "two_factor_required": True}, status=428)
                if not expected_code or not secrets.compare_digest(supplied_code, expected_code):
                    return Response({"detail": "Código de verificação inválido ou expirado.", "two_factor_required": True}, status=401)
                cache.delete(cache_key)

        response = super().post(
            request,
            *args,
            **kwargs,
        )
        if response.status_code == 200 and response.data.get("access"):
            cache.delete(attempt_key)
            from apps.operations.models import LoginSession
            token = AccessToken(response.data["access"])
            refresh = RefreshToken(response.data["refresh"])
            LoginSession.objects.update_or_create(
                token_jti=str(token["jti"]),
                defaults={"user": user, "refresh_jti": str(refresh["jti"]), "user_agent": request.headers.get("User-Agent", "")[:255], "ip_address": request.META.get("REMOTE_ADDR")},
            )
        elif response.status_code == 401:
            try:
                cache.incr(attempt_key)
            except ValueError:
                cache.set(attempt_key, 1, timeout=900)
        return response


class SessionTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        from apps.operations.models import LoginSession
        try:
            incoming_refresh = RefreshToken(request.data["refresh"])
        except Exception:
            return super().post(request, *args, **kwargs)
        user = User.objects.filter(pk=incoming_refresh["user_id"]).first()
        tracked = LoginSession.objects.filter(user=user, refresh_jti=str(incoming_refresh["jti"])).first() if user else None
        if user and user.login_sessions.exists() and (not tracked or tracked.revoked_at):
            return Response({"detail": "Esta sessão foi encerrada."}, status=401)
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and response.data.get("access"):
            token = AccessToken(response.data["access"])
            if user:
                next_refresh = RefreshToken(response.data.get("refresh", request.data["refresh"]))
                if tracked:
                    tracked.token_jti = str(token["jti"]); tracked.refresh_jti = str(next_refresh["jti"]); tracked.user_agent = request.headers.get("User-Agent", "")[:255]; tracked.ip_address = request.META.get("REMOTE_ADDR"); tracked.save(update_fields=["token_jti", "refresh_jti", "user_agent", "ip_address", "updated_at"])
                else:
                    LoginSession.objects.create(token_jti=str(token["jti"]), refresh_jti=str(next_refresh["jti"]), user=user, user_agent=request.headers.get("User-Agent", "")[:255], ip_address=request.META.get("REMOTE_ADDR"))
        return response


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_student_portal:
            student = getattr(request.user, "portal_student", None)
            if not student:
                return Response({"detail": "Este acesso não está vinculado a um aluno."}, status=403)
            return Response({
                "email": request.user.email,
                "name": student.name,
                "role": "STUDENT",
                "role_label": "Aluno",
                "academy": {"id": student.academy_id, "name": str(student.academy)} if student.academy else None,
                "active_unit": {"id": student.unit_id, "name": student.unit.name} if student.unit else None,
                "units": [],
                "capabilities": ["portal.view"],
                "must_change_password": request.user.must_change_password,
                "two_factor_enabled": request.user.two_factor_enabled,
                "onboarding_completed": True,
            })
        membership = get_active_membership(request.user)
        if request.user.academy_users.exists() and not membership:
            return Response(
                {"detail": "Este acesso foi desativado."},
                status=status.HTTP_403_FORBIDDEN,
            )
        role = AcademyUser.Role.OWNER if request.user.is_superuser else (
            membership.role if membership else AcademyUser.Role.ADMIN
        )
        capabilities = ROLE_CAPABILITIES.get(role, set())
        return Response({
            "email": request.user.email,
            "name": request.user.get_full_name() or request.user.email,
            "role": role,
            "role_label": dict(AcademyUser.Role.choices).get(role),
            "academy": ({"id": membership.academy_id, "name": str(membership.academy)} if membership else None),
            "active_unit": ({"id": membership.active_unit_id, "name": membership.active_unit.name} if membership and membership.active_unit else None),
            "units": ([{"id": unit.id, "name": unit.name} for unit in membership.academy.units.filter(active=True)] if membership else []),
            "capabilities": ["*"] if "*" in capabilities else sorted(capabilities),
            "must_change_password": request.user.must_change_password,
            "two_factor_enabled": request.user.two_factor_enabled,
            "onboarding_completed": bool(membership.academy.onboarding_completed_at) if membership else True,
        })


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.must_change_password = False
        request.user.save(update_fields=["password", "must_change_password"])
        return Response({"detail": "Senha alterada. Entre novamente com a nova senha."})


class ActiveSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.operations.models import LoginSession
        current_jti = str(request.auth.get("jti", "")) if request.auth else ""

        def describe(user_agent):
            browser = "Edge" if "Edg/" in user_agent else "Chrome" if "Chrome/" in user_agent else "Firefox" if "Firefox/" in user_agent else "Safari" if "Safari/" in user_agent else "Navegador desconhecido"
            operating_system = "Android" if "Android" in user_agent else "iOS" if "iPhone" in user_agent or "iPad" in user_agent else "Windows" if "Windows" in user_agent else "macOS" if "Mac OS" in user_agent else "Linux" if "Linux" in user_agent else "Sistema desconhecido"
            return browser, operating_system

        sessions = []
        for item in LoginSession.objects.filter(user=request.user)[:20]:
            browser, operating_system = describe(item.user_agent)
            sessions.append({
                "id": item.id, "browser": browser, "operating_system": operating_system,
                "device_label": f"{browser} em {operating_system}", "is_current": item.token_jti == current_jti,
                "known_device": LoginSession.objects.filter(user=request.user, user_agent=item.user_agent, revoked_at__isnull=True).count() > 1,
                "last_seen_at": item.last_seen_at, "revoked_at": item.revoked_at,
                "technical": {"user_agent": item.user_agent, "ip_address": item.ip_address},
            })
        return Response(sessions)

    def delete(self, request):
        from apps.operations.models import LoginSession
        session = LoginSession.objects.filter(user=request.user, pk=request.data.get("session"), revoked_at__isnull=True).first()
        updated = LoginSession.objects.filter(pk=session.pk).update(revoked_at=timezone.now()) if session else 0
        if updated:
            membership = get_active_membership(request.user)
            AdministrativeAudit.objects.create(academy=membership.academy if membership else None, actor=request.user, action="security.session_revoked", entity_type="login_session", entity_id=str(session.pk), reason="Encerramento solicitado na área de segurança")
        return Response({"revoked": bool(updated)})


class TwoFactorSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = str(request.data.get("password", ""))
        if not request.user.check_password(password):
            return Response({"password": ["Senha atual incorreta."]}, status=400)
        enabled = bool(request.data.get("enabled"))
        request.user.two_factor_enabled = enabled
        request.user.save(update_fields=["two_factor_enabled"])
        membership = get_active_membership(request.user)
        AdministrativeAudit.objects.create(academy=membership.academy if membership else None, actor=request.user, action="security.2fa_updated", entity_type="user", entity_id=str(request.user.id), new_state={"enabled": enabled})
        return Response({"two_factor_enabled": enabled})


class OwnershipTransferView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        actor_membership = get_active_membership(request.user)
        if not actor_membership or actor_membership.role != AcademyUser.Role.OWNER:
            return Response({"detail": "Somente o proprietário pode transferir a propriedade."}, status=403)
        if not request.user.check_password(str(request.data.get("password", ""))):
            return Response({"password": ["Senha atual incorreta."]}, status=400)
        target = AcademyUser.objects.select_for_update().filter(pk=request.data.get("membership"), academy=actor_membership.academy, active=True).exclude(pk=actor_membership.pk).first()
        if not target:
            return Response({"membership": ["Selecione outro usuário ativo da academia."]}, status=400)
        previous = {"owner": request.user.email, "target": target.user.email, "target_role": target.role}
        actor_membership.role = AcademyUser.Role.ADMIN; actor_membership.save(update_fields=["role", "updated_at"])
        target.role = AcademyUser.Role.OWNER; target.save(update_fields=["role", "updated_at"])
        AdministrativeAudit.objects.create(academy=target.academy, actor=request.user, action="ownership.transferred", entity_type="academy_user", entity_id=str(target.id), previous_state=previous, new_state={"owner": target.user.email, "previous_owner_role": "ADMIN"}, reason=str(request.data.get("reason", "Transferência de propriedade"))[:255])
        return Response({"detail": "Propriedade transferida com sucesso.", "owner": target.user.email})


class StudentPortalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.operations.serializers import PhysicalAssessmentSerializer, StudentDocumentSerializer
        from apps.checkins.api.serializers import CheckInSerializer
        from apps.financial.api.serializers import ChargeSerializer
        from apps.financial.models import Charge

        student = getattr(request.user, "portal_student", None)
        if not request.user.is_student_portal or not student:
            return Response({"detail": "Acesso exclusivo do portal do aluno."}, status=403)
        classes = student.unit.group_classes.filter(canceled=False) if student.unit else []
        return Response({
            "student": {"id": student.id, "name": student.name, "email": student.email, "phone": student.phone},
            "enrollments": [{"id": item.id, "plan": item.plan.name, "status": item.status, "start_date": item.start_date} for item in student.enrollments.select_related("plan").all()],
            "charges": ChargeSerializer(Charge.objects.filter(enrollment__student=student).order_by("-due_date")[:20], many=True).data,
            "checkins": CheckInSerializer(student.checkins.all()[:20], many=True).data,
            "assessments": PhysicalAssessmentSerializer(student.physical_assessments.all()[:10], many=True).data,
            "documents": StudentDocumentSerializer(student.documents.all()[:20], many=True).data,
            "workouts": [{"id": item.id, "name": item.name, "objective": item.objective, "review_date": item.review_date, "adherence_percentage": item.progress_records.first().adherence_percentage if item.progress_records.exists() else None, "exercises": [{"name": row.exercise.name, "sets": row.sets, "repetitions": row.repetitions, "load": row.load, "rest_seconds": row.rest_seconds} for row in item.workout_exercises.select_related("exercise").all()]} for item in student.workout_plans.filter(status="active")],
            "classes": [{"id": item.id, "title": item.title, "starts_at": item.starts_at, "location": item.location, "capacity": item.capacity, "confirmed_count": item.bookings.filter(status__in=["confirmed", "attended"]).count(), "my_booking": item.bookings.filter(student=student).values("id", "status").first()} for item in classes.order_by("starts_at")[:20]] if student.unit else [],
        })

    def post(self, request):
        from apps.operations.models import ClassBooking, GroupClass, StudentDocument
        student = getattr(request.user, "portal_student", None)
        if not request.user.is_student_portal or not student:
            return Response({"detail": "Acesso exclusivo do portal do aluno."}, status=403)
        operation = request.data.get("operation")
        if operation == "book_class":
            group_class = GroupClass.objects.filter(pk=request.data.get("class_id"), academy=student.academy, unit=student.unit, canceled=False).first()
            if not group_class:
                return Response({"detail": "Turma indisponível."}, status=404)
            confirmed = group_class.bookings.filter(status__in=["confirmed", "attended"]).count()
            booking, _ = ClassBooking.objects.update_or_create(group_class=group_class, student=student, defaults={"status": "confirmed" if confirmed < group_class.capacity else "waitlist"})
            return Response({"id": booking.id, "status": booking.status}, status=201)
        if operation == "cancel_booking":
            booking = ClassBooking.objects.filter(pk=request.data.get("booking_id"), student=student).select_related("group_class").first()
            if not booking:
                return Response({"detail": "Reserva não encontrada."}, status=404)
            booking.status = "canceled"; booking.save(update_fields=["status", "updated_at"])
            waiting = booking.group_class.bookings.filter(status="waitlist").order_by("created_at").first()
            if waiting:
                waiting.status = "confirmed"; waiting.save(update_fields=["status", "updated_at"])
            return Response({"status": booking.status})
        if operation == "accept_document":
            document = StudentDocument.objects.filter(pk=request.data.get("document_id"), student=student, accepted_at__isnull=True).first()
            if not document:
                return Response({"detail": "Documento indisponível para aceite."}, status=404)
            document.accepted_at = timezone.now(); document.accepted_by_name = student.name; document.acceptance_ip = request.META.get("REMOTE_ADDR")
            document.save(update_fields=["accepted_at", "accepted_by_name", "acceptance_ip", "updated_at"])
            return Response({"accepted_at": document.accepted_at})
        return Response({"operation": ["Operação inválida."]}, status=400)

    def patch(self, request):
        student = getattr(request.user, "portal_student", None)
        if not request.user.is_student_portal or not student:
            return Response({"detail": "Acesso exclusivo do portal do aluno."}, status=403)
        allowed = {key: request.data[key] for key in ["phone", "emergency_contact", "emergency_phone"] if key in request.data}
        for key, value in allowed.items(): setattr(student, key, value)
        student.save(update_fields=[*allowed.keys(), "updated_at"])
        return Response({"detail": "Dados atualizados.", **allowed})


class StudentPortalAccessView(APIView):
    permission_classes = [HasCapability]
    required_capability = "students.manage"

    def post(self, request, student_id):
        from apps.students.models import Student
        membership = get_active_membership(request.user)
        academy = membership.academy if membership else (Academy.objects.first() if request.user.is_superuser else None)
        student = Student.objects.filter(pk=student_id, academy=academy).first()
        if not student:
            return Response({"detail": "Aluno não encontrado."}, status=404)
        email = str(request.data.get("email") or student.email or "").strip().lower()
        password = str(request.data.get("password") or "")
        if not email or len(password) < 8:
            return Response({"detail": "Informe um e-mail e uma senha inicial com pelo menos 8 caracteres."}, status=400)
        user = student.portal_user
        if not user:
            if User.objects.filter(email__iexact=email).exists():
                return Response({"email": ["Este e-mail já está em uso."]}, status=400)
            user = User.objects.create_user(email=email, password=password, first_name=student.name, is_student_portal=True, must_change_password=True)
            student.portal_user = user
            student.save(update_fields=["portal_user", "updated_at"])
        else:
            user.email = email
            user.set_password(password)
            user.is_student_portal = True
            user.must_change_password = True
            user.save(update_fields=["email", "password", "is_student_portal", "must_change_password"])
        return Response({"detail": "Acesso do portal criado. O aluno deverá trocar a senha no primeiro login.", "email": email}, status=201)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"], is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/reset-password?uid={uid}&token={token}"
            context = {"reset_url": reset_url}
            send_mail(
                "Redefina sua senha de acesso ao Cfit",
                render_to_string("users/password_reset_email.txt", context),
                getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@cfit.local"),
                [user.email],
                html_message=render_to_string("users/password_reset_email.html", context),
                fail_silently=True,
            )
        return Response({"detail": "Se o e-mail estiver cadastrado, as instruções serão enviadas."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(serializer.validated_data["uid"])))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if not user or not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response({"detail": "O link de redefinição é inválido ou expirou."}, status=400)
        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        return Response({"detail": "Senha redefinida com sucesso."})


class CurrentUnitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        membership = get_active_membership(request.user)
        if not membership:
            return Response({"detail": "Vínculo com academia não encontrado."}, status=status.HTTP_400_BAD_REQUEST)
        unit = Unit.objects.filter(pk=request.data.get("unit"), academy=membership.academy, active=True).first()
        if not unit:
            return Response({"unit": ["Selecione uma unidade ativa da sua academia."]}, status=status.HTTP_400_BAD_REQUEST)
        membership.active_unit = unit
        membership.save(update_fields=["active_unit", "updated_at"])
        return Response({"id": unit.id, "name": unit.name})


class OperationalNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.automations.models import AutomationExecution
        from apps.checkins.models import CheckIn
        from apps.financial.models import Charge, RecurringPaymentAttempt
        from apps.operations.models import PhysicalAssessment, StudentDocument
        from datetime import timedelta

        membership = get_active_membership(request.user)
        if not membership:
            return Response({"count": 0, "results": []})
        unit = membership.active_unit
        unit_filter = {"unit": unit} if unit else {"student__academy": membership.academy}
        items = []
        overdue = Charge.objects.filter(
            **({"unit": unit} if unit else {"enrollment__student__academy": membership.academy}),
            status=Charge.Status.OVERDUE,
        ).count() if user_has_capability(request.user, "finance.view") or user_has_capability(request.user, "finance.manage") else 0
        if overdue:
            items.append({"id": "overdue", "title": f"{overdue} cobrança(s) vencida(s)", "detail": "Acesse a fila financeira.", "href": "/finance?category=overdue#charges", "severity": "high"})
        rejected = RecurringPaymentAttempt.objects.filter(
            **({"charge__unit": unit} if unit else {"charge__enrollment__student__academy": membership.academy}),
            status=RecurringPaymentAttempt.Status.REJECTED,
        ).count() if user_has_capability(request.user, "finance.view") or user_has_capability(request.user, "finance.manage") else 0
        if rejected:
            items.append({"id": "recurring", "title": f"{rejected} recorrência(s) rejeitada(s)", "detail": "Revise as tentativas de cobrança.", "href": "/finance#recurring", "severity": "high"})
        blocked = CheckIn.objects.filter(**unit_filter, access_result=CheckIn.AccessResult.BLOCKED).count() if user_has_capability(request.user, "checkins.view") or user_has_capability(request.user, "checkins.manage") else 0
        if blocked:
            items.append({"id": "blocked", "title": f"{blocked} acesso(s) bloqueado(s)", "detail": "Consulte causas e equipamentos.", "href": "/checkins?access_result=blocked", "severity": "medium"})
        pending = AutomationExecution.objects.filter(
            rule__academy=membership.academy,
            operational_status__in=["pending", "in_progress"],
        ) if user_has_capability(request.user, "automations.manage") else AutomationExecution.objects.none()
        if unit:
            pending = pending.filter(rule__unit=unit)
        if pending.exists():
            items.append({"id": "automations", "title": f"{pending.count()} automação(ões) pendente(s)", "detail": "Abra a fila operacional.", "href": "/automations", "severity": "medium"})
        assessment_due = PhysicalAssessment.objects.filter(student__academy=membership.academy, next_assessment_at__lte=timezone.localdate()) if user_has_capability(request.user, "students.view") or user_has_capability(request.user, "students.manage") else PhysicalAssessment.objects.none()
        expiring_documents = StudentDocument.objects.filter(student__academy=membership.academy, expires_at__lte=timezone.localdate() + timedelta(days=30)) if user_has_capability(request.user, "students.manage") else StudentDocument.objects.none()
        if unit:
            assessment_due = assessment_due.filter(student__unit=unit); expiring_documents = expiring_documents.filter(student__unit=unit)
        if assessment_due.exists():
            items.append({"id": "assessments", "title": f"{assessment_due.count()} avaliação(ões) vencida(s)", "detail": "Agende a reavaliação dos alunos.", "href": "/operations", "severity": "medium"})
        if expiring_documents.exists():
            items.append({"id": "documents", "title": f"{expiring_documents.count()} documento(s) vencido(s) ou a vencer", "detail": "Revise contratos, atestados e autorizações.", "href": "/documents", "severity": "medium"})
        states = {state.notification_key: state for state in OperationalNotificationState.objects.filter(user=request.user)}
        visible_items = []
        include_archived = request.query_params.get("include_archived") == "true"
        for item in items:
            item_state = states.get(item["id"])
            item["read"] = bool(item_state and item_state.read_at)
            item["archived"] = bool(item_state and item_state.archived_at)
            if include_archived or not item["archived"]:
                visible_items.append(item)
        return Response({"count": len(visible_items), "unread_count": sum(not item["read"] for item in visible_items if not item["archived"]), "archived_count": sum(item["archived"] for item in visible_items), "results": visible_items})

    def patch(self, request):
        notification_key = str(request.data.get("id", "")).strip()
        action = request.data.get("action")
        if not notification_key or action not in {"read", "archive", "restore"}:
            return Response({"detail": "Informe a notificação e uma ação válida."}, status=status.HTTP_400_BAD_REQUEST)
        state_item, _ = OperationalNotificationState.objects.get_or_create(user=request.user, notification_key=notification_key)
        now = timezone.now()
        if action == "read":
            state_item.read_at = now
        elif action == "archive":
            state_item.read_at = state_item.read_at or now
            state_item.archived_at = now
        else:
            state_item.archived_at = None
        state_item.save(update_fields=["read_at", "archived_at", "updated_at"])
        return Response({"id": notification_key, "read": bool(state_item.read_at), "archived": bool(state_item.archived_at)})


class DashboardPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = get_active_membership(request.user)
        if not membership:
            return Response({"hidden_sections": [], "section_order": ["goals", "attention", "indicators"], "source": "default"})
        scoped = DashboardPreference.objects.filter(academy=membership.academy, user__isnull=True, role=membership.role)
        base = scoped.filter(unit=membership.active_unit).first() if membership.active_unit else None
        base = base or scoped.filter(unit__isnull=True).first()
        personal = DashboardPreference.objects.filter(academy=membership.academy, user=request.user).first()
        selected = personal or base
        data = DashboardPreferenceSerializer(selected).data if selected else {"hidden_sections": [], "section_order": ["goals", "attention", "indicators"]}
        return Response({**data, "source": "personal" if personal else "unit_role" if base and base.unit_id else "role" if base else "default"})

    def put(self, request):
        membership = get_active_membership(request.user)
        if not membership:
            return Response({"detail": "Vínculo com academia não encontrado."}, status=status.HTTP_400_BAD_REQUEST)
        target_role = request.data.get("target_role")
        if target_role:
            if membership.role not in {AcademyUser.Role.OWNER, AcademyUser.Role.ADMIN}:
                return Response({"detail": "Somente administradores podem definir padrões por perfil."}, status=status.HTTP_403_FORBIDDEN)
            if target_role not in AcademyUser.Role.values:
                return Response({"target_role": ["Selecione um perfil válido."]}, status=status.HTTP_400_BAD_REQUEST)
            target_unit = None
            if request.data.get("unit"):
                target_unit = Unit.objects.filter(pk=request.data["unit"], academy=membership.academy).first()
                if not target_unit:
                    return Response({"unit": ["Selecione uma unidade da mesma academia."]}, status=status.HTTP_400_BAD_REQUEST)
            preference, _ = DashboardPreference.objects.get_or_create(academy=membership.academy, user=None, role=target_role, unit=target_unit)
            serializer = DashboardPreferenceSerializer(preference, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            AdministrativeAudit.objects.create(academy=membership.academy, actor=request.user, action="dashboard_preference.updated", entity_type="dashboard_preference", entity_id=str(preference.pk), new_state={"role": target_role, "unit": str(target_unit.pk) if target_unit else None, **serializer.data})
            return Response({**serializer.data, "source": "unit_role" if target_unit else "role"})
        preference, _ = DashboardPreference.objects.get_or_create(academy=membership.academy, user=request.user)
        serializer = DashboardPreferenceSerializer(preference, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({**serializer.data, "source": "personal"})

    def delete(self, request):
        membership = get_active_membership(request.user)
        if membership:
            DashboardPreference.objects.filter(academy=membership.academy, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedReportViewList(APIView):
    permission_classes = [HasCapability]
    required_capability = "reports.view"

    def get(self, request):
        membership = get_active_membership(request.user)
        queryset = SavedReportView.objects.filter(academy=membership.academy).filter(
            models.Q(owner=request.user) | models.Q(scope=SavedReportView.Scope.ACADEMY) |
            models.Q(scope=SavedReportView.Scope.UNIT, unit=membership.active_unit)
        ).select_related("owner", "unit")
        return Response(SavedReportViewSerializer(queryset.distinct(), many=True, context={"request": request}).data)

    def post(self, request):
        membership = get_active_membership(request.user)
        serializer = SavedReportViewSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        scope = serializer.validated_data.get("scope", SavedReportView.Scope.PERSONAL)
        unit = membership.active_unit if scope == SavedReportView.Scope.UNIT else None
        if serializer.validated_data.get("is_default"):
            SavedReportView.objects.filter(owner=request.user, is_default=True).update(is_default=False)
        view = serializer.save(academy=membership.academy, owner=request.user, unit=unit)
        AdministrativeAudit.objects.create(academy=membership.academy, actor=request.user, action="report_view.created", entity_type="saved_report_view", entity_id=str(view.pk), new_state={"name": view.name, "scope": view.scope})
        return Response(SavedReportViewSerializer(view, context={"request": request}).data, status=status.HTTP_201_CREATED)


class SavedReportViewDetail(APIView):
    permission_classes = [HasCapability]
    required_capability = "reports.view"

    def get_object(self, request, pk):
        membership = get_active_membership(request.user)
        return SavedReportView.objects.filter(pk=pk, academy=membership.academy, owner=request.user).first()

    def patch(self, request, pk):
        view = self.get_object(request, pk)
        if not view:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = SavedReportViewSerializer(view, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get("is_default"):
            SavedReportView.objects.filter(owner=request.user, is_default=True).exclude(pk=view.pk).update(is_default=False)
        serializer.save(unit=get_active_membership(request.user).active_unit if serializer.validated_data.get("scope", view.scope) == SavedReportView.Scope.UNIT else None)
        return Response(serializer.data)

    def delete(self, request, pk):
        view = self.get_object(request, pk)
        if not view:
            return Response(status=status.HTTP_404_NOT_FOUND)
        AdministrativeAudit.objects.create(academy=view.academy, actor=request.user, action="report_view.deleted", entity_type="saved_report_view", entity_id=str(view.pk), previous_state={"name": view.name, "scope": view.scope})
        view.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AcademyScopedMixin:
    def get_membership(self):
        return get_active_membership(self.request.user)

    def get_academy(self):
        membership = self.get_membership()
        if membership:
            return membership.academy
        return Academy.objects.first() if self.request.user.is_superuser else None


class MembershipListView(AcademyScopedMixin, ListCreateAPIView):
    serializer_class = AcademyUserSerializer
    permission_classes = [HasCapability]
    required_capability = "users.manage"

    def get_queryset(self):
        academy = self.get_academy()
        queryset = AcademyUser.objects.filter(academy=academy).select_related("user", "active_unit") if academy else AcademyUser.objects.none()
        search = self.request.query_params.get("search", "").strip()
        if search: queryset = queryset.filter(models.Q(user__email__icontains=search) | models.Q(user__first_name__icontains=search) | models.Q(user__last_name__icontains=search))
        if self.request.query_params.get("role"): queryset = queryset.filter(role=self.request.query_params["role"])
        if self.request.query_params.get("active") in {"true", "false"}: queryset = queryset.filter(active=self.request.query_params["active"] == "true")
        if self.request.query_params.get("unit"): queryset = queryset.filter(active_unit_id=self.request.query_params["unit"])
        role_order = models.Case(
            models.When(role=AcademyUser.Role.OWNER, then=0),
            models.When(role=AcademyUser.Role.ADMIN, then=1),
            models.When(role=AcademyUser.Role.MANAGER, then=2),
            models.When(role=AcademyUser.Role.RECEPTION, then=3),
            models.When(role=AcademyUser.Role.TRAINER, then=4),
            models.When(role=AcademyUser.Role.FINANCIAL, then=5),
            default=6,
            output_field=models.IntegerField(),
        )
        return queryset.order_by(role_order, "user__first_name", "user__last_name", "user__email")

    def get_serializer_class(self):
        return MembershipInviteSerializer if self.request.method == "POST" else AcademyUserSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        academy = self.get_academy()
        data = serializer.validated_data
        actor_membership = self.get_membership()
        if data["role"] == AcademyUser.Role.OWNER and actor_membership and actor_membership.role != AcademyUser.Role.OWNER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Somente um proprietário pode criar outro proprietário.")
        unit = data.get("active_unit")
        if unit and unit.academy_id != academy.id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"active_unit": "Selecione uma unidade da mesma academia."})
        names = data["name"].strip().split(maxsplit=1)
        user = User.objects.create_user(
            email=data["email"], password=data["password"], first_name=names[0], must_change_password=True,
            last_name=names[1] if len(names) > 1 else "",
        )
        membership = AcademyUser.objects.create(
            academy=academy, user=user, role=data["role"], active_unit=unit,
        )
        AdministrativeAudit.objects.create(
            academy=academy, actor=self.request.user, action="membership.invited",
            entity_type="academy_user", entity_id=str(membership.pk),
            new_state={"email": user.email, "role": membership.role, "unit": str(unit.pk) if unit else None},
        )


class MembershipDetailView(AcademyScopedMixin, RetrieveUpdateDestroyAPIView):
    serializer_class = AcademyUserSerializer
    permission_classes = [HasCapability]
    required_capability = "users.manage"
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        academy = self.get_academy()
        return AcademyUser.objects.filter(academy=academy).select_related("user") if academy else AcademyUser.objects.none()

    def perform_update(self, serializer):
        membership = self.get_object()
        requested_role = serializer.validated_data.get("role", membership.role)
        actor = self.get_membership()
        if requested_role == AcademyUser.Role.OWNER and actor and actor.role != AcademyUser.Role.OWNER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Somente um proprietário pode promover usuários a proprietário.")
        if membership.user_id == self.request.user.id and serializer.validated_data.get("active") is False:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"active": "Você não pode desativar o próprio acesso."})
        previous = {"role": membership.role, "active": membership.active}
        updated = serializer.save()
        AdministrativeAudit.objects.create(
            academy=updated.academy,
            actor=self.request.user,
            action="membership.updated",
            entity_type="academy_user",
            entity_id=str(updated.pk),
            previous_state=previous,
            new_state={"role": updated.role, "active": updated.active},
            reason=self.request.data.get("reason", ""),
        )

    @transaction.atomic
    def perform_destroy(self, membership):
        if membership.user_id == self.request.user.id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Você não pode remover o próprio acesso."})
        if membership.role == AcademyUser.Role.OWNER:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Transfira a propriedade antes de remover este acesso."})
        previous = {"email": membership.user.email, "role": membership.role, "active": membership.active}
        membership.active = False
        membership.active_unit = None
        membership.save(update_fields=["active", "active_unit", "updated_at"])
        from apps.operations.models import LoginSession
        LoginSession.objects.filter(user=membership.user, revoked_at__isnull=True).update(revoked_at=timezone.now())
        AdministrativeAudit.objects.create(
            academy=membership.academy,
            actor=self.request.user,
            action="membership.removed",
            entity_type="academy_user",
            entity_id=str(membership.pk),
            previous_state=previous,
            new_state={"email": membership.user.email, "role": membership.role, "active": False},
            reason="Acesso removido nas configurações",
        )


class AdministrativeAuditListView(AcademyScopedMixin, ListAPIView):
    serializer_class = AdministrativeAuditSerializer
    permission_classes = [HasCapability]
    required_capability = "audit.view"

    def get_queryset(self):
        academy = self.get_academy()
        if not academy:
            return AdministrativeAudit.objects.none()
        queryset = AdministrativeAudit.objects.filter(academy=academy).select_related("actor")
        if self.request.query_params.get("actor"):
            queryset = queryset.filter(actor__email__icontains=self.request.query_params["actor"])
        if self.request.query_params.get("action"):
            queryset = queryset.filter(action=self.request.query_params["action"])
        if self.request.query_params.get("entity_type"):
            queryset = queryset.filter(entity_type=self.request.query_params["entity_type"])
        if self.request.query_params.get("date_from"):
            queryset = queryset.filter(created_at__date__gte=self.request.query_params["date_from"])
        if self.request.query_params.get("date_to"):
            queryset = queryset.filter(created_at__date__lte=self.request.query_params["date_to"])
        return queryset
