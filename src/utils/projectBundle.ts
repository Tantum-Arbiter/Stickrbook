/**
 * Project Bundle Utilities
 * 
 * Handles export/import of projects as .story ZIP bundles.
 * Bundle format:
 * - manifest.json: Version and metadata
 * - project.json: Full project state
 * - assets/: Image files referenced by the project
 * - thumbnails/preview.png: Optional preview
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Project, Book, Page, Asset, Character, LayerOverlay } from '../store/types';

// ============================================================
// Bundle Types
// ============================================================

export const BUNDLE_VERSION = '1.0.0';
export const BUNDLE_FORMAT = 'colearn-story';
export const BUNDLE_EXTENSION = '.story';

export interface BundleManifest {
  version: string;
  format: string;
  createdAt: string;
  createdBy: string;
  projectId: string;
  projectName: string;
  assetCount: number;
  pageCount: number;
}

export interface BundleProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  books: BundleBook[];
}

export interface BundleBook {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  width: number;
  height: number;
  coverImage?: string;
  presetName?: string;
  artStyle?: string;
  referencePrompt?: string;
  negativePrompt?: string;
  defaultSteps: number;
  defaultCfg: number;
  defaultModel?: string;
  pages: BundlePage[];
  characters: BundleCharacter[];
  assets: BundleAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface BundlePage {
  id: string;
  bookId: string;
  name: string;
  pageNumber: number;
  width: number;
  height: number;
  baseImage?: string; // Reference to assets/{id}.png
  textContent?: string;
  textTitle?: string;
  textLayout: string;
  overlays: LayerOverlay[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BundleAsset {
  id: string;
  bookId?: string;
  name: string;
  description?: string;
  assetType: string;
  bundlePath: string; // Path within ZIP: assets/{id}.{ext}
  originalPath: string; // Original URL/path for reference
  thumbnailPath?: string;
  hasTransparency: boolean;
  seed?: number;
  prompt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BundleCharacter {
  id: string;
  bookId: string;
  name: string;
  description?: string;
  prompt?: string;
  seed?: number;
  referenceImage?: string; // Reference to assets/{id}.png
  features?: Record<string, string>;
  colorPalette?: string[];
  poseAssetIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Fetch an image and return as Blob
 */
async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    console.warn(`Failed to fetch image: ${url}`);
    return null;
  }
}

/**
 * Get file extension from URL or path
 */
function getExtension(path: string): string {
  const match = path.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : 'png';
}

/**
 * Generate a safe filename from asset ID
 */
function assetFilename(id: string, originalPath: string): string {
  const ext = getExtension(originalPath);
  return `${id}.${ext}`;
}

// ============================================================
// Export Functions
// ============================================================

/**
 * Export a project as a .story ZIP bundle
 */
