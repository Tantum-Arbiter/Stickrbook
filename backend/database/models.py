"""
SQLAlchemy database models for Storyboard Creator.

This module defines the normalized database schema for:
- Projects and Books (hierarchical organization)
- Pages with layer data
- Assets (characters, props, backgrounds)
- Characters with reference images
- Generation jobs and presets
- Workspaces for auto-saved sessions
- Custom themes for art styles
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


# ============================================================
# Project & Book Models
# ============================================================


class Project(Base):
    """Project containing multiple books (e.g., a book series)."""
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    books: Mapped[List["Book"]] = relationship(
        "Book", back_populates="project", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_projects_updated_at", "updated_at"),
    )


class Book(Base):
    """Book within a project containing pages."""
    __tablename__ = "books"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    width: Mapped[int] = mapped_column(Integer, default=1080)
    height: Mapped[int] = mapped_column(Integer, default=704)
    cover_image: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Generation preset settings embedded in book
    preset_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    art_style: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reference_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    negative_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_steps: Mapped[int] = mapped_column(Integer, default=35)
    default_cfg: Mapped[float] = mapped_column(Float, default=5.5)
    default_model: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="books")
    pages: Mapped[List["Page"]] = relationship(
        "Page", back_populates="book", cascade="all, delete-orphan"
    )
    characters: Mapped[List["Character"]] = relationship(
        "Character", back_populates="book", cascade="all, delete-orphan"
    )
    assets: Mapped[List["Asset"]] = relationship(
        "Asset", back_populates="book", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_books_project_id", "project_id"),
        Index("ix_books_updated_at", "updated_at"),
    )


# ============================================================
# Page Model
# ============================================================


class Page(Base):
    """Page within a book with layer/overlay data."""
    __tablename__ = "pages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    book_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("books.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, default=0)
    width: Mapped[int] = mapped_column(Integer, default=1080)
    height: Mapped[int] = mapped_column(Integer, default=704)

    # Image and content
    image_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    text_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    text_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    text_layout: Mapped[str] = mapped_column(String(50), default="text-below")

    # Layer data stored as JSON: [{asset_id, x, y, scale, z_index, opacity, effects}]
    overlays: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Generation status
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, generating, complete, failed

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    book: Mapped["Book"] = relationship("Book", back_populates="pages")

    __table_args__ = (
        Index("ix_pages_book_id", "book_id"),
        Index("ix_pages_page_number", "book_id", "page_number"),
    )


# ============================================================
# Asset Model
# ============================================================


class Asset(Base):
    """Reusable asset (character, prop, background, variation, final).

    Asset types match legacy AssetType enum:
    - character: Isolated character on transparent background
    - prop: Isolated object/prop on transparent background
    - background: Full scene background (no characters)
    - variation: Generated variation (temporary/workspace)
    - final: Final composed page image
    """
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    book_id: Mapped[Optional[str]] = mapped_column(
        String(32), ForeignKey("books.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)  # character, prop, background, variation, final
    image_path: Mapped[str] = mapped_column(String(512), nullable=False)
    thumbnail_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    has_transparency: Mapped[bool] = mapped_column(Boolean, default=False)

    # Generation info
    seed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Tags for filtering (stored as JSON array)
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Additional data (generation params, etc.) - named 'extra_data' to avoid SQLAlchemy reserved 'metadata'
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    book: Mapped[Optional["Book"]] = relationship("Book", back_populates="assets")

    __table_args__ = (
        Index("ix_assets_book_id", "book_id"),
        Index("ix_assets_asset_type", "asset_type"),
    )


# ============================================================
# Character Model
# ============================================================


class Character(Base):
    """Character definition for IP-Adapter consistency.

    Characters have a reference image used for maintaining visual
    consistency across poses and scenes via IP-Adapter.
    """
    __tablename__ = "characters"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    book_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("books.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Visual description for prompts
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Base prompt for character
    seed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reference_image_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Visual features for consistency (hair color, eye color, clothes, etc.)
    features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Color palette for consistency (list of hex colors)
    color_palette: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Pose assets as JSON array of asset IDs
    pose_asset_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    book: Mapped["Book"] = relationship("Book", back_populates="characters")

    __table_args__ = (
        Index("ix_characters_book_id", "book_id"),
    )


# ============================================================
# Job Model
# ============================================================


class Job(Base):
    """Generation job record.

    Tracks ComfyUI generation jobs with status polling support.
    Status matches legacy GenerationStatus enum: pending, generating, complete, failed
    """
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    book_id: Mapped[Optional[str]] = mapped_column(
        String(32), ForeignKey("books.id", ondelete="SET NULL"), nullable=True
    )
    workspace_id: Mapped[Optional[str]] = mapped_column(
        String(32), ForeignKey("workspaces.id", ondelete="SET NULL"), nullable=True
    )

    # Job configuration
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)  # scene, character, object, sketch, inpaint
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, generating, complete, failed

    # Generation parameters
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    negative_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    seed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    steps: Mapped[int] = mapped_column(Integer, default=35)
    cfg_scale: Mapped[float] = mapped_column(Float, default=5.5)
    width: Mapped[int] = mapped_column(Integer, default=1080)
    height: Mapped[int] = mapped_column(Integer, default=704)

    # Output tracking
    outputs: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of output paths
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_book_id", "book_id"),
        Index("ix_jobs_workspace_id", "workspace_id"),
        Index("ix_jobs_created_at", "created_at"),
    )


# ============================================================
# Workspace Model (Auto-saved generation sessions)
# ============================================================


class Workspace(Base):
    """Workspace session for auto-saved generations.

    Groups related generation batches (e.g., 4 variations from one prompt)
    for easy browsing and cleanup.
    """
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    book_id: Mapped[Optional[str]] = mapped_column(
        String(32), ForeignKey("books.id", ondelete="SET NULL"), nullable=True
    )

    # Session info
    date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preset_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="generating")  # generating, complete

    # Images stored as JSON array: [{filename, index, seed, job_id, saved_at}]
    images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_workspaces_date", "date"),
        Index("ix_workspaces_book_id", "book_id"),
        Index("ix_workspaces_created_at", "created_at"),
    )


# ============================================================
# CustomTheme Model (User-created art styles)
# ============================================================


class CustomTheme(Base):
    """User-created custom art style theme.

    Themes can be created from:
    - Text description only
    - Image analysis only
    - Hybrid (both text and image)
    """
    __tablename__ = "custom_themes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)  # text, image, hybrid

    # Generated prompts
    reference_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    negative_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    art_style: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Short description

    # Original inputs
    original_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    original_image_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Vision model analysis details
    analysis: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # medium, line_work, colors, etc.

    # Default generation settings
    width: Mapped[int] = mapped_column(Integer, default=1080)
    height: Mapped[int] = mapped_column(Integer, default=704)
    steps: Mapped[int] = mapped_column(Integer, default=35)
    cfg: Mapped[float] = mapped_column(Float, default=5.5)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_custom_themes_name", "name"),
        Index("ix_custom_themes_created_at", "created_at"),
    )


# ============================================================
# Album Model (Global saved favorites)
# ============================================================


class AlbumItem(Base):
    """Global album for saved favorite images across all projects."""
    __tablename__ = "album_items"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_path: Mapped[str] = mapped_column(String(512), nullable=False)
    thumbnail_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Original context
    source_book_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    source_asset_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Generation info
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    seed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Tags for organization
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_album_items_created_at", "created_at"),
    )
