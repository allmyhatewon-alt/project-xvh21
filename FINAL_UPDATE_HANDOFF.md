# Final Update Handoff

This workspace is the polished local version.

## Files to move into your current site

If your current site is another copy of the same project, copy these files over:

- `frontend/components/Hub/HubShell.tsx`
- `frontend/components/Hub/FeedView.tsx`
- `frontend/app/globals.css`
- `frontend/app/hub/all-boards/page.tsx`
- `frontend/app/hub/discover/page.tsx`
- `frontend/app/hub/space/edit/page.tsx`
- `frontend/app/api/pulse/route.ts`

## What changed

- Real dark/light hub theme toggle
- Cleaner light theme styling
- Home-only dashboard stack
- Board pages rebuilt as actual thread boards
- Better board directory
- Better discovery
- Creator level strip
- Upgraded spotlight templates

## How to update your current site

1. Open your current site project folder.
2. Replace the files above with the versions from this workspace.
3. In that project, run:

```powershell
cd frontend
npm install
npx tsc --noEmit
npm run build
```

4. If those pass, start it locally:

```powershell
npm run dev
```

5. If the current site is deployed, deploy the updated project the same way you already deploy that repo.

## If your current site is a different branch or repo

Do not replace the whole project folder.
Only merge the files listed above first, then test locally before pushing.

## Good sanity checks after moving it

- `/hub`
- `/hub/all-boards`
- `/hub/board/fanart`
- `/hub/clips`
- `/hub/discover`
- Toggle the hub theme button in the top bar
