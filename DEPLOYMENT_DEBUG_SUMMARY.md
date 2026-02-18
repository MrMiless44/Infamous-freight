# Firebase Deployment Debug Summary

**Date**: February 18, 2026  
**Status**: ✅ FIX IMPLEMENTED & PUSHED  
**Latest Workflow ID**: 22127419353

## Problem Identified

The GitHub Actions deployment was failing at the "Build Next.js for Firebase" step despite the build working perfectly locally.

**Root Cause**: The `prebuild` script in `apps/web/package.json` triggers a recursive workspace build via `pnpm -w --filter @infamous-freight/shared build`. This recursive build includes `apps/mobile` which tries to run `expo build` - a command that fails in GitHub Actions CI environment.

```json
// In apps/web/package.json:
"prebuild": "pnpm -w --filter @infamous-freight/shared build"
```

When running `pnpm build` or `npm run build`, this prebuild runs before the actual Next.js build, causing the entire build step to fail.

## Solution Implemented

Modified `.github/workflows/deploy-firebase-hosting.yml` to:

1. **Build shared package directly with npx**:
   ```bash
   cd packages/shared
   npx tsc -p tsconfig.json
   ```
   - Uses `npx tsc` instead of `pnpm`, avoiding recursive builds
   - Both are equivalent for TypeScript compilation
   - No need to invoke the workspace build

2. **Build Next.js directly with npx**:
   ```bash
   BUILD_TARGET=firebase NODE_ENV=production npx next build
   ```
   - Uses `npx next build` instead of `npm run build` or `pnpm build`
   - This bypasses the npm/pnpm `prebuild` script
   - Directly calls the Next.js CLI

3. **Added better diagnostics**:
   - Prints build output size
   - Lists files created
   - Captures node and next versions if build fails

## Testing Verification

**Local Tests (All Passed)**:
- ✅ `cd packages/shared && npx tsc -p tsconfig.json` → Compiled successfully
- ✅ `cd apps/web && BUILD_TARGET=firebase NODE_ENV=production npx next build` → Built successfully (45 pages, ~5.4MB)

**Commits Made**:
1. ✅ Commit `af0a750e`: First attempt (use npx next build)
2. ✅ Commit `c363d2e4`: Second attempt (use npx tsc for shared)

**Deployments Triggered**:
1. ❌ Workflow `22126867278` - Failed (used original approach)
2. ❌ Workflow `22127059065` - Failed (first fix, still used pnpm recursion)
3. ⏳ Workflow `22127419353` - In Progress (second fix with npx tsc and npx next build)

## Next Steps

If workflow `22127419353` succeeds:
- ✅ Firebase Hosting will be updated
- ✅ Website will be live at https://infamousfreight.web.app
- ✅ Custom domain https://infamousfreight.com will work (if DNS configured)

If workflow `22127419353` fails:
- Check the "Build Next.js for Firebase" step output
- Possible remaining issues:
  - Node.js version compatibility (using 24.x)
  - Next.js version compatibility  
  - Firebase dependencies issue
  - File system/permission issue in CI environment

## File Changes

**Modified**:
- `.github/workflows/deploy-firebase-hosting.yml`
  - Step 6: "Build shared package" → Use `npx tsc` directly
  - Step 7: "Build Next.js for Firebase" → Use `npx next build` directly
  - Added verbose diagnostics on build failure
  - Removed fallback to `pnpm build` (which caused issues)

**Not Modified** (working correctly):
- `apps/web/package.json` - Kept as-is (prebuild script doesn't run with npx)
- `apps/web/next.config.js` - Already has conditional output mode
- `apps/web/pages/*.tsx` - Already have conditional ISR
- `firebase.json` - Already correctly configured
- `packages/shared/package.json` - Already has tsc build script

## Deployment Checklist

- [x] Identify root cause (prebuild recursion with broken expo)
- [x] Fix workflow to avoid pnpm recursion  
- [x] Test locally that fixed commands work
- [x] Push fixes to GitHub
- [x] Monitor new deployment workflow
- [ ] Verify Firebase Hosting receives update
- [ ] Verify website loads at https://infamousfreight.web.app
- [ ] Verify custom domain works

## Key Insights

1. **npx vs npm/pnpm**: Using `npx <command>` directly calls the CLI binary, bypassing npm scripts
2. **Workspace recursion**: `pnpm -r` or `pnpm -w` triggers builds in ALL workspaces, not just the target
3. **CI/CD vs Local**: Mobile app's `expo build` fails in GitHub Actions (needs Expo credentials for CI building)
4. **Firebase static export**: Requires Next.js `output: "export"` mode when `BUILD_TARGET=firebase`

## References

- GitHub Workflow: `.github/workflows/deploy-firebase-hosting.yml`
- Web Package: `apps/web/package.json`
- Firebase Config: `firebase.json`
- Shared Package: `packages/shared/package.json`
