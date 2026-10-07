from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from apps.operations.models import ClassBooking, GroupClass
from apps.users.models import AdministrativeAudit


@transaction.atomic
def update_portal_booking(request, student, operation):
    field = "class_id" if operation == "book_class" else "booking_id"
    identifier = serializers.UUIDField().run_validation(request.data.get(field))
    if not student.active or not student.unit_id or request.user.must_change_password:
        raise ValidationError("A reserva exige aluno ativo, unidade vinculada e senha atualizada.")
    classes = GroupClass.objects.select_for_update().filter(academy=student.academy, unit=student.unit)
    if operation == "book_class":
        group_class = classes.filter(pk=identifier).first()
    else:
        own_booking = ClassBooking.objects.filter(pk=identifier, student=student).first()
        group_class = classes.filter(pk=own_booking.group_class_id).first() if own_booking else None
    if not group_class:
        raise NotFound("Turma ou reserva indisponível.")
    if group_class.canceled or group_class.status != "scheduled" or group_class.starts_at <= timezone.now():
        raise ValidationError("Reservas só podem ser alteradas antes do início de uma turma agendada.")
    booking = ClassBooking.objects.filter(group_class=group_class, student=student).first()
    previous = booking.status if booking else None
    if operation == "book_class":
        # Repeated requests preserve the existing place, including the waitlist position.
        if booking and booking.status in {"confirmed", "waitlist"}:
            return Response({"id": booking.id, "status": booking.status})
        if booking and booking.status in {"attended", "absent"}:
            raise ValidationError("Esta reserva já possui uma presença registrada.")
        confirmed = group_class.bookings.filter(status__in=["confirmed", "attended"]).count()
        booking, _ = ClassBooking.objects.update_or_create(group_class=group_class, student=student,
            defaults={"status": "confirmed" if confirmed < group_class.capacity else "waitlist"})
        if previous == "canceled":
            booking.created_at = timezone.now()
            booking.save(update_fields=["created_at"])
    else:
        if booking.status == "canceled":
            return Response({"id": booking.id, "status": booking.status})
        if booking.status not in {"confirmed", "waitlist"}:
            raise ValidationError("Esta reserva já possui uma presença registrada.")
        booking.status = "canceled"
        booking.save(update_fields=["status", "updated_at"])
        if previous == "confirmed":
            occupied = group_class.bookings.filter(status__in=["confirmed", "attended"]).count()
            waiting = group_class.bookings.filter(status="waitlist").order_by("created_at", "id").first()
            if waiting and occupied < group_class.capacity:
                waiting.status = "confirmed"
                waiting.save(update_fields=["status", "updated_at"])
                AdministrativeAudit.objects.create(academy=student.academy, actor=request.user,
                    action="class_booking.promoted", entity_type="class_booking", entity_id=str(waiting.pk),
                    previous_state={"status": "waitlist"}, new_state={"status": "confirmed"}, origin="portal")
    AdministrativeAudit.objects.create(academy=student.academy, actor=request.user,
        action="class_booking.reserved" if operation == "book_class" else "class_booking.canceled",
        entity_type="class_booking", entity_id=str(booking.pk),
        previous_state={"status": previous}, new_state={"status": booking.status}, origin="portal")
    return Response({"id": booking.id, "status": booking.status}, status=201 if operation == "book_class" else 200)
