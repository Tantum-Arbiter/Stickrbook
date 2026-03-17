/**
 * UI Store - Zustand store for sidebar state, tabs, modals, and toasts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState, ToastMessage } from './types';

// Helper to generate short IDs
const generateId = () => Math.random().toString(36).substring(2, 10);

// Default sidebar widths
const DEFAULT_LEFT_SIDEBAR_WIDTH = 280;
const DEFAULT_RIGHT_SIDEBAR_WIDTH = 320;

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Sidebar state
      leftSidebarWidth: DEFAULT_LEFT_SIDEBAR_WIDTH,
      leftSidebarCollapsed: false,
      rightSidebarWidth: DEFAULT_RIGHT_SIDEBAR_WIDTH,
      rightSidebarCollapsed: true,
      sidebarZoom: 1.0, // Default zoom level

      // Text scale setting (1.0 = 100%, 0.8 = 80%, 1.2 = 120%)
      textScale: 1.0,

      // Tab state
      activeTab: 'generate',

      // Modal state
      activeModal: null,
      modalProps: {},

      // Panel state
      expandedPanels: ['projects', 'assets'],

      // Notifications
      toasts: [],

      // Loading states
      isLoading: false,
      loadingMessage: null,

      // Sidebar actions
      setLeftSidebarWidth: (width: number) => {
        set({ leftSidebarWidth: Math.max(200, Math.min(500, width)) });
      },

      toggleLeftSidebar: () => {
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed }));
      },

      setRightSidebarWidth: (width: number) => {
        set({ rightSidebarWidth: Math.max(200, Math.min(500, width)) });
      },

      toggleRightSidebar: () => {
        set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed }));
      },

      setSidebarZoom: (zoom: number) => {
        set({ sidebarZoom: Math.max(0.5, Math.min(2.0, zoom)) });
      },

      setTextScale: (scale: number) => {
        const clampedScale = Math.max(0.7, Math.min(1.5, scale));
        set({ textScale: clampedScale });
        // Update CSS variable
        document.documentElement.style.setProperty('--text-scale', clampedScale.toString());
      },

      // Tab actions
      setActiveTab: (tab: UIState['activeTab']) => {
        set({ activeTab: tab });
      },

      // Modal actions
      openModal: (modalId: string, props?: Record<string, unknown>) => {
        set({ activeModal: modalId, modalProps: props || {} });
      },

      closeModal: () => {
        set({ activeModal: null, modalProps: {} });
      },

      // Panel actions
      togglePanel: (panelId: string) => {
        set((state) => {
          const isExpanded = state.expandedPanels.includes(panelId);
          return {
            expandedPanels: isExpanded
              ? state.expandedPanels.filter((id) => id !== panelId)
              : [...state.expandedPanels, panelId],
          };
        });
      },

      expandPanel: (panelId: string) => {
        set((state) => ({
          expandedPanels: state.expandedPanels.includes(panelId)
            ? state.expandedPanels
            : [...state.expandedPanels, panelId],
        }));
      },

      collapsePanel: (panelId: string) => {
        set((state) => ({
          expandedPanels: state.expandedPanels.filter((id) => id !== panelId),
        }));
      },

      // Toast actions
      addToast: (toast: Omit<ToastMessage, 'id'>) => {
        const newToast: ToastMessage = {
          ...toast,
          id: generateId(),
        };
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove after duration (default 5 seconds)
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(newToast.id);
          }, duration);
        }
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },

      // Loading actions
      setLoading: (isLoading: boolean, message?: string) => {
        set({
          isLoading,
          loadingMessage: isLoading ? (message || null) : null,
        });
      },
    }),
    {
      name: 'storyboard-ui-storage',
      partialize: (state) => ({
        // Only persist sidebar preferences and settings
        leftSidebarWidth: state.leftSidebarWidth,
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        rightSidebarWidth: state.rightSidebarWidth,
        rightSidebarCollapsed: state.rightSidebarCollapsed,
        expandedPanels: state.expandedPanels,
        textScale: state.textScale,
      }),
    }
  )
);

