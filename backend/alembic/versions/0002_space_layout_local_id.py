"""add layout local id to spaces

Revision ID: 0002_space_layout_local_id
Revises: 0001_initial
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "0002_space_layout_local_id"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("spaces")}
    indexes = {index["name"] for index in inspector.get_indexes("spaces")}
    unique_constraints = {constraint["name"] for constraint in inspector.get_unique_constraints("spaces")}

    if "layout_local_id" not in columns:
        op.add_column("spaces", sa.Column("layout_local_id", sa.Integer(), nullable=True))
    if "ix_spaces_layout_local_id" not in indexes:
        op.create_index(op.f("ix_spaces_layout_local_id"), "spaces", ["layout_local_id"], unique=False)
    if bind.dialect.name != "sqlite" and "uq_space_floor_layout_local_id" not in unique_constraints:
        op.create_unique_constraint("uq_space_floor_layout_local_id", "spaces", ["floor_id", "layout_local_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("spaces")}
    indexes = {index["name"] for index in inspector.get_indexes("spaces")}
    unique_constraints = {constraint["name"] for constraint in inspector.get_unique_constraints("spaces")}

    if bind.dialect.name != "sqlite" and "uq_space_floor_layout_local_id" in unique_constraints:
        op.drop_constraint("uq_space_floor_layout_local_id", "spaces", type_="unique")
    if "ix_spaces_layout_local_id" in indexes:
        op.drop_index(op.f("ix_spaces_layout_local_id"), table_name="spaces")
    if "layout_local_id" in columns:
        op.drop_column("spaces", "layout_local_id")
