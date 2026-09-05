"""Seed default user

Revision ID: a1b2c3d4e5f6
Revises: e437ec7b2597
Create Date: 2026-09-05 17:42:00.000000

"""
import os
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import column, table

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'e437ec7b2597'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from schemas.auth import Role
    from services.auth import hash_password

    default_email = os.getenv("DEFAULT_USER_EMAIL", "user@example.com")
    default_password = os.getenv("DEFAULT_USER_PASSWORD", "strongpassword")
    default_name = os.getenv("DEFAULT_USER_FULL_NAME", "Admin User")

    users_table = table(
        'users',
        column('id', sa.UUID(as_uuid=True)),
        column('email', sa.String),
        column('full_name', sa.String),
        column('hashed_password', sa.String),
        column('role', sa.String),
        column('is_active', sa.Boolean),
    )

    conn = op.get_bind()
    existing = conn.execute(
        sa.select(users_table.c.id).where(users_table.c.email == default_email)
    ).fetchone()

    if not existing:
        op.bulk_insert(
            users_table,
            [
                {
                    'id': uuid.uuid4(),
                    'email': default_email,
                    'full_name': default_name,
                    'hashed_password': hash_password(default_password),
                    'role': Role.ADMIN.value,
                    'is_active': True,
                }
            ]
        )


def downgrade() -> None:
    default_email = os.getenv("DEFAULT_USER_EMAIL", "user@example.com")
    op.execute(sa.text(f"DELETE FROM users WHERE email = '{default_email}'"))

