from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.academy.models import Academy, Unit
from apps.enrollments.models import Enrollment
from apps.operations.models import ClassBooking, GroupClass
from apps.plans.models import Plan
from apps.students.models import Student
from apps.users.models import AdministrativeAudit, User


class PortalActionTests(APITestCase):
    url = "/api/users/portal/me/"

    def setUp(self):
        self.academy = Academy.objects.create(name="Academia teste")
        self.unit = Unit.objects.create(academy=self.academy, name="Centro", code="centro")
        self.user = User.objects.create_user(email="portal-actions@cfit.test", password="Teste123!", is_student_portal=True)
        self.student = Student.objects.create(name="Aluno", cpf="12345678901", academy=self.academy, unit=self.unit, portal_user=self.user)
        self.teacher = User.objects.create_user(email="teacher-actions@cfit.test", password="Teste123!")
        self.group = GroupClass.objects.create(academy=self.academy, unit=self.unit, instructor=self.teacher,
            title="Mobilidade", modality="Mobilidade", starts_at=timezone.now() + timedelta(days=1),
            ends_at=timezone.now() + timedelta(days=1, hours=1), capacity=1)
        self.client.force_authenticate(self.user)

    def book(self):
        return self.client.post(self.url, {"operation": "book_class", "class_id": str(self.group.pk)}, format="json")

    def cancel(self, booking):
        return self.client.post(self.url, {"operation": "cancel_booking", "booking_id": str(booking.pk)}, format="json")

    def other_student(self):
        return Student.objects.create(name="Outro aluno", cpf="98765432100", academy=self.academy, unit=self.unit)

    def test_repeated_booking_keeps_confirmed_place(self):
        self.assertEqual(self.book().status_code, 201)
        repeated = self.book()
        self.assertEqual(repeated.status_code, 200)
        self.assertEqual(repeated.data["status"], "confirmed")
        self.assertEqual(self.group.bookings.count(), 1)
        self.assertEqual(AdministrativeAudit.objects.filter(action="class_booking.reserved").count(), 1)

    def test_full_class_waitlists_and_confirmed_cancellation_promotes_once(self):
        first = ClassBooking.objects.create(group_class=self.group, student=self.other_student())
        self.assertEqual(self.book().data["status"], "waitlist")
        self.student.portal_user = None
        self.student.save()
        first.student.portal_user = self.user
        first.student.save()
        self.assertEqual(self.cancel(first).status_code, 200)
        waiting = self.group.bookings.exclude(pk=first.pk).get()
        self.assertEqual(waiting.status, "confirmed")
        self.assertEqual(self.cancel(first).status_code, 200)
        self.assertEqual(AdministrativeAudit.objects.filter(action="class_booking.promoted").count(), 1)

    def test_cancel_waitlist_does_not_promote_other_waiting_student(self):
        ClassBooking.objects.create(group_class=self.group, student=self.other_student())
        own = ClassBooking.objects.create(group_class=self.group, student=self.student, status="waitlist")
        third = Student.objects.create(name="Terceiro", cpf="11122233344", academy=self.academy, unit=self.unit)
        waiting = ClassBooking.objects.create(group_class=self.group, student=third, status="waitlist")
        self.assertEqual(self.cancel(own).status_code, 200)
        waiting.refresh_from_db()
        self.assertEqual(waiting.status, "waitlist")

    def test_started_or_canceled_class_cannot_be_booked(self):
        for values in ({"starts_at": timezone.now() - timedelta(minutes=1)}, {"canceled": True}, {"status": "inactive"}):
            GroupClass.objects.filter(pk=self.group.pk).update(**values)
            self.assertEqual(self.book().status_code, 400)
        self.assertFalse(self.group.bookings.exists())

    def test_other_unit_and_other_students_booking_are_inaccessible(self):
        own = ClassBooking.objects.create(group_class=self.group, student=self.other_student())
        self.assertEqual(self.cancel(own).status_code, 404)
        other = Unit.objects.create(academy=self.academy, name="Sul", code="sul")
        self.group.unit = other
        self.group.save()
        self.assertEqual(self.book().status_code, 404)

    def test_invalid_identifier_is_validation_error(self):
        response = self.client.post(self.url, {"operation": "book_class", "class_id": "invalid"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_agenda_keeps_upcoming_class_when_there_are_many_old_classes(self):
        for days in range(2, 24):
            GroupClass.objects.create(academy=self.academy, unit=self.unit, instructor=self.teacher,
                title="Aula anterior", modality="Mobilidade", starts_at=timezone.now() - timedelta(days=days),
                ends_at=timezone.now() - timedelta(days=days, hours=-1), capacity=1)
        self.book()
        data = self.client.get(self.url).data["classes"]
        self.assertEqual(len(data), 21)
        self.assertEqual(data[0]["id"], self.group.pk)
        self.assertEqual(data[0]["confirmed_count"], 1)
        self.assertEqual(data[0]["my_booking"]["status"], "confirmed")

    def test_contact_update_preserves_identity_and_is_audited(self):
        response = self.client.patch(self.url, {"phone": "(11) 99999-1234", "emergency_contact": "Contato", "emergency_phone": "1133334444"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.student.refresh_from_db()
        self.assertEqual(self.student.phone, "(11) 99999-1234")
        self.assertEqual(self.student.name, "Aluno")
        self.assertTrue(AdministrativeAudit.objects.filter(action="student.portal_contacts_updated", actor=self.user).exists())
        data = self.client.get(self.url).data["student"]
        self.assertEqual(data["emergency_contact"], "Contato")

    def test_invalid_contacts_and_protected_fields_do_not_mutate(self):
        for payload in ({"phone": "invalid"}, {"phone": "123"}, {"emergency_contact": "x" * 101}, {"name": "Alterado"}, {"cpf": "other"}, {}):
            self.assertEqual(self.client.patch(self.url, payload, format="json").status_code, 400)
        self.student.refresh_from_db()
        self.assertIsNone(self.student.phone)
        self.assertEqual(self.student.name, "Aluno")

    def test_membership_exposes_contract_values_not_current_plan_price(self):
        plan = Plan.objects.create(academy=self.academy, name="Anual", price="1200.00", duration_months=12)
        Enrollment.objects.create(student=self.student, plan=plan, contracted_price="900.00", start_date=timezone.localdate(),
            due_date=timezone.localdate(), status="frozen", frozen_until=timezone.localdate() + timedelta(days=5),
            contract_snapshot={"duration_months": 10, "benefits": "Benefício contratado"})
        item = self.client.get(self.url).data["enrollments"][0]
        self.assertEqual(item["contracted_price"], "900.00")
        self.assertEqual(item["duration_months"], 10)
        self.assertEqual(item["benefits"], "Benefício contratado")
        self.assertEqual(item["status"], "frozen")
        self.assertIsNotNone(item["frozen_until"])

    def test_manager_and_anonymous_cannot_update_student_portal(self):
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.patch(self.url, {"phone": "11999991234"}, format="json").status_code, 403)
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.post(self.url, {"operation": "book_class", "class_id": str(self.group.pk)}, format="json").status_code, 401)
