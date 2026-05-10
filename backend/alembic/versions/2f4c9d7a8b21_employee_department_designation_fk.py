"""Add employee department and designation relationships.

Revision ID: 2f4c9d7a8b21
Revises: 11bef4a9b048
Create Date: 2026-05-10 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "2f4c9d7a8b21"
down_revision = "11bef4a9b048"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("employees", sa.Column("department_id", sa.UUID(), nullable=True))
    op.add_column("employees", sa.Column("designation_id", sa.UUID(), nullable=True))

    op.execute(
        """
        UPDATE employees
        SET department_id = (
            SELECT departments.id
            FROM departments
            WHERE departments.name = employees.department
            LIMIT 1
        )
        WHERE employees.department IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE employees
        SET designation_id = (
            SELECT designations.id
            FROM designations
            WHERE designations.name = employees.designation
              AND (
                employees.department_id IS NULL
                OR designations.department_id = employees.department_id
              )
            LIMIT 1
        )
        WHERE employees.designation IS NOT NULL
        """
    )

    op.create_foreign_key(
        "fk_employees_department_id_departments",
        "employees",
        "departments",
        ["department_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_employees_designation_id_designations",
        "employees",
        "designations",
        ["designation_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.drop_column("employees", "designation")
    op.drop_column("employees", "department")


def downgrade():
    op.add_column("employees", sa.Column("department", sa.String(), nullable=True))
    op.add_column("employees", sa.Column("designation", sa.String(), nullable=True))
    op.execute(
        """
        UPDATE employees
        SET department = (
            SELECT departments.name
            FROM departments
            WHERE departments.id = employees.department_id
            LIMIT 1
        )
        WHERE employees.department_id IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE employees
        SET designation = (
            SELECT designations.name
            FROM designations
            WHERE designations.id = employees.designation_id
            LIMIT 1
        )
        WHERE employees.designation_id IS NOT NULL
        """
    )
    op.drop_constraint("fk_employees_designation_id_designations", "employees", type_="foreignkey")
    op.drop_constraint("fk_employees_department_id_departments", "employees", type_="foreignkey")
    op.drop_column("employees", "designation_id")
    op.drop_column("employees", "department_id")
