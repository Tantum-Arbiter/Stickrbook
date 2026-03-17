/**
 * KeyboardManager
 * 
 * Manages keyboard shortcuts and hotkeys.
 */

export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
};

export class KeyboardManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.setupDefaultShortcuts();
    this.attachListeners();
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean, meta?: boolean): void {
    const shortcutKey = this.getShortcutKey({ key, ctrl, shift, alt, meta } as KeyboardShortcut);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Enable keyboard shortcuts
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable keyboard shortcuts
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Setup default shortcuts
   */
  private setupDefaultShortcuts(): void {
    // These will be registered by the application
  }

  /**
   * Attach keyboard event listeners
   */
  private attachListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const shortcutKey = this.getShortcutKey({
      key: event.key.toLowerCase(),
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    } as KeyboardShortcut);

    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }

  /**
   * Generate unique key for shortcut
   */
  private getShortcutKey(shortcut: Partial<KeyboardShortcut>): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');
    parts.push(shortcut.key || '');
    return parts.join('+');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.shortcuts.clear();
  }
}

/**
 * Default keyboard shortcuts for the photo editor
 */
export const DEFAULT_SHORTCUTS = {
  // File operations
  SAVE: { key: 's', ctrl: true, description: 'Save document' },
  EXPORT: { key: 'e', ctrl: true, shift: true, description: 'Export document' },
  
  // Edit operations
  UNDO: { key: 'z', ctrl: true, description: 'Undo' },
  REDO: { key: 'z', ctrl: true, shift: true, description: 'Redo' },
  CUT: { key: 'x', ctrl: true, description: 'Cut' },
  COPY: { key: 'c', ctrl: true, description: 'Copy' },
  PASTE: { key: 'v', ctrl: true, description: 'Paste' },
  DELETE: { key: 'delete', description: 'Delete selected layers' },
  DUPLICATE: { key: 'd', ctrl: true, description: 'Duplicate selected layers' },
  SELECT_ALL: { key: 'a', ctrl: true, description: 'Select all layers' },
  DESELECT: { key: 'd', ctrl: true, shift: true, description: 'Deselect all' },
  
  // View operations
  ZOOM_IN: { key: '+', ctrl: true, description: 'Zoom in' },
  ZOOM_OUT: { key: '-', ctrl: true, description: 'Zoom out' },
  ZOOM_FIT: { key: '0', ctrl: true, description: 'Fit to screen' },
  ZOOM_100: { key: '1', ctrl: true, description: 'Zoom to 100%' },
  
  // Tools
  SELECT_TOOL: { key: 'v', description: 'Select tool' },
  MOVE_TOOL: { key: 'm', description: 'Move tool' },
  BRUSH_TOOL: { key: 'b', description: 'Brush tool' },
  ERASER_TOOL: { key: 'e', description: 'Eraser tool' },
  TEXT_TOOL: { key: 't', description: 'Text tool' },
  SHAPE_TOOL: { key: 'u', description: 'Shape tool' },
  CROP_TOOL: { key: 'c', description: 'Crop tool' },
  EYEDROPPER_TOOL: { key: 'i', description: 'Eyedropper tool' },
  
  // Layers
  NEW_LAYER: { key: 'n', ctrl: true, shift: true, description: 'New layer' },
  MERGE_DOWN: { key: 'e', ctrl: true, description: 'Merge down' },
  FLATTEN: { key: 'e', ctrl: true, shift: true, description: 'Flatten image' },
  
  // Transform
  FREE_TRANSFORM: { key: 't', ctrl: true, description: 'Free transform' },
  FLIP_HORIZONTAL: { key: 'h', ctrl: true, description: 'Flip horizontal' },
  FLIP_VERTICAL: { key: 'v', ctrl: true, shift: true, description: 'Flip vertical' },
};

