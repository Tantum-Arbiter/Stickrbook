/**
 * AssetLibrary Component
 *
 * Asset browser with filtering, search, and drag-to-canvas support.
 * Uses extracted CSS from legacy storyboard (asset-grid.css).
 */

import { useCallback, useState, useMemo } from 'react';
import { useProjectsStore } from '../../store';
import type { Asset, AssetType } from '../../store/types';
import {
  Package,
  User,
  Image,
  Palette,
  Paperclip,
  Search,
  ChevronDown,
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
            return (
              <div key={collection} style={{ marginBottom: '16px' }}>
                {/* Collection Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                  onClick={() => toggleCollection(collection)}
                >
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  <span>{collection}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {collectionAssets.length}
                  </span>
                </div>

                {/* Collection Assets */}
                {!isCollapsed && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                    {collectionAssets.map((asset) => (
                      <AssetThumbnail
                        key={asset.id}
                        asset={asset}
                        onClick={() => onAssetClick?.(asset)}
                        onDragStart={(e) => onAssetDragStart?.(asset, e)}
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
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

function AssetThumbnail({ asset, onClick, onDragStart }: AssetThumbnailProps) {
  return (
    <div
      className="sidebar-asset-thumb"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      <img
        src={asset.thumbnailPath || asset.imagePath}
        alt={asset.name}
        loading="lazy"
      />
      <span className="asset-name-label">{asset.name}</span>
    </div>
  );
}

