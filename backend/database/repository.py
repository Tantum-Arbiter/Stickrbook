"""
Repository pattern implementation for database access.

This module provides an abstraction layer between the FastAPI routes and
SQLAlchemy, implementing CRUD operations with filtering, pagination,
and proper async support.
"""

from typing import TypeVar, Generic, Type, Optional, List, Dict, Any, Sequence
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Get current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)

from sqlalchemy import select, delete, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models import (
    Base, Project, Book, Page, Asset, Character, Job, Workspace, CustomTheme, AlbumItem
)


# Type variable for generic repository
T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """Base repository with common CRUD operations."""

    def __init__(self, session: AsyncSession, model: Type[T]):
        self.session = session
        self.model = model

    async def create(self, entity: T) -> T:
        """Create a new entity."""
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def get_by_id(self, entity_id: str, *, load_relations: List[str] = None) -> Optional[T]:
        """Get an entity by ID with optional relationship loading."""
        stmt = select(self.model).where(self.model.id == entity_id)
        
        if load_relations:
            for rel_name in load_relations:
                rel = getattr(self.model, rel_name, None)
                if rel is not None:
                    stmt = stmt.options(selectinload(rel))
        
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        order_by: str = None,
        order_desc: bool = True,
        load_relations: List[str] = None,
    ) -> Sequence[T]:
        """Get all entities with pagination and ordering."""
        stmt = select(self.model)
        
        if load_relations:
            for rel_name in load_relations:
                rel = getattr(self.model, rel_name, None)
                if rel is not None:
                    stmt = stmt.options(selectinload(rel))
        
        if order_by:
            col = getattr(self.model, order_by, None)
            if col is not None:
                stmt = stmt.order_by(col.desc() if order_desc else col.asc())
        
        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, entity: T, data: Dict[str, Any]) -> T:
        """Update an entity with provided data."""
        for key, value in data.items():
            if hasattr(entity, key):
                setattr(entity, key, value)
        
        # Update the updated_at timestamp if the model has it
        if hasattr(entity, 'updated_at'):
            entity.updated_at = utcnow()
        
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: T) -> bool:
        """Delete an entity."""
        await self.session.delete(entity)
        await self.session.flush()
        return True

    async def delete_by_id(self, entity_id: str) -> bool:
        """Delete an entity by ID."""
        entity = await self.get_by_id(entity_id)
        if entity:
            return await self.delete(entity)
        return False

    async def count(self) -> int:
        """Count all entities."""
        result = await self.session.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar_one()

    async def exists(self, entity_id: str) -> bool:
        """Check if an entity exists."""
        result = await self.session.execute(
            select(func.count()).select_from(self.model).where(self.model.id == entity_id)
        )
        return result.scalar_one() > 0


# ============================================================
# Project Repository
# ============================================================


