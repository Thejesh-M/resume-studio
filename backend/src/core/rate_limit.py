"""No-op rate limiter for the local single-user app.

The original SaaS used ``slowapi`` (with Redis in production). For a local
desktop app there are no abusive callers and a single user, so rate limits add
no value — we ship a tiny stub that exposes the same ``@limiter.limit(...)``
decorator API and does nothing. Routes don't need to change.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any


class _Limiter:
    def limit(self, _expr: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(fn)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                result = fn(*args, **kwargs)
                if isinstance(result, Awaitable):
                    return await result
                return result

            return async_wrapper

        return decorator


limiter = _Limiter()

# Kept as named constants so callers don't need to change.
LIMIT_TAILORING = "5/minute"
LIMIT_SCORE = "20/minute"
LIMIT_COVER_LETTER = "5/minute"
LIMIT_JOB_RANK = "6/minute"
