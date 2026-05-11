from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.base import Base, IdMixin, TimestampMixin


class Department(Base, TimestampMixin, IdMixin):
    __tablename__ = "departments"

    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    head_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    parent_department_id = Column(
        UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True
    )
    is_active = Column(Boolean, default=True)

    parent_department = relationship(
        "Department", remote_side="Department.id", backref="sub_departments"
    )
    head = relationship("User", foreign_keys=[head_id], backref="leading_department")

    designations = relationship(
        "Designation", back_populates="department", cascade="all, delete-orphan"
    )


class Designation(Base, TimestampMixin, IdMixin):
    __tablename__ = "designations"

    name = Column(String, nullable=False)
    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
    )
    department = relationship(
        "Department", back_populates="designations", foreign_keys=[department_id]
    )
    level = Column(Integer, default=1)
    min_salary = Column(Float, nullable=True)
    max_salary = Column(Float, nullable=True)

    is_active = Column(Boolean, default=True)
