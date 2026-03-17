"""
Database module for Storyboard Creator.
Provides SQLAlchemy async support with SQLite for local development.
"""

from database.config import (
    get_db,
    init_db,
    close_db,
    get_async_session,
    engine,
    async_session_factory,
)
from database.models import (
    Base,
    Project,
    Book,
    Page,
    Asset,
    Job,
    Character,
    Workspace,
    CustomTheme,
    AlbumItem,
)
from database.repository import (
    BaseRepository,
    ProjectRepository,
    BookRepository,
    PageRepository,
    AssetRepository,
    CharacterRepository,
    JobRepository,
    WorkspaceRepository,
    CustomThemeRepository,
    AlbumItemRepository,
    get_repositories,
)

__all__ = [
    # Config
    "get_db",
    "init_db",
    "close_db",
    "get_async_session",
    "engine",
    "async_session_factory",
    # Models
    "Base",
    "Project",
    "Book",
    "Page",
    "Asset",
    "Job",
    "Character",
    "Workspace",
    "CustomTheme",
    "AlbumItem",
    # Repositories
    "BaseRepository",
    "ProjectRepository",
    "BookRepository",
    "PageRepository",
    "AssetRepository",
    "CharacterRepository",
    "JobRepository",
    "WorkspaceRepository",
    "CustomThemeRepository",
    "AlbumItemRepository",
    "get_repositories",
]

