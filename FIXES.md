# Bug Fixes - March 17, 2026

## Summary

All critical issues for Mock Mode have been resolved! The app now works fully without a backend.

---

## Issue 1: 502 Bad Gateway - MSW Service Worker Missing ✅

**Status:** FIXED
**Commit:** `92d9124`

### Problem
The app returned 502 Bad Gateway errors for all API calls, even with `VITE_USE_MOCKS=true` set.

### Root Cause
MSW (Mock Service Worker) requires a service worker file (`mockServiceWorker.js`) in the `public/` directory to intercept network requests. This file was missing.

### Solution
Ran `npx msw init public/` to generate the required service worker file.

### Files Changed
- `public/mockServiceWorker.js` (created)
- `package.json` (updated with msw.workerDirectory)

---

## Issue 2: Theme Info Box - White Background ✅

**Status:** FIXED
**Commit:** `3a06d48`

### Problem
The storybook theme description box displayed with a white background, inconsistent with the dark theme.

### Root Cause
The info box used hardcoded light colors instead of CSS variables.

### Solution
Updated styling to use theme CSS variables:
- `background: 'var(--bg-card)'`
- `border: '1px solid var(--border)'`
- `color: 'var(--text)'`

### Files Changed
- `src/components/generate/PromptInput.tsx`

---

## Issue 3: No UI to Create Books ✅

**Status:** FIXED
**Commit:** `a23be2e`

### Problem
Users could create projects but had no way to create books within those projects.

### Root Cause
The `ProjectTree` component displayed books but lacked a "+ New Book" button.

### Solution
Added a "+ New Book" button to each project that:
- Prompts for book title
- Creates book with default preset
- Shows success/error toast notifications

### Files Changed
- `src/components/sidebar/ProjectTree.tsx`

---

## Issue 4: App Keeps Asking to Select a Book ✅

**Status:** FIXED
**Commit:** `16f90db`

### Problem
After creating a book, the app still showed "Please create or select a book first" when generating images.

### Root Cause
The `createBook` function set `currentBookId` but not `currentProjectId`. The `currentBook()` selector requires both:
1. Find current project using `currentProjectId`
2. Find book within that project using `currentBookId`

Without `currentProjectId`, it couldn't find the project, so it couldn't find the book.

### Solution
Added `currentProjectId: projectId` to the state update when creating a book.

### Files Changed
- `src/store/projectsStore.ts`

---

## Issue 5: 502 Bad Gateway When Polling Job Status ✅

**Status:** FIXED
**Commit:** `cfde281`

### Problem
After clicking "Generate", the app polled for job status and got 502 Bad Gateway errors.

### Root Cause
MSW handlers listened for `/v1/jobs/:jobId` but the API client called `/v1/storyboard/jobs/:jobId` (because `API_BASE = '/v1/storyboard'`).

### Solution
Updated MSW handlers to match the full API path:
- Changed `/v1/jobs/:jobId` → `/v1/storyboard/jobs/:jobId`
- Changed `/v1/jobs/:jobId` (DELETE) → `/v1/storyboard/jobs/:jobId`

### Files Changed
- `src/test/mocks/handlers.ts`

---

## Complete Workflow Test

1. **Refresh browser** at http://localhost:5173
2. **Create a project:**
   - Click "+ New" in Projects section
   - Enter project name
   - Verify project appears in sidebar
3. **Create a book:**
   - Expand the project
   - Click "+ New Book"
   - Enter book title
   - Verify book appears and is selected
4. **Generate images:**
   - Go to Generate tab
   - Select a storybook theme
   - Enter a prompt
   - Click "Generate"
   - Verify 4 placeholder images appear (no 502 errors)
5. **Verify theme:**
   - Check that the theme info box has dark background

---

## All Files Changed

- `public/mockServiceWorker.js` - MSW service worker (created)
- `src/components/generate/PromptInput.tsx` - Theme box styling
- `src/components/sidebar/ProjectTree.tsx` - Book creation UI
- `src/store/projectsStore.ts` - Auto-select project when creating book
- `src/test/mocks/handlers.ts` - Fixed job endpoint paths
- `src/mocks/browser.ts` - MSW logging (debugging)
- `package.json` - MSW configuration

All changes have been committed and pushed to the repository.

