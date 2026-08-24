from rest_framework.routers import DefaultRouter
from django.urls import path

from apps.financial.api.cash_viewsets import CashTransactionViewSet
from apps.financial.api.viewsets import ChargeViewSet
from apps.financial.api.recurring_viewsets import RecurringPaymentAttemptViewSet
from apps.financial.api.revenue_goal_viewsets import MonthlyRevenueGoalViewSet
from apps.financial.api.webhooks import PaymentWebhookView


router = DefaultRouter()

router.register(
    "charges",
    ChargeViewSet,
    basename="charge",
)
router.register(
    "recurring-attempts",
    RecurringPaymentAttemptViewSet,
    basename="recurring-attempt",
)
router.register(
    "cash-transactions",
    CashTransactionViewSet,
    basename="cash-transaction",
)
router.register(
    "revenue-goals",
    MonthlyRevenueGoalViewSet,
    basename="revenue-goal",
)


urlpatterns = [path("payment-events/", PaymentWebhookView.as_view())] + router.urls
