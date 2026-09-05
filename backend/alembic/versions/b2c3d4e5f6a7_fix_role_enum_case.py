"""Fix role enum values to uppercase

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-05 17:47:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE users SET role = 'ADMIN' WHERE role = 'admin'"))
    conn.execute(sa.text("UPDATE users SET role = 'EMPLOYEE' WHERE role = 'employee'"))
    conn.execute(sa.text("UPDATE users SET role = 'MANAGER' WHERE role = 'manager'"))
    conn.execute(sa.text("UPDATE users SET role = 'HR' WHERE role = 'hr'"))


def downgrade() -> None:
    pass

