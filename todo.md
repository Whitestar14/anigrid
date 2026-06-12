# AniGrid Technical Debt & UX Review

## Interaction & UI
- [ ] **Popover Edge Constraints**: The cursor-relative popover positioning (Portal-based) needs a more robust boundary check. Currently, it can still clip off the screen on mobile or near edges despite the `useLayoutEffect` logic. Requires a review of the measurement timing and viewport calculations.
- [ ] **Native DnD Evaluation**: Re-evaluate the transition from `dnd-kit` back to native HTML5 `draggable` if latency persists in high-density grids.

## Data & Storage
- [ ] **Merge/Overwrite Restoration**: If the app storage is minimal/new, using the backup function should not prompt the user to merge/overwrite, it should just restore the data.


## Critical Bugs & Proxy
- [x] **List View Dimension Bug**: Fixed rows * cols multiplication in list mode.
- [ ] **Robust Image Proxy**: Imgur, Pinterest, and Discord still intermittently return 403. Need to implement rotating User-Agents or a server-side cache that better simulates browser headers.
- [ ] **Pinterest Support**: Enhance proxy to handle Pinterest's strict anti-scraping for high-res images.
- [ ] **Fix Duplication Detection**: Dragging an image from a tier row to another triggers the Duplication warning modal
- [ ] **Fix Broken Image Tracking in Inbox**: When an image is returned from the project (grid, list, tier) back to the inbox, the inbox duplicates that image instead of updating the already tracked metadata.
