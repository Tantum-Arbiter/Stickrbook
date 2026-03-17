"""add collection to assets

Revision ID: 001
Revises: 
Create Date: 2026-03-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add collection column to assets table
    op.add_column('assets', sa.Column('collection', sa.String(length=255), nullable=True))
    
    # Add index for collection
    op.create_index('ix_assets_collection', 'assets', ['collection'], unique=False)


def downgrade() -> None:
    # Remove index
    op.drop_index('ix_assets_collection', table_name='assets')
    
    # Remove column
    op.drop_column('assets', 'collection')

