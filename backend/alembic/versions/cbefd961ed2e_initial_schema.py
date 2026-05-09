"""initial_schema

Revision ID: cbefd961ed2e
Revises:
Create Date: 2026-05-09 04:36:48.978516

Baseline migration — all tables already existed before Alembic was introduced.
Stamping the database at this revision records the pre-Alembic state without
re-running any DDL.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'cbefd961ed2e'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
