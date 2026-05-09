import uuid

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from db.base import Base, TimestampMixin


class Department(Base, TimestampMixin):
    __tablename__ = "departments"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    head_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Designation(Base, TimestampMixin):
    __tablename__ = "designations"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    name = Column(String, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    level = Column(Integer, nullable=True)