class ProjectRepository(BaseRepository[Project]):
    """Repository for Project entities."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Project)

    async def get_with_books(self, project_id: str) -> Optional[Project]:
        """Get a project with its books loaded."""
        return await self.get_by_id(project_id, load_relations=["books"])

    async def list_with_book_counts(
        self, *, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """List projects with book counts for display."""
        projects = await self.get_all(
            skip=skip, limit=limit, order_by="updated_at", load_relations=["books"]
        )
        return [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "book_count": len(p.books),
                "books": [{"id": b.id, "title": b.title} for b in p.books],
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in projects
        ]

    async def search(self, query: str, *, skip: int = 0, limit: int = 100) -> Sequence[Project]:
        """Search projects by name or description."""
        pattern = f"%{query}%"
        stmt = (
            select(Project)
            .where(or_(Project.name.ilike(pattern), Project.description.ilike(pattern)))
            .order_by(Project.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()


# ============================================================
# Book Repository
# ============================================================


class BookRepository(BaseRepository[Book]):
    """Repository for Book entities."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Book)

    async def get_by_project(
        self, project_id: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Book]:
        """Get all books for a project."""
        stmt = (
            select(Book)
            .where(Book.project_id == project_id)
            .order_by(Book.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_with_pages(self, book_id: str) -> Optional[Book]:
        """Get a book with its pages loaded."""
        return await self.get_by_id(book_id, load_relations=["pages"])

    async def get_with_all_relations(self, book_id: str) -> Optional[Book]:
        """Get a book with all relations (pages, assets, characters)."""
        return await self.get_by_id(
            book_id, load_relations=["pages", "assets", "characters"]
        )

    async def get_summary(self, book_id: str) -> Optional[Dict[str, Any]]:
        """Get a book summary with counts."""
        book = await self.get_with_all_relations(book_id)
        if not book:
            return None

        return {
            "id": book.id,
            "title": book.title,
            "description": book.description,
            "project_id": book.project_id,
            "page_count": len(book.pages),
            "asset_count": len(book.assets),
            "character_count": len(book.characters),
            "preset_name": book.preset_name,
            "art_style": book.art_style,
            "updated_at": book.updated_at.isoformat() if book.updated_at else None,
        }


# ============================================================
# Page Repository
# ============================================================


class PageRepository(BaseRepository[Page]):
    """Repository for Page entities."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Page)

    async def get_by_book(
        self, book_id: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Page]:
        """Get all pages for a book, ordered by page number."""
        stmt = (
            select(Page)
            .where(Page.book_id == book_id)
            .order_by(Page.page_number.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_book_and_number(self, book_id: str, page_number: int) -> Optional[Page]:
        """Get a specific page by book and page number."""
        stmt = select(Page).where(
            Page.book_id == book_id, Page.page_number == page_number
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_by_book(self, book_id: str) -> int:
        """Count pages in a book."""
        result = await self.session.execute(
            select(func.count()).select_from(Page).where(Page.book_id == book_id)
        )
        return result.scalar_one()

    async def reorder_pages(self, book_id: str, page_order: List[str]) -> bool:
        """Reorder pages by setting new page numbers."""
        for index, page_id in enumerate(page_order):
            stmt = select(Page).where(Page.id == page_id, Page.book_id == book_id)
            result = await self.session.execute(stmt)
            page = result.scalar_one_or_none()
            if page:
                page.page_number = index + 1
        await self.session.flush()
        return True


# ============================================================
# Asset Repository
# ============================================================


class AssetRepository(BaseRepository[Asset]):
    """Repository for Asset entities."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Asset)

    async def get_by_book(
        self,
        book_id: str,
        *,
        asset_type: str = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[Asset]:
        """Get assets for a book, optionally filtered by type."""
        stmt = select(Asset).where(Asset.book_id == book_id)

        if asset_type:
            stmt = stmt.where(Asset.asset_type == asset_type)

        stmt = stmt.order_by(Asset.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_type(
        self, asset_type: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Asset]:
        """Get all assets of a specific type."""
        stmt = (
            select(Asset)
            .where(Asset.asset_type == asset_type)
            .order_by(Asset.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_characters(self, book_id: str) -> Sequence[Asset]:
        """Get all character assets for a book."""
        return await self.get_by_book(book_id, asset_type="character")

    async def get_props(self, book_id: str) -> Sequence[Asset]:
        """Get all prop assets for a book."""
        return await self.get_by_book(book_id, asset_type="prop")

    async def get_backgrounds(self, book_id: str) -> Sequence[Asset]:
        """Get all background assets for a book."""
        return await self.get_by_book(book_id, asset_type="background")

    async def search_by_tags(
        self, tags: List[str], *, book_id: str = None, skip: int = 0, limit: int = 100
    ) -> Sequence[Asset]:
        """Search assets by tags (any match)."""
        # Note: JSON array containment varies by DB. SQLite uses json_each.
        # This is a simplified approach - production may need DB-specific queries.
        stmt = select(Asset)

        if book_id:
            stmt = stmt.where(Asset.book_id == book_id)

        # For SQLite, we'll fetch all and filter in Python
        # A production PostgreSQL version would use JSONB operators
        stmt = stmt.order_by(Asset.created_at.desc())
        result = await self.session.execute(stmt)
        all_assets = result.scalars().all()

        # Filter by tags in Python
        matched = []
        for asset in all_assets:
            if asset.tags and any(tag in asset.tags for tag in tags):
                matched.append(asset)
                if len(matched) >= limit:
                    break

        return matched[skip:skip + limit]


# ============================================================
# Character Repository
# ============================================================


class CharacterRepository(BaseRepository[Character]):
    """Repository for Character entities."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Character)

    async def get_by_book(
        self, book_id: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Character]:
        """Get all characters for a book."""
        stmt = (
            select(Character)
            .where(Character.book_id == book_id)
            .order_by(Character.name.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_name(self, book_id: str, name: str) -> Optional[Character]:
        """Get a character by name within a book."""
        stmt = select(Character).where(
            Character.book_id == book_id, Character.name == name
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(
        self, query: str, *, book_id: str = None, skip: int = 0, limit: int = 100
    ) -> Sequence[Character]:
        """Search characters by name or description."""
        pattern = f"%{query}%"
        stmt = select(Character).where(
            or_(Character.name.ilike(pattern), Character.description.ilike(pattern))
        )

        if book_id:
            stmt = stmt.where(Character.book_id == book_id)

        stmt = stmt.order_by(Character.name.asc()).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()


# ============================================================
# Job Repository
# ============================================================


class JobRepository(BaseRepository[Job]):
    """Repository for Job entities."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Job)

    async def get_by_status(
        self, status: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Job]:
        """Get jobs by status."""
        stmt = (
            select(Job)
            .where(Job.status == status)
            .order_by(Job.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_pending_jobs(self, *, limit: int = 20) -> Sequence[Job]:
        """Get pending jobs (queue)."""
        return await self.get_by_status("pending", limit=limit)

    async def get_active_jobs(self) -> Sequence[Job]:
        """Get currently generating jobs."""
        return await self.get_by_status("generating", limit=10)

    async def get_by_book(
        self, book_id: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Job]:
        """Get jobs for a specific book."""
        stmt = (
            select(Job)
            .where(Job.book_id == book_id)
            .order_by(Job.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_workspace(
        self, workspace_id: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Job]:
        """Get jobs for a workspace session."""
        stmt = (
            select(Job)
            .where(Job.workspace_id == workspace_id)
            .order_by(Job.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update_status(
        self,
        job_id: str,
        status: str,
        *,
        progress: float = None,
        outputs: List[str] = None,
        error_message: str = None,
    ) -> Optional[Job]:
        """Update job status and related fields."""
        job = await self.get_by_id(job_id)
        if not job:
            return None

        job.status = status

        if progress is not None:
            job.progress = progress

        if outputs is not None:
            job.outputs = outputs

        if error_message is not None:
            job.error_message = error_message

        if status == "generating" and job.started_at is None:
            job.started_at = utcnow()

        if status in ("completed", "failed"):
            job.completed_at = utcnow()

        await self.session.flush()
        await self.session.refresh(job)
        return job

    async def cleanup_old_jobs(self, days: int = 7) -> int:
        """Delete jobs older than specified days."""
        from datetime import timedelta
        cutoff = utcnow() - timedelta(days=days)

        stmt = delete(Job).where(Job.created_at < cutoff)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount


# ============================================================
# Workspace Repository
# ============================================================


class WorkspaceRepository(BaseRepository[Workspace]):
    """Repository for Workspace entities."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Workspace)

    async def get_by_date(
        self, date: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Workspace]:
        """Get workspaces for a specific date."""
        stmt = (
            select(Workspace)
            .where(Workspace.date == date)
            .order_by(Workspace.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_book(
        self, book_id: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[Workspace]:
        """Get workspaces for a book."""
        stmt = (
            select(Workspace)
            .where(Workspace.book_id == book_id)
            .order_by(Workspace.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_dates(self) -> List[str]:
        """Get all unique workspace dates."""
        stmt = (
            select(Workspace.date)
            .distinct()
            .order_by(Workspace.date.desc())
        )
        result = await self.session.execute(stmt)
        return [row[0] for row in result.all()]

    async def mark_complete(self, workspace_id: str) -> Optional[Workspace]:
        """Mark a workspace session as complete."""
        workspace = await self.get_by_id(workspace_id)
        if not workspace:
            return None

        workspace.status = "complete"
        workspace.completed_at = utcnow()
        await self.session.flush()
        await self.session.refresh(workspace)
        return workspace

    async def add_image(
        self, workspace_id: str, image_info: Dict[str, Any]
    ) -> Optional[Workspace]:
        """Add an image to a workspace session."""
        workspace = await self.get_by_id(workspace_id)
        if not workspace:
            return None

        if workspace.images is None:
            workspace.images = []

        workspace.images.append(image_info)
        workspace.updated_at = utcnow()
        await self.session.flush()
        await self.session.refresh(workspace)
        return workspace


# ============================================================
# CustomTheme Repository
# ============================================================


class CustomThemeRepository(BaseRepository[CustomTheme]):
    """Repository for CustomTheme entities."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, CustomTheme)

    async def get_by_source(
        self, source: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[CustomTheme]:
        """Get themes by source type (text, image, hybrid)."""
        stmt = (
            select(CustomTheme)
            .where(CustomTheme.source == source)
            .order_by(CustomTheme.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_name(self, name: str) -> Optional[CustomTheme]:
        """Get a theme by exact name."""
        stmt = select(CustomTheme).where(CustomTheme.name == name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(
        self, query: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[CustomTheme]:
        """Search themes by name or art_style."""
        pattern = f"%{query}%"
        stmt = (
            select(CustomTheme)
            .where(
                or_(
                    CustomTheme.name.ilike(pattern),
                    CustomTheme.art_style.ilike(pattern),
                )
            )
            .order_by(CustomTheme.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()


# ============================================================
# AlbumItem Repository
# ============================================================


class AlbumItemRepository(BaseRepository[AlbumItem]):
    """Repository for AlbumItem entities (global favorites)."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, AlbumItem)

    async def get_by_source_book(
        self, source_book_id: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[AlbumItem]:
        """Get album items originating from a specific book."""
        stmt = (
            select(AlbumItem)
            .where(AlbumItem.source_book_id == source_book_id)
            .order_by(AlbumItem.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def search_by_tags(
        self, tags: List[str], *, skip: int = 0, limit: int = 100
    ) -> Sequence[AlbumItem]:
        """Search album items by tags."""
        # Similar to Asset.search_by_tags - simplified for SQLite
        stmt = select(AlbumItem).order_by(AlbumItem.created_at.desc())
        result = await self.session.execute(stmt)
        all_items = result.scalars().all()

        matched = []
        for item in all_items:
            if item.tags and any(tag in item.tags for tag in tags):
                matched.append(item)
                if len(matched) >= limit:
                    break

        return matched[skip:skip + limit]

    async def search(
        self, query: str, *, skip: int = 0, limit: int = 100
    ) -> Sequence[AlbumItem]:
        """Search album items by name or description."""
        pattern = f"%{query}%"
        stmt = (
            select(AlbumItem)
            .where(
                or_(
                    AlbumItem.name.ilike(pattern),
                    AlbumItem.description.ilike(pattern),
                )
            )
            .order_by(AlbumItem.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()


# ============================================================
# Repository Factory
# ============================================================


def get_repositories(session: AsyncSession) -> Dict[str, Any]:
    """
    Create all repository instances for a session.

    Usage:
        async with get_db() as session:
            repos = get_repositories(session)
            project = await repos['projects'].get_by_id(project_id)
    """
    return {
        "projects": ProjectRepository(session),
        "books": BookRepository(session),
        "pages": PageRepository(session),
        "assets": AssetRepository(session),
        "characters": CharacterRepository(session),
        "jobs": JobRepository(session),
        "workspaces": WorkspaceRepository(session),
        "themes": CustomThemeRepository(session),
        "album": AlbumItemRepository(session),
    }
