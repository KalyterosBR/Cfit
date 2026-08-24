import logging
import uuid

logger = logging.getLogger("cfit.requests")


class RequestIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        try:
            response = self.get_response(request)
        except Exception:
            logger.exception("Unhandled request error", extra={"request_id": request.request_id, "path": request.path})
            raise
        response["X-Request-ID"] = request.request_id
        return response
