"""Error reporting service — receive and log frontend errors."""

import logging

logger = logging.getLogger("frontend_errors")


def report(
    error_type: str,
    message: str,
    stack: str | None,
    context: dict | None,
    user_id: str | None,
) -> None:
    """Log a frontend error.

    In production, this could also forward to Cloud Logging / Sentry / Datadog.
    """
    logger.error(
        "Frontend error | user=%s type=%s message=%s stack=%s context=%s",
        user_id or "anonymous",
        error_type,
        message,
        (stack or "")[:500],
        context or {},
    )