export async function exportProjectBundle(
  project: Project,
  onProgress?: (message: string, progress: number) => void
): Promise<void> {
  const zip = new JSZip();
  const assetsFolder = zip.folder('assets');
  const thumbnailsFolder = zip.folder('thumbnails');

  if (!assetsFolder || !thumbnailsFolder) {
    throw new Error('Failed to create ZIP folders');
  }

  // Track all assets to include
  const assetMap = new Map<string, { blob: Blob; filename: string }>();
  let totalAssets = 0;
  let processedAssets = 0;

  // Count total assets
  for (const book of project.books) {
    totalAssets += book.assets.length;
    for (const page of book.pages) {
      if (page.imagePath) totalAssets++;
    }
    for (const char of book.characters) {
      if (char.referenceImagePath) totalAssets++;
    }
  }

  onProgress?.('Preparing project data...', 0);

  // Process all books and collect assets
  const bundleBooks: BundleBook[] = [];

  for (const book of project.books) {
    const bundleAssets: BundleAsset[] = [];
    const bundlePages: BundlePage[] = [];
    const bundleCharacters: BundleCharacter[] = [];

    // Process assets
    for (const asset of book.assets) {
      processedAssets++;
      onProgress?.(`Processing asset ${processedAssets}/${totalAssets}...`, (processedAssets / totalAssets) * 50);

      const filename = assetFilename(asset.id, asset.imagePath);
      const blob = await fetchImageAsBlob(asset.imagePath);

      if (blob) {
        assetMap.set(asset.id, { blob, filename });
      }

      bundleAssets.push({
        id: asset.id,
        bookId: asset.bookId,
        name: asset.name,
        description: asset.description,
        assetType: asset.assetType,
        bundlePath: `assets/${filename}`,
        originalPath: asset.imagePath,
        thumbnailPath: asset.thumbnailPath,
        hasTransparency: asset.hasTransparency,
        seed: asset.seed,
        prompt: asset.prompt,
        tags: asset.tags,
        metadata: asset.metadata,
        createdAt: asset.createdAt,
      });
    }

    // Process pages
    for (const page of book.pages) {
      let baseImage: string | undefined;

      if (page.imagePath) {
        processedAssets++;
        onProgress?.(`Processing page ${page.name}...`, (processedAssets / totalAssets) * 50);

        const pageAssetId = `page-${page.id}`;
        const filename = assetFilename(pageAssetId, page.imagePath);
        const blob = await fetchImageAsBlob(page.imagePath);

        if (blob) {
          assetMap.set(pageAssetId, { blob, filename });
          baseImage = `assets/${filename}`;
        }
      }

      bundlePages.push({
        id: page.id,
        bookId: page.bookId,
        name: page.name,
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        baseImage,
        textContent: page.textContent,
        textTitle: page.textTitle,
        textLayout: page.textLayout,
        overlays: page.overlays,
        status: page.status,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      });
    }

    // Process characters
    for (const char of book.characters) {
      let referenceImage: string | undefined;

      if (char.referenceImagePath) {
        processedAssets++;
        onProgress?.(`Processing character ${char.name}...`, (processedAssets / totalAssets) * 50);

        const charAssetId = `char-${char.id}`;
        const filename = assetFilename(charAssetId, char.referenceImagePath);
        const blob = await fetchImageAsBlob(char.referenceImagePath);

        if (blob) {
          assetMap.set(charAssetId, { blob, filename });
          referenceImage = `assets/${filename}`;
        }
      }

      bundleCharacters.push({
        id: char.id,
        bookId: char.bookId,
        name: char.name,
        description: char.description,
        prompt: char.prompt,
        seed: char.seed,
        referenceImage,
        features: char.features,
        colorPalette: char.colorPalette,
        poseAssetIds: char.poseAssetIds,
        createdAt: char.createdAt,
        updatedAt: char.updatedAt,
      });
    }

    bundleBooks.push({
      id: book.id,
      projectId: book.projectId,
      title: book.title,
      description: book.description,
      width: book.width,
      height: book.height,
      coverImage: book.coverImage,
      presetName: book.presetName,
      artStyle: book.artStyle,
      referencePrompt: book.referencePrompt,
      negativePrompt: book.negativePrompt,
      defaultSteps: book.defaultSteps,
      defaultCfg: book.defaultCfg,
      defaultModel: book.defaultModel,
      pages: bundlePages,
      characters: bundleCharacters,
      assets: bundleAssets,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    });
  }

  onProgress?.('Adding assets to bundle...', 55);

  // Add all collected assets to ZIP
  let assetIndex = 0;
  for (const [, { blob, filename }] of assetMap) {
    assetIndex++;
    onProgress?.(`Adding asset ${assetIndex}/${assetMap.size}...`, 55 + (assetIndex / assetMap.size) * 30);
    assetsFolder.file(filename, blob);
  }

  // Create project.json
  const bundleProject: BundleProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    books: bundleBooks,
  };

  onProgress?.('Creating manifest...', 90);

  // Create manifest.json
  const manifest: BundleManifest = {
    version: BUNDLE_VERSION,
    format: BUNDLE_FORMAT,
    createdAt: new Date().toISOString(),
    createdBy: 'Colearn Story Creator',
    projectId: project.id,
    projectName: project.name,
    assetCount: assetMap.size,
    pageCount: bundleBooks.reduce((sum, b) => sum + b.pages.length, 0),
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('project.json', JSON.stringify(bundleProject, null, 2));

  onProgress?.('Generating ZIP file...', 95);

  // Generate and download
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  onProgress?.('Downloading...', 100);

  // Create safe filename
  const safeName = project.name.replace(/[^a-zA-Z0-9-_]/g, '_');
  saveAs(blob, `${safeName}${BUNDLE_EXTENSION}`);
}

// ============================================================
// Import Functions
// ============================================================

export interface ImportResult {
  manifest: BundleManifest;
  project: BundleProject;
  assets: Map<string, Blob>;
}

/**
 * Import a .story ZIP bundle
 */
export async function importProjectBundle(
  file: File,
  onProgress?: (message: string, progress: number) => void
): Promise<ImportResult> {
  onProgress?.('Reading bundle file...', 0);

  const zip = await JSZip.loadAsync(file);

  // Read and validate manifest
  onProgress?.('Reading manifest...', 10);
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Invalid bundle: missing manifest.json');
  }

  const manifestContent = await manifestFile.async('string');
  const manifest: BundleManifest = JSON.parse(manifestContent);

  // Validate format
  if (manifest.format !== BUNDLE_FORMAT) {
    throw new Error(`Invalid bundle format: expected ${BUNDLE_FORMAT}, got ${manifest.format}`);
  }

  // Check version compatibility
  const [majorVersion] = manifest.version.split('.');
  const [currentMajor] = BUNDLE_VERSION.split('.');
  if (majorVersion !== currentMajor) {
    throw new Error(`Incompatible bundle version: ${manifest.version} (current: ${BUNDLE_VERSION})`);
  }

  // Read project data
  onProgress?.('Reading project data...', 20);
  const projectFile = zip.file('project.json');
  if (!projectFile) {
    throw new Error('Invalid bundle: missing project.json');
  }

  const projectContent = await projectFile.async('string');
  const project: BundleProject = JSON.parse(projectContent);

  // Read all assets
  onProgress?.('Loading assets...', 30);
  const assets = new Map<string, Blob>();
  const assetsFolder = zip.folder('assets');

  if (assetsFolder) {
    const assetFiles = Object.keys(zip.files).filter(
      (path) => path.startsWith('assets/') && !path.endsWith('/')
    );

    let loadedAssets = 0;
    for (const assetPath of assetFiles) {
      const assetFile = zip.file(assetPath);
      if (assetFile) {
        const blob = await assetFile.async('blob');
        assets.set(assetPath, blob);
        loadedAssets++;
        onProgress?.(
          `Loading asset ${loadedAssets}/${assetFiles.length}...`,
          30 + (loadedAssets / assetFiles.length) * 60
        );
      }
    }
  }

  onProgress?.('Import complete!', 100);

  return { manifest, project, assets };
}

