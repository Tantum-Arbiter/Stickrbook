/**
 * AssetLibrary Component
 *
 * Asset browser with filtering, search, and drag-to-canvas support.
 * Uses extracted CSS from legacy storyboard (asset-grid.css).
 */

import { useCallback, useState, useMemo } from 'react';
import { useProjectsStore } from '../../store';
import type { Asset, AssetType } from '../../store/types';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import {
  Package,
  User,
  Image,
  Palette,
  Paperclip,
  Search,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Move,
} from 'lucide-react';

// Asset type tabs
const ASSET_TABS: { type: AssetType | 'all'; label: string; icon: React.ReactNode }[] = [
  { type: 'all', label: 'All', icon: <Package size={14} /> },
  { type: 'character', label: 'Characters', icon: <User size={14} /> },
  { type: 'background', label: 'Backgrounds', icon: <Image size={14} /> },
  { type: 'object', label: 'Objects', icon: <Palette size={14} /> },
  { type: 'reference', label: 'References', icon: <Paperclip size={14} /> },
];

export interface AssetLibraryProps {
  className?: string;
  onAssetClick?: (asset: Asset) => void;
  onAssetDragStart?: (asset: Asset, e: React.DragEvent) => void;
}

export function AssetLibrary({
  className = '',
  onAssetClick,
  onAssetDragStart,
}: AssetLibraryProps) {
  const [activeTab, setActiveTab] = useState<AssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collapsedCollections, setCollapsedCollections] = useState<Set<string>>(new Set());
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [draggedAsset, setDraggedAsset] = useState<Asset | null>(null);
  const [collectionColors, setCollectionColors] = useState<Record<string, string>>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('stickrbook-collection-colors');
    return saved ? JSON.parse(saved) : {};
  });
  const [contextMenuCollection, setContextMenuCollection] = useState<string | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const toast = useToast();
  const updateAsset = useProjectsStore((s) => s.updateAsset);
  const deleteAsset = useProjectsStore((s) => s.deleteAsset);

  const currentBook = useProjectsStore((s) => s.currentBook());
  const assets = currentBook?.assets || [];

  // Filter assets by type, search, tags, and collection
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Type filter
      if (activeTab !== 'all' && asset.assetType !== activeTab) {
        return false;
      }
      // Collection filter
      if (selectedCollection && asset.collection !== selectedCollection) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = asset.name.toLowerCase().includes(query);
        const descMatch = asset.description?.toLowerCase().includes(query);
        const collectionMatch = asset.collection?.toLowerCase().includes(query);
        if (!nameMatch && !descMatch && !collectionMatch) return false;
      }
      // Tags filter
      if (selectedTags.length > 0 && asset.tags) {
        const hasTag = selectedTags.some((tag) => asset.tags?.includes(tag));
        if (!hasTag) return false;
      }
      return true;
    });
  }, [assets, activeTab, searchQuery, selectedTags, selectedCollection]);

  // Get unique tags from all assets
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    assets.forEach((asset) => {
      asset.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [assets]);

  // Get unique collections from filtered assets (by type)
  const allCollections = useMemo(() => {
    const collections = new Set<string>();
    assets.forEach((asset) => {
      // Only include collections from the active tab
      if (activeTab === 'all' || asset.assetType === activeTab) {
        if (asset.collection) {
          collections.add(asset.collection);
        }
      }
    });
    return Array.from(collections).sort();
  }, [assets, activeTab]);

  // Group assets by collection
  const assetsByCollection = useMemo(() => {
    const grouped: Record<string, typeof filteredAssets> = {};
    filteredAssets.forEach((asset) => {
      const collection = asset.collection || 'Uncategorized';
      if (!grouped[collection]) {
        grouped[collection] = [];
      }
      grouped[collection].push(asset);
    });
    return grouped;
  }, [filteredAssets]);

  // Count assets by type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: assets.length };
    assets.forEach((asset) => {
      counts[asset.assetType] = (counts[asset.assetType] || 0) + 1;
    });
    return counts;
  }, [assets]);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const toggleCollection = useCallback((collection: string) => {
    setCollapsedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(collection)) {
        next.delete(collection);
      } else {
        next.add(collection);
      }
      return next;
    });
  }, []);

  // Multi-select handlers
  const toggleAssetSelection = useCallback((assetId: string, event?: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Ctrl/Cmd+click: toggle individual selection
      setSelectedAssets((prev) => {
        const next = new Set(prev);
        if (next.has(assetId)) {
          next.delete(assetId);
        } else {
          next.add(assetId);
        }
        return next;
      });
    } else if (event?.shiftKey && selectedAssets.size > 0) {
      // Shift+click: select range
      const allAssetIds = filteredAssets.map(a => a.id);
      const lastSelected = Array.from(selectedAssets).pop();
      const lastIndex = allAssetIds.indexOf(lastSelected || '');
      const currentIndex = allAssetIds.indexOf(assetId);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = allAssetIds.slice(start, end + 1);
        setSelectedAssets(new Set(rangeIds));
      }
    } else {
      // Regular click: select only this asset
      setSelectedAssets(new Set([assetId]));
    }
  }, [selectedAssets, filteredAssets]);

  const clearSelection = useCallback(() => {
    setSelectedAssets(new Set());
  }, []);

  // Create collection from selected assets
  const createCollectionFromSelected = useCallback(async () => {
    if (selectedAssets.size === 0) {
      toast.error('No assets selected');
      return;
    }

    const collectionName = window.prompt('Enter a name for the new collection:');
    if (!collectionName) return;

    try {
      // Update all selected assets to have the new collection
      await Promise.all(
        Array.from(selectedAssets).map(assetId =>
          updateAsset(assetId, { collection: collectionName })
        )
      );
      toast.success(`Created collection "${collectionName}" with ${selectedAssets.size} assets`);
      clearSelection();
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error('Failed to create collection');
    }
  }, [selectedAssets, updateAsset, toast, clearSelection]);

  // Drag and drop handlers
  const handleAssetDragStart = useCallback((asset: Asset, e: React.DragEvent) => {
    setDraggedAsset(asset);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', asset.id);

    // Call the original onDragStart if provided
    onAssetDragStart?.(asset, e);
  }, [onAssetDragStart]);

  const handleCollectionDrop = useCallback(async (targetCollection: string | null, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedAsset) return;

    try {
      await updateAsset(draggedAsset.id, { collection: targetCollection || undefined });
      const collectionLabel = targetCollection || 'Uncategorized';
      toast.success(`Moved "${draggedAsset.name}" to ${collectionLabel}`);
      setDraggedAsset(null);
    } catch (error) {
      console.error('Failed to move asset:', error);
      toast.error('Failed to move asset');
    }
  }, [draggedAsset, updateAsset, toast]);

  const handleCollectionDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Rename collection
  const renameCollection = useCallback(async (oldName: string) => {
    const newName = window.prompt('Enter new collection name:', oldName);
    if (!newName || newName === oldName) return;

    try {
      // Get all assets in this collection
      const assetsToUpdate = assets.filter(a => a.collection === oldName);

      // Update all assets to new collection name
      await Promise.all(
        assetsToUpdate.map(asset => updateAsset(asset.id, { collection: newName }))
      );

      // Update color mapping
      if (collectionColors[oldName]) {
        const newColors = { ...collectionColors };
        newColors[newName] = newColors[oldName];
        delete newColors[oldName];
        setCollectionColors(newColors);
        localStorage.setItem('stickrbook-collection-colors', JSON.stringify(newColors));
      }

      toast.success(`Renamed collection to "${newName}"`);
    } catch (error) {
      console.error('Failed to rename collection:', error);
      toast.error('Failed to rename collection');
    }
  }, [assets, updateAsset, collectionColors, toast]);

  // Delete collection (move assets to Uncategorized)
  const deleteCollection = useCallback(async (collectionName: string) => {
    const assetsInCollection = assets.filter(a => a.collection === collectionName);
    const confirmed = window.confirm(
      `Delete collection "${collectionName}"?\n\n${assetsInCollection.length} asset${assetsInCollection.length !== 1 ? 's' : ''} will be moved to Uncategorized.`
    );
    if (!confirmed) return;

    try {
      // Move all assets to Uncategorized (null collection)
      await Promise.all(
        assetsInCollection.map(asset => updateAsset(asset.id, { collection: undefined }))
      );

      // Remove color mapping
      if (collectionColors[collectionName]) {
        const newColors = { ...collectionColors };
        delete newColors[collectionName];
        setCollectionColors(newColors);
        localStorage.setItem('stickrbook-collection-colors', JSON.stringify(newColors));
      }

      toast.success(`Deleted collection "${collectionName}"`);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      toast.error('Failed to delete collection');
    }
  }, [assets, updateAsset, collectionColors, toast]);

  // Set collection color
  const setCollectionColor = useCallback((collectionName: string, color: string) => {
    const newColors = { ...collectionColors, [collectionName]: color };
    setCollectionColors(newColors);
    localStorage.setItem('stickrbook-collection-colors', JSON.stringify(newColors));
  }, [collectionColors]);

  // Bulk delete selected assets
  const deleteSelectedAssets = useCallback(async () => {
    if (selectedAssets.size === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedAssets.size} selected asset${selectedAssets.size !== 1 ? 's' : ''}?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await Promise.all(
        Array.from(selectedAssets).map(assetId => deleteAsset(assetId))
      );
      toast.success(`Deleted ${selectedAssets.size} assets`);
      clearSelection();
    } catch (error) {
      console.error('Failed to delete assets:', error);
      toast.error('Failed to delete assets');
    }
  }, [selectedAssets, deleteAsset, toast, clearSelection]);

  // Bulk move selected assets
  const moveSelectedAssets = useCallback(async (targetCollection: string | null) => {
    if (selectedAssets.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedAssets).map(assetId =>
          updateAsset(assetId, { collection: targetCollection || undefined })
        )
      );
      const collectionLabel = targetCollection || 'Uncategorized';
      toast.success(`Moved ${selectedAssets.size} assets to ${collectionLabel}`);
      clearSelection();
      setShowMoveMenu(false);
    } catch (error) {
      console.error('Failed to move assets:', error);
      toast.error('Failed to move assets');
    }
  }, [selectedAssets, updateAsset, toast, clearSelection]);

  return (
    <div className={`asset-library ${className}`}>
      {/* Asset Type Tabs */}
      <div className="sidebar-assets-tabs">
        {ASSET_TABS.map((tab) => (
          <button
            key={tab.type}
            className={`sidebar-asset-tab ${activeTab === tab.type ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.type)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className="asset-count">{typeCounts[tab.type] || 0}</span>
          </button>
        ))}
      </div>

      {/* Multi-select Actions */}
      {selectedAssets.size > 0 && (
        <div style={{
          padding: '8px',
          background: 'var(--accent-bg)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ flex: 1, fontWeight: 600, color: 'var(--accent-color)', minWidth: '120px' }}>
            {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
          </span>
          <Button size="small" variant="primary" onClick={createCollectionFromSelected}>
            <Plus size={14} />
            Create Collection
          </Button>
          <div style={{ position: 'relative' }}>
            <Button size="small" variant="secondary" onClick={() => setShowMoveMenu(!showMoveMenu)}>
              <Move size={14} />
              Move To...
            </Button>
            {showMoveMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '180px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <div
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                  onClick={() => moveSelectedAssets(null)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Uncategorized
                </div>
                {allCollections.map(collection => (
                  <div
                    key={collection}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => moveSelectedAssets(collection)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {collectionColors[collection] && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: collectionColors[collection]
                      }} />
                    )}
                    {collection}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button size="small" variant="secondary" onClick={deleteSelectedAssets} style={{ color: 'var(--error-color)' }}>
            <Trash2 size={14} />
            Delete
          </Button>
          <Button size="small" variant="secondary" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {/* Filter Dropdown */}
      <div className={`assets-filter-dropdown ${showFilters ? '' : 'collapsed'}`}>
        <div
          className="assets-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span><Search size={12} /> Filter & Search</span>
          <ChevronDown size={12} className="filter-chevron" />
        </div>
        <div className="assets-filter-content">
          {/* Search Box */}
          <div className="asset-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Collections Filter */}
          {allCollections.length > 0 && (
            <div className="asset-collections-filter" style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>
                Collections:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                <span
                  className={`asset-tag ${selectedCollection === null ? 'active' : ''}`}
                  onClick={() => setSelectedCollection(null)}
                  style={{ cursor: 'pointer' }}
                >
                  All
                </span>
                {allCollections.map((collection) => (
                  <span
                    key={collection}
                    className={`asset-tag ${selectedCollection === collection ? 'active' : ''}`}
                    onClick={() => setSelectedCollection(collection)}
                    style={{ cursor: 'pointer' }}
                  >
                    {collection}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="asset-tags-filter">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className={`asset-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Asset Grid - Grouped by Collection */}
      <div className="sidebar-asset-grid">
        {Object.keys(assetsByCollection).length > 0 ? (
          Object.entries(assetsByCollection).map(([collection, collectionAssets]) => {
            const isCollapsed = collapsedCollections.has(collection);
            const isUncategorized = collection === 'Uncategorized';
            const FolderIcon = isCollapsed ? Folder : FolderOpen;
            const collectionColor = collectionColors[collection];

            return (
              <div key={collection} style={{ marginBottom: '16px' }}>
                {/* Collection Header - Droppable */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    background: draggedAsset && draggedAsset.collection !== collection
                      ? 'var(--accent-bg)'
                      : 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: draggedAsset && draggedAsset.collection !== collection
                      ? '2px dashed var(--accent-color)'
                      : collectionColor
                      ? `2px solid ${collectionColor}`
                      : '2px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onDragOver={handleCollectionDragOver}
                  onDrop={(e) => handleCollectionDrop(isUncategorized ? null : collection, e)}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }}
                    onClick={() => toggleCollection(collection)}
                  >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    <FolderIcon
                      size={16}
                      style={{
                        color: collectionColor || (isUncategorized ? 'var(--text-muted)' : 'var(--accent-color)')
                      }}
                    />
                    {collectionColor && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: collectionColor
                      }} />
                    )}
                    <span>{collection}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {collectionAssets.length}
                    </span>
                  </div>

                  {/* Collection Actions - Only for named collections */}
                  {!isUncategorized && (
                    <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      {/* Color Picker */}
                      <input
                        type="color"
                        value={collectionColor || '#6366f1'}
                        onChange={(e) => setCollectionColor(collection, e.target.value)}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Set collection color"
                      />
                      <button
                        onClick={() => renameCollection(collection)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--text-secondary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Rename collection"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteCollection(collection)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--error-color)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Delete collection"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Collection Assets */}
                {!isCollapsed && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                    {collectionAssets.map((asset) => (
                      <AssetThumbnail
                        key={asset.id}
                        asset={asset}
                        isSelected={selectedAssets.has(asset.id)}
                        onClick={(e) => {
                          toggleAssetSelection(asset.id, e);
                          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                            onAssetClick?.(asset);
                          }
                        }}
                        onDragStart={(e) => handleAssetDragStart(asset, e)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="asset-empty">
            <p>No assets found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Asset thumbnail component
interface AssetThumbnailProps {
  asset: Asset;
  isSelected?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
}

function AssetThumbnail({ asset, isSelected = false, onClick, onDragStart }: AssetThumbnailProps) {
  return (
    <div
      className="sidebar-asset-thumb"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      style={{
        outline: isSelected ? '3px solid var(--accent-color)' : 'none',
        outlineOffset: '-3px',
        position: 'relative',
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'var(--accent-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'white',
          zIndex: 1,
        }}>
          ✓
        </div>
      )}
      <img
        src={asset.thumbnailPath || asset.imagePath}
        alt={asset.name}
        loading="lazy"
      />
      <span className="asset-name-label">{asset.name}</span>
    </div>
  );
}

