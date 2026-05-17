"""Portable column types that work on both PostgreSQL and SQLite.

SQLite doesn't support JSONB or native UUID types. These type decorators
transparently switch behavior based on the dialect:
- PostgreSQL: uses native JSONB and UUID types
- SQLite: uses JSON and CHAR(36) for tests
"""

import uuid

from sqlalchemy import JSON, String, TypeDecorator
from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class JSONB(TypeDecorator):
    """Uses PostgreSQL JSONB when available, falls back to JSON."""

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_JSONB())
        return dialect.type_descriptor(JSON())


class UUID(TypeDecorator):
    """Uses PostgreSQL UUID when available, falls back to CHAR(36)."""

    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)
