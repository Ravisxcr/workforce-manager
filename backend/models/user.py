import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Enum as SAEnum,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.base import Base, TimestampMixin, IdMixin
from schemas.auth import Role


# Employee table with references to admin (creator) and manager
class Employee(Base, TimestampMixin, IdMixin):
    __tablename__ = "employees"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="employee_profile", foreign_keys=[user_id])
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    dob = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation_id = Column(UUID(as_uuid=True), ForeignKey("designations.id", ondelete="SET NULL"), nullable=True)
    department_rel = relationship("Department", foreign_keys=[department_id])
    designation_rel = relationship("Designation", foreign_keys=[designation_id])
    date_joined = Column(Date, nullable=True)
    salary = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
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

    @property
    def role(self):
        if not self.user or not self.user.role:
            return None
        return self.user.role.value if isinstance(self.user.role, Role) else self.user.role

    @property
    def department(self):
        return self.department_rel.name if self.department_rel else None

    @property
    def designation(self):
        return self.designation_rel.name if self.designation_rel else None


class User(Base, TimestampMixin, IdMixin):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(Role), default=Role.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)

    employee_profile = relationship(
        "Employee", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan",
        foreign_keys="Employee.user_id"
    )
    attendances = relationship("Attendance", back_populates="user", cascade="all, delete-orphan", foreign_keys="Attendance.user_id")
    leaves = relationship("Leave", back_populates="user", cascade="all, delete-orphan", foreign_keys="Leave.user_id")
    reimbursements = relationship("Reimbursement", back_populates="user", cascade="all, delete-orphan", foreign_keys="Reimbursement.user_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", foreign_keys="Notification.user_id")
    salary_slips = relationship("SalarySlip", back_populates="user", cascade="all, delete-orphan", foreign_keys="SalarySlip.user_id")
    salary_history = relationship("SalaryHistory", back_populates="user", cascade="all, delete-orphan", foreign_keys="SalaryHistory.user_id")
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan", foreign_keys="Document.user_id")
    id_card = relationship("IdCard", back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="IdCard.user_id")


class IdCard(Base, TimestampMixin, IdMixin):
    __tablename__ = "id_cards"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    department = Column(String, nullable=False)
    issue_date = Column(String, nullable=False)
    expiry_date = Column(String, nullable=False)
    card_number = Column(String, unique=True, nullable=False)

    user = relationship("User", back_populates="id_card", foreign_keys=[user_id])


# Document table for upload, verification, audit, and approval tracking
class Document(Base, TimestampMixin, IdMixin):
    __tablename__ = "documents"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "document_type", name="uq_user_document_type"
        ),
    )

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="documents", foreign_keys=[user_id])
    document_type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    status = Column(String, default="pending")
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    comment = Column(String, nullable=True)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    verified_at = Column(DateTime, nullable=True)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    approved_at = Column(DateTime, nullable=True)
