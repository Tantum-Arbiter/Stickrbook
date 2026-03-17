/**
 * AssetLibrary Component
 *
 * Asset browser with filtering, search, and drag-to-canvas support.
 * Uses extracted CSS from legacy storyboard (asset-grid.css).
 */

import { useCallback, useState, useMemo, useEffect } from 'react';
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
  const [emptyCollections, setEmptyCollections] = useState<string[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('stickrbook-empty-collections');
    return saved ? JSON.parse(saved) : [];
  });
  const [collectionOrder, setCollectionOrder] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('stickrbook-collection-order');
    return saved ? JSON.parse(saved) : {};
  });
  const [draggedCollection, setDraggedCollection] = useState<string | null>(null);
  const [contextMenuCollection, setContextMenuCollection] = useState<string | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [colorPickerCollection, setColorPickerCollection] = useState<string | null>(null);
  const [customColorInput, setCustomColorInput] = useState('');

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

  // Get unique collections from filtered assets (by type) + empty collections
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
    // Add empty collections
    emptyCollections.forEach(c => collections.add(c));

    // Sort by custom order, then alphabetically
    return Array.from(collections).sort((a, b) => {
      const orderA = collectionOrder[a] ?? 999999;
      const orderB = collectionOrder[b] ?? 999999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [assets, activeTab, emptyCollections, collectionOrder]);

  // Group collections by asset type
  const collectionsByType = useMemo(() => {
    const byType: Record<AssetType, string[]> = {
      character: [],
      background: [],
      object: [],
      reference: [],
    };

    // Group collections by their primary asset type
    allCollections.forEach(collection => {
      const assetsInCollection = assets.filter(a => a.collection === collection);
      if (assetsInCollection.length > 0) {
        // Use the most common asset type in this collection
        const typeCounts: Record<string, number> = {};
        assetsInCollection.forEach(a => {
          typeCounts[a.assetType] = (typeCounts[a.assetType] || 0) + 1;
        });
        const primaryType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0] as AssetType;
        byType[primaryType].push(collection);
      }
    });

    return byType;
  }, [allCollections, assets]);

  // Group assets by collection (including empty collections)
  const assetsByCollection = useMemo(() => {
    const grouped: Record<string, typeof filteredAssets> = {};

    // Add assets to their collections
    filteredAssets.forEach((asset) => {
      const collection = asset.collection || 'Uncategorized';
      if (!grouped[collection]) {
        grouped[collection] = [];
      }
      grouped[collection].push(asset);
    });

    // Add empty collections with no assets
    emptyCollections.forEach(collection => {
      if (!grouped[collection]) {
        grouped[collection] = [];
      }
    });

    return grouped;
  }, [filteredAssets, emptyCollections]);

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

  // Create empty collection
  const createEmptyCollection = useCallback(() => {
    const collectionName = window.prompt('Enter a name for the new collection:');
    if (!collectionName) return;

    if (allCollections.includes(collectionName)) {
      toast.error('A collection with this name already exists');
      return;
    }

    const newEmptyCollections = [...emptyCollections, collectionName];
    setEmptyCollections(newEmptyCollections);
    localStorage.setItem('stickrbook-empty-collections', JSON.stringify(newEmptyCollections));
    toast.success(`Created empty collection "${collectionName}"`);
  }, [emptyCollections, allCollections, toast]);

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

      // Remove from empty collections if it was there
      if (emptyCollections.includes(collectionName)) {
        const newEmptyCollections = emptyCollections.filter(c => c !== collectionName);
        setEmptyCollections(newEmptyCollections);
        localStorage.setItem('stickrbook-empty-collections', JSON.stringify(newEmptyCollections));
      }

      toast.success(`Created collection "${collectionName}" with ${selectedAssets.size} assets`);
      clearSelection();
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast.error('Failed to create collection');
    }
  }, [selectedAssets, updateAsset, toast, clearSelection, emptyCollections]);

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

      // Remove from empty collections if it was there
      if (targetCollection && emptyCollections.includes(targetCollection)) {
        const newEmptyCollections = emptyCollections.filter(c => c !== targetCollection);
        setEmptyCollections(newEmptyCollections);
        localStorage.setItem('stickrbook-empty-collections', JSON.stringify(newEmptyCollections));
      }

      const collectionLabel = targetCollection || 'Uncategorized';
      toast.success(`Moved "${draggedAsset.name}" to ${collectionLabel}`);
      setDraggedAsset(null);
    } catch (error) {
      console.error('Failed to move asset:', error);
      toast.error('Failed to move asset');
    }
  }, [draggedAsset, updateAsset, toast, emptyCollections]);

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

      // Update empty collections list if this was an empty collection
      if (emptyCollections.includes(oldName)) {
        const newEmptyCollections = emptyCollections.map(c => c === oldName ? newName : c);
        setEmptyCollections(newEmptyCollections);
        localStorage.setItem('stickrbook-empty-collections', JSON.stringify(newEmptyCollections));
      }

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
  }, [assets, updateAsset, collectionColors, toast, emptyCollections]);

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

      // Remove from empty collections if it was there
      if (emptyCollections.includes(collectionName)) {
        const newEmptyCollections = emptyCollections.filter(c => c !== collectionName);
        setEmptyCollections(newEmptyCollections);
        localStorage.setItem('stickrbook-empty-collections', JSON.stringify(newEmptyCollections));
      }

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
  }, [assets, updateAsset, collectionColors, toast, emptyCollections]);

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

      // Remove from empty collections if it was there
      if (targetCollection && emptyCollections.includes(targetCollection)) {
        const newEmptyCollections = emptyCollections.filter(c => c !== targetCollection);
        setEmptyCollections(newEmptyCollections);
        localStorage.setItem('stickrbook-empty-collections', JSON.stringify(newEmptyCollections));
      }

      const collectionLabel = targetCollection || 'Uncategorized';
      toast.success(`Moved ${selectedAssets.size} assets to ${collectionLabel}`);
      clearSelection();
      setShowMoveMenu(false);
    } catch (error) {
      console.error('Failed to move assets:', error);
      toast.error('Failed to move assets');
    }
  }, [selectedAssets, updateAsset, toast, clearSelection, emptyCollections]);

  // Collection drag-and-drop for reordering
  const handleCollectionDragStart = useCallback((collection: string, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedCollection(collection);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleCollectionDragOverForReorder = useCallback((e: React.DragEvent) => {
    if (draggedCollection) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
    }
  }, [draggedCollection]);

  const handleCollectionDropForReorder = useCallback((targetCollection: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedCollection || draggedCollection === targetCollection) {
      setDraggedCollection(null);
      return;
    }

    // Reorder collections
    const sourceIndex = allCollections.indexOf(draggedCollection);
    const targetIndex = allCollections.indexOf(targetCollection);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedCollection(null);
      return;
    }

    // Create new order mapping
    const newOrder: Record<string, number> = { ...collectionOrder };
    allCollections.forEach((col, idx) => {
      if (col === draggedCollection) {
        newOrder[col] = targetIndex;
      } else if (sourceIndex < targetIndex) {
        // Moving down: shift items between source and target up
        if (idx > sourceIndex && idx <= targetIndex) {
          newOrder[col] = idx - 1;
        } else {
          newOrder[col] = idx;
        }
      } else {
        // Moving up: shift items between target and source down
        if (idx >= targetIndex && idx < sourceIndex) {
          newOrder[col] = idx + 1;
        } else {
          newOrder[col] = idx;
        }
      }
    });

    setCollectionOrder(newOrder);
    localStorage.setItem('stickrbook-collection-order', JSON.stringify(newOrder));
    setDraggedCollection(null);
    toast.success(`Reordered "${draggedCollection}"`);
  }, [draggedCollection, allCollections, collectionOrder, toast]);

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

      {/* Create Empty Collection Button */}
      <div style={{ padding: '8px', paddingBottom: '0' }}>
        <Button size="small" variant="secondary" onClick={createEmptyCollection} style={{ width: '100%' }}>
          <Folder size={14} />
          New Collection
        </Button>
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

      {/* Asset Grid - Grouped by Asset Type (when viewing All) or Collection */}
      <div className="sidebar-asset-grid" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {Object.keys(assetsByCollection).length > 0 ? (
          <>
            {/* When viewing "All", group collections by asset type */}
            {activeTab === 'all' && (
              <>
                {(['background', 'character', 'object', 'reference'] as AssetType[]).map(assetType => {
                  const typeCollections = collectionsByType[assetType];
                  if (!typeCollections || typeCollections.length === 0) return null;

                  const typeTab = ASSET_TABS.find(t => t.type === assetType);
                  if (!typeTab) return null;

                  return (
                    <div key={assetType} style={{ marginBottom: '16px' }}>
                      {/* Asset Type Header */}
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        padding: '8px 8px 4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        letterSpacing: '0.5px'
                      }}>
                        {typeTab.icon}
                        <span>{typeTab.label}</span>
                      </div>

                      {/* Collections for this type */}
                      {typeCollections.map(collection => {
                        const collectionAssets = assetsByCollection[collection] || [];
                        const isCollapsed = collapsedCollections.has(collection);
                        const FolderIcon = isCollapsed ? Folder : FolderOpen;
                        const collectionColor = collectionColors[collection];

                        return (
                          <div key={collection} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexShrink: 0,
                            marginBottom: '8px'
                          }}>
                            {/* Collection Header */}
                            <div
                              draggable
                              onDragStart={(e) => handleCollectionDragStart(collection, e)}
                              onDragOver={(e) => {
                                handleCollectionDragOver(e);
                                handleCollectionDragOverForReorder(e);
                              }}
                              onDrop={(e) => {
                                handleCollectionDrop(collection, e);
                                handleCollectionDropForReorder(collection, e);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                background: draggedAsset && draggedAsset.collection !== collection
                                  ? 'var(--accent-bg)'
                                  : draggedCollection === collection
                                  ? 'var(--bg-hover)'
                                  : 'var(--bg-card)',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                border: draggedAsset && draggedAsset.collection !== collection
                                  ? '2px dashed var(--accent-color)'
                                  : draggedCollection && draggedCollection !== collection
                                  ? '2px dashed var(--text-muted)'
                                  : collectionColor
                                  ? `2px solid ${collectionColor}`
                                  : '2px solid transparent',
                                transition: 'all 0.2s',
                                position: 'relative',
                                cursor: 'grab',
                                opacity: draggedCollection === collection ? 0.5 : 1,
                              }}
                            >
                              {/* Drag Handle */}
                              <div
                                style={{
                                  cursor: 'grab',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '0 4px'
                                }}
                                title="Drag to reorder"
                              >
                                <Move size={14} />
                              </div>

                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }}
                                onClick={() => toggleCollection(collection)}
                              >
                                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                <FolderIcon
                                  size={16}
                                  style={{ color: collectionColor || 'var(--accent-color)' }}
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

                              {/* Collection Actions */}
                              <div style={{ display: 'flex', gap: '4px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setColorPickerCollection(collection);
                                    setCustomColorInput(collectionColor || '#6366f1');
                                  }}
                                  style={{
                                    background: collectionColor || '#6366f1',
                                    border: '2px solid var(--border)',
                                    width: '24px',
                                    height: '24px',
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
                                    color: 'var(--text-secondary)'
                                  }}
                                  title="Delete collection"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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
                      })}
                    </div>
                  );
                })}

                {/* Uncategorized assets */}
                {assetsByCollection['Uncategorized'] && assetsByCollection['Uncategorized'].length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      padding: '8px 8px 4px 8px',
                      letterSpacing: '0.5px'
                    }}>
                      Uncategorized
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', padding: '8px' }}>
                      {assetsByCollection['Uncategorized'].map((asset) => (
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
                  </div>
                )}
              </>
            )}

            {/* When viewing specific type, show collections normally */}
            {activeTab !== 'all' && Object.entries(assetsByCollection).map(([collection, collectionAssets]) => {
            const isCollapsed = collapsedCollections.has(collection);
            const isUncategorized = collection === 'Uncategorized';
            const FolderIcon = isCollapsed ? Folder : FolderOpen;
            const collectionColor = collectionColors[collection];

            return (
              <div key={collection} style={{
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
              }}>
                {/* Collection Header - Droppable and Draggable */}
                <div
                  draggable={!isUncategorized}
                  onDragStart={(e) => !isUncategorized && handleCollectionDragStart(collection, e)}
                  onDragOver={(e) => {
                    handleCollectionDragOver(e);
                    handleCollectionDragOverForReorder(e);
                  }}
                  onDrop={(e) => {
                    handleCollectionDrop(isUncategorized ? null : collection, e);
                    handleCollectionDropForReorder(collection, e);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    background: draggedAsset && draggedAsset.collection !== collection
                      ? 'var(--accent-bg)'
                      : draggedCollection === collection
                      ? 'var(--bg-hover)'
                      : 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: draggedAsset && draggedAsset.collection !== collection
                      ? '2px dashed var(--accent-color)'
                      : draggedCollection && draggedCollection !== collection
                      ? '2px dashed var(--text-muted)'
                      : collectionColor
                      ? `2px solid ${collectionColor}`
                      : '2px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    cursor: isUncategorized ? 'default' : 'grab',
                    opacity: draggedCollection === collection ? 0.5 : 1,
                  }}
                >
                  {/* Drag Handle - Only for named collections */}
                  {!isUncategorized && (
                    <div
                      style={{
                        cursor: 'grab',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 4px'
                      }}
                      title="Drag to reorder"
                    >
                      <Move size={14} />
                    </div>
                  )}

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
                    <div style={{ display: 'flex', gap: '4px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      {/* Color Picker Button */}
                      <button
                        onClick={() => {
                          setColorPickerCollection(collection);
                          setCustomColorInput(collectionColor || '#6366f1');
                        }}
                        style={{
                          background: collectionColor || '#6366f1',
                          border: '2px solid var(--border)',
                          width: '24px',
                          height: '24px',
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
          })}
          </>
        ) : (
          <div className="asset-empty">
            <p>No assets found</p>
          </div>
        )}
      </div>

      {/* Custom Color Picker Dialog */}
      {colorPickerCollection && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setColorPickerCollection(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              maxWidth: '300px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Set Collection Color
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Choose a color
              </label>
              <input
                type="color"
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                style={{
                  width: '100%',
                  height: '50px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              />
              <input
                type="text"
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                placeholder="#6366f1"
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                onClick={() => setColorPickerCollection(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setCollectionColor(colorPickerCollection, customColorInput);
                  setColorPickerCollection(null);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
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
  const [showActions, setShowActions] = useState(false);
  const imgSrc = asset.thumbnailPath || asset.imagePath;

  useEffect(() => {
    console.log('🖼️ [AssetThumbnail] Rendering asset:', {
      id: asset.id,
      name: asset.name,
      imagePath: asset.imagePath,
      thumbnailPath: asset.thumbnailPath,
      usingSrc: imgSrc
    });
  }, [asset, imgSrc]);

  return (
    <div
      className="sidebar-asset-thumb"
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        outline: isSelected ? '3px solid var(--accent-color)' : 'none',
        outlineOffset: '-3px',
        position: 'relative',
      }}
    >
      {/* Edit Icon - Shows on hover */}
      {showActions && !isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(e);
          }}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            background: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Select asset"
        >
          <Edit2 size={12} style={{ color: 'white' }} />
        </button>
      )}

      {/* Selected Checkmark */}
      {isSelected && (
        <div
          onClick={onClick}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            background: 'var(--accent-color)',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            zIndex: 2,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
          title="Deselect asset"
        >
          ✓
        </div>
      )}

      <img
        src={imgSrc}
        alt={asset.name}
        loading="lazy"
        onError={() => {
          console.error('❌ [AssetThumbnail] Failed to load image:', imgSrc);
          console.error('Asset data:', asset);
        }}
        onLoad={() => {
          console.log('✅ [AssetThumbnail] Image loaded successfully:', imgSrc);
        }}
      />
      <span
        className="asset-name-label"
        title={asset.name}
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          width: '100%',
        }}
      >
        {asset.name}
      </span>
    </div>
  );
}

