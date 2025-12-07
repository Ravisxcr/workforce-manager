import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.base import Base, TimestampMixin


# Employee table with references to admin (creator) and manager
class Employee(Base, TimestampMixin):
    __tablename__ = "employees"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    dob = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    date_joined = Column(Date, nullable=True)
    salary = Column(String, nullable=True)
    # Reference to admin who created this employee
    created_by_admin_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_by_admin = relationship(
        "User", foreign_keys=[created_by_admin_id], backref="created_employees"
    )
    # Reference to manager (also a user)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    manager = relationship(
        "User", foreign_keys=[manager_id], backref="managed_employees"
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class IdCard(Base, TimestampMixin):
    __tablename__ = "id_cards"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    department = Column(String, nullable=False)
    issue_date = Column(String, nullable=False)
    expiry_date = Column(String, nullable=False)
    card_number = Column(String, unique=True, nullable=False)


# Document table for upload, verification, audit, and approval tracking
class Document(Base, TimestampMixin):
    __tablename__ = "documents"
    __table_args__ = (
        UniqueConstraint(
            "employee_id", "document_type", name="uq_employee_document_type"
        ),
    )
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    status = Column(String, default="pending")
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    comment = Column(String, nullable=True)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
