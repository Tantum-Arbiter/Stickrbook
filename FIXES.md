# Bug Fixes - March 17, 2026

## Issues Reported

1. **Project creation not appearing** - When creating a project, it doesn't show up in the project list
2. **Theme info box styling** - The storybook theme description box has a white background instead of matching the dark UI theme

## Fixes Applied

### 1. Theme Info Box Styling ✅

**File**: `src/components/generate/PromptInput.tsx` (lines 438-453)

**Changes**:
- Changed `background` from `#f5f5f5` (light gray) to `var(--bg-card)` (dark theme card background)
- Added `border: '1px solid var(--border)'` for consistency
- Changed `borderRadius` to use CSS variable `var(--radius-sm)`
- Added `color: 'var(--text)'` for text color
- Made theme label use `var(--accent)` color (teal)
- Made description use `var(--text-muted)` color

**Result**: The theme info box now matches the dark UI theme with proper colors and borders.

---

### 2. Project Creation Debugging 🔍

**Files Modified**:
- `src/mocks/browser.ts` - Added MSW request/response logging
- `src/store/projectsStore.ts` - Added console logging for project creation flow

**Debugging Added**:
```javascript
// MSW logs will show:
[MSW] Intercepted: POST http://localhost:5173/v1/storyboard/projects
[MSW] Mocked response for: POST http://localhost:5173/v1/storyboard/projects 200

// Project store logs will show:
[ProjectStore] Creating project: { name: "...", description: "..." }
[ProjectStore] API response: { project: {...} }
[ProjectStore] Transformed project: {...}
[ProjectStore] Project added to state
```

**How to Test**:
1. Open browser console (F12)
2. Click "New Project" button in the sidebar
3. Enter a project name
4. Watch the console for logs
5. Check if the project appears in the project list

**Possible Issues**:
- MSW might not be intercepting the request correctly
- The project list component might not be re-rendering
- The API response format might not match what the store expects

---

## Testing Instructions

### Test 1: Theme Info Box
1. Open http://localhost:5173
2. Look at the "Generate" panel
3. Click the "📖 Storybook Theme (Art Style)" dropdown
4. Select any theme (e.g., "🧚 Classic Fairy Tale")
5. **Expected**: A dark-themed info box appears below with teal accent color
6. **Before**: Box had white background
7. **After**: Box has dark background matching the UI

### Test 2: Project Creation
1. Open browser console (F12 → Console tab)
2. Click the sidebar (left side)
3. Look for a "New Project" or "+" button
4. Click it and enter a project name (e.g., "Test Project")
5. **Watch console for**:
   - `[MSW] Intercepted: POST ...`
   - `[ProjectStore] Creating project: ...`
   - `[ProjectStore] Project added to state`
6. **Expected**: Project appears in the project list
7. **If not**: Check console for errors

---

## Next Steps

If project creation still doesn't work:

1. **Check MSW is enabled**:
   - Verify `.env` has `VITE_USE_MOCKS=true`
   - Look for `[MSW]` logs in console

2. **Check the project list component**:
   - It might not be subscribing to store updates
   - Try refreshing the page after creating a project

3. **Check the API response format**:
   - The mock might be returning data in a different format than expected
   - Compare mock response with what the store expects

4. **Potential fix needed**:
   - The `ProjectTree` component might need to use Zustand's `useProjectsStore` hook properly
   - The component might not be re-rendering when projects change

---

## Files Changed

- `src/components/generate/PromptInput.tsx` - Theme box styling
- `src/mocks/browser.ts` - MSW logging
- `src/store/projectsStore.ts` - Debug logging

All changes have been committed and pushed to the repository.

