/**
 * Application Configuration
 */

// API Base URL - defaults to local backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1';

// Environment
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

// Feature Flags
export const FEATURES = {
  MAGIC_MERGE: true,
  ADVANCED_EDITOR: true,
  COMFYUI_INTEGRATION: false,
};

