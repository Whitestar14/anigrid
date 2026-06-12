# AniGrid Technical Debt & UX Review

## Interaction & UI
- [ ] **Popover Edge Constraints**: The cursor-relative popover positioning (Portal-based) needs a more robust boundary check. Currently, it can still clip off the screen on mobile or near edges despite the `useLayoutEffect` logic. Requires a review of the measurement timing and viewport calculations.
- [ ] **Native DnD Evaluation**: Re-evaluate the transition from `dnd-kit` back to native HTML5 `draggable` if latency persists in high-density grids.

## Data & Storage
- [ ] **Merge/Overwrite Restoration**: If the app storage is minimal/new, using the backup function should not prompt the user to merge/overwrite, it should just restore the data.

- Add a 'lock project' option to prevent edits in a project. Essentially working as a read-only mode to prevent accidental changes/edits.

## Critical Bugs & Proxy
- [x] **List View Dimension Bug**: Fixed rows * cols multiplication in list mode.
- [ ] **Robust Image Proxy**: Imgur, Pinterest, and Discord still intermittently return 403. Need to implement rotating User-Agents or a server-side cache that better simulates browser headers.
- [ ] **Pinterest Support**: Enhance proxy to handle Pinterest's strict anti-scraping for high-res images.
- [ ] **Fix Duplication Detection**: Dragging an image from a tier row to another triggers the Duplication warning modal. This behavior is similarly observed when an item is clicked/focused on in the inbox, and then after closing the inbox, the duplication warning appears after attempting to interact with the project
- **Fix Tap and Drop Accessibility**: Tap and drop doesn't work anymore. Expected behavior is a focused image is dropped into an empty cell destination the user clicked on, as an alternative to dragging, and will execute a swap operation if an image is already present in target cell
- **Fix Popover Trigger**: Popover triggers open by a weird ghost click of the adjacent empty cell to the target cell with the options 'Local File | From URL | etc', unnecessarily cluttering target zones.
**Fix Padding Issues**: Erroneous padding is present at the bottom of projects when visibility options are all disabled.
- [ ] **Fix Broken Image Tracking in Inbox**: When an image is returned from the project (grid, list, tier) back to the inbox, the inbox duplicates that image instead of updating the already tracked metadata.
- [ ] **Pan and Zoom Ergonomics**: Improve Pan and Zoom functionality on mobile devices (have it pop out with touch directed guided positioning)
- [ ] **Critical: 