/**
 * Convert imported bundle to frontend Project type
 */
export function convertBundleToProject(
  result: ImportResult,
  generateNewIds: boolean = true
): { project: Project; assetBlobs: Map<string, Blob> } {
  const { project: bundleProject, assets } = result;

  // Create a map to convert bundle asset paths to blob URLs
  const assetBlobs = new Map<string, Blob>();

  // Helper to generate new ID or keep existing
  const maybeNewId = (id: string) =>
    generateNewIds ? `${id}-${Date.now().toString(36)}` : id;

  // Convert books
  const books: Book[] = bundleProject.books.map((bundleBook) => {
    // Convert assets
    const bookAssets: Asset[] = bundleBook.assets.map((bundleAsset) => {
      // Get the blob from the ZIP
      const blob = assets.get(bundleAsset.bundlePath);
      if (blob) {
        assetBlobs.set(bundleAsset.id, blob);
      }

      return {
        id: maybeNewId(bundleAsset.id),
        bookId: bundleAsset.bookId,
        name: bundleAsset.name,
        description: bundleAsset.description,
        assetType: bundleAsset.assetType as Asset['assetType'],
        imagePath: bundleAsset.bundlePath, // Will be converted to blob URL
        thumbnailPath: bundleAsset.thumbnailPath,
        hasTransparency: bundleAsset.hasTransparency,
        seed: bundleAsset.seed,
        prompt: bundleAsset.prompt,
        tags: bundleAsset.tags,
        metadata: bundleAsset.metadata,
        createdAt: bundleAsset.createdAt,
      };
    });

    // Convert pages
    const pages: Page[] = bundleBook.pages.map((bundlePage) => {
      // Handle base image
      if (bundlePage.baseImage) {
        const blob = assets.get(bundlePage.baseImage);
        if (blob) {
          assetBlobs.set(`page-${bundlePage.id}`, blob);
        }
      }

      return {
        id: maybeNewId(bundlePage.id),
        bookId: bundlePage.bookId,
        name: bundlePage.name,
        pageNumber: bundlePage.pageNumber,
        width: bundlePage.width,
        height: bundlePage.height,
        imagePath: bundlePage.baseImage,
        textContent: bundlePage.textContent,
        textTitle: bundlePage.textTitle,
        textLayout: bundlePage.textLayout as Page['textLayout'],
        overlays: bundlePage.overlays,
        status: bundlePage.status as Page['status'],
        createdAt: bundlePage.createdAt,
        updatedAt: bundlePage.updatedAt,
      };
    });

    // Convert characters
    const characters: Character[] = bundleBook.characters.map((bundleChar) => {
      if (bundleChar.referenceImage) {
        const blob = assets.get(bundleChar.referenceImage);
        if (blob) {
          assetBlobs.set(`char-${bundleChar.id}`, blob);
        }
      }

      return {
        id: maybeNewId(bundleChar.id),
        bookId: bundleChar.bookId,
        name: bundleChar.name,
        description: bundleChar.description,
        prompt: bundleChar.prompt,
        seed: bundleChar.seed,
        referenceImagePath: bundleChar.referenceImage,
        features: bundleChar.features,
        colorPalette: bundleChar.colorPalette,
        poseAssetIds: bundleChar.poseAssetIds,
        createdAt: bundleChar.createdAt,
        updatedAt: bundleChar.updatedAt,
      };
    });

    return {
      id: maybeNewId(bundleBook.id),
      projectId: bundleBook.projectId,
      title: bundleBook.title,
      description: bundleBook.description,
      width: bundleBook.width,
      height: bundleBook.height,
      coverImage: bundleBook.coverImage,
      presetName: bundleBook.presetName,
      artStyle: bundleBook.artStyle,
      referencePrompt: bundleBook.referencePrompt,
      negativePrompt: bundleBook.negativePrompt,
      defaultSteps: bundleBook.defaultSteps,
      defaultCfg: bundleBook.defaultCfg,
      defaultModel: bundleBook.defaultModel,
      pages,
      characters,
      assets: bookAssets,
      createdAt: bundleBook.createdAt,
      updatedAt: bundleBook.updatedAt,
    };
  });

  const project: Project = {
    id: maybeNewId(bundleProject.id),
    name: bundleProject.name,
    description: bundleProject.description,
    createdAt: bundleProject.createdAt,
    updatedAt: bundleProject.updatedAt,
    books,
  };

  return { project, assetBlobs };
}

