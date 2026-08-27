from rest_framework.routers import DefaultRouter

from django.urls import path
from apps.operations.api import AccessDeviceViewSet, CampaignSegmentViewSet, CommunicationCampaignViewSet, CommunicationWebhookView, DeviceCommandView, DeviceWebhookView, GroupClassViewSet, LeadInteractionViewSet, LeadProposalViewSet, LeadViewSet, OnboardingViewSet, OperationalIssueViewSet, PhysicalAssessmentViewSet, StudentDocumentViewSet

router = DefaultRouter()
router.register("devices", AccessDeviceViewSet, basename="access-device")
router.register("campaigns", CommunicationCampaignViewSet, basename="campaign")
router.register("assessments", PhysicalAssessmentViewSet, basename="assessment")
router.register("onboarding", OnboardingViewSet, basename="onboarding")
router.register("leads", LeadViewSet, basename="lead")
router.register("lead-interactions", LeadInteractionViewSet, basename="lead-interaction")
router.register("lead-proposals", LeadProposalViewSet, basename="lead-proposal")
router.register("campaign-segments", CampaignSegmentViewSet, basename="campaign-segment")
router.register("classes", GroupClassViewSet, basename="group-class")
router.register("documents", StudentDocumentViewSet, basename="student-document")
router.register("issues", OperationalIssueViewSet, basename="operational-issue")
urlpatterns = [path("device-events/", DeviceWebhookView.as_view()), path("device-commands/", DeviceCommandView.as_view()), path("communication-events/", CommunicationWebhookView.as_view())] + router.urls
