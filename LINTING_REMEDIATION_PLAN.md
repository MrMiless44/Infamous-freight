# Linting Remediation Plan

## Current Status
- **Total Issues**: 611 problems (535 errors, 76 warnings)
- **Fixable with --fix**: 3 errors

## Issue Categories

### 1. Console Statement Violations (Priority: HIGH)
**Count**: ~400+ violations

**Affected Files**:
- `api/database.js` - 5 violations
- `api/logger.js` - 4 violations  
- `api/src/**/*.ts` - Multiple files with console statements
- `api/src/services/*.js` - Multiple files

**Remediation Strategy**:
1. **Phase 1**: Replace console.error/warn with Pino logger (already available)
   - Import Pino logger from `api/logger.js`
   - Replace `console.error()` → `logger.error()`
   - Replace `console.warn()` → `logger.warn()`
   - Replace `console.info()` → `logger.info()`
   - Replace `console.log()` → `logger.debug()`

2. **Phase 2**: Add structured logging context
   - Add correlation IDs
   - Add request context
   - Add user context where applicable

3. **Phase 3**: Update logger.js itself
   - Remove console fallbacks
   - Ensure Pino is always used

**Example Fix**:
```javascript
// Before
console.error('Error connecting to database:', error);

// After
logger.error({ err: error }, 'Error connecting to database');
```

### 2. Unused Variables (Priority: MEDIUM)
**Count**: ~76 warnings

**Categories**:
- Unused imports (prefix with `_` to indicate intentionally unused)
- Unused function parameters (use destructuring with rest)
- Variables assigned but never read

**Remediation Strategy**:
```javascript
// Before
import { createWriteStream } from 'fs';
function handler(req, res, next) { ... }

// After  
import { createWriteStream as _createWriteStream } from 'fs';
function handler(_req, res, next) { ... }
```

### 3. Missing Globals (Priority: HIGH)
**Count**: ~10 violations

**Files Affected**:
- `api/src/worker/heartbeat.js` - setInterval, clearInterval not defined

**Remediation**:
- Add Node.js globals to ESLint config
- Or add `/* global setInterval, clearInterval */` comment

### 4. TypeScript Any Types (Priority: LOW)
**Count**: ~76 warnings

**Strategy**: Progressive enhancement
- Document with TODO comments for future improvement
- Focus on public APIs first
- Internal utilities can remain `any` for now

### 5. Other Issues
- Empty block statements: Add comments or remove
- Unnecessary escape characters: Fix regex patterns
- Prefer const over let: Auto-fixable with `--fix`

## Implementation Plan

### Week 1: Critical Fixes
- [ ] Fix ESLint config for Node.js globals
- [ ] Run `pnpm lint --fix` for auto-fixable issues
- [ ] Replace console statements in critical paths (routes, middleware)

### Week 2: Systematic Replacement
- [ ] Create logger wrapper utility
- [ ] Update all database.js files
- [ ] Update all route handlers
- [ ] Update all middleware

### Week 3: Cleanup
- [ ] Fix unused variable warnings
- [ ] Add TODO comments for TypeScript any types
- [ ] Update ESLint to error on new violations

### Week 4: Validation
- [ ] Run full linting suite
- [ ] Ensure CI passes
- [ ] Update PR checks to enforce linting

## Tooling Support

### Auto-fix Script
```bash
#!/bin/bash
# Fix auto-fixable issues
pnpm lint --fix

# Show remaining issues
pnpm lint --format=json > lint-report.json
```

### Logger Migration Script
**Note**: Manual review required for each change. Do NOT use automated find-and-replace.

Recommended approach:
1. Use ESLint with auto-fix for simple cases
2. Manual review for complex logging statements
3. Consider using AST-based tools like jscodeshift for safer transformations

Example jscodeshift transformation:
```javascript
// transform-console-to-logger.js
module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  // Transform console.error to logger.error
  root.find(j.CallExpression, {
    callee: {
      object: { name: 'console' },
      property: { name: 'error' }
    }
  }).replaceWith(path => {
    const args = path.node.arguments;
    return j.callExpression(
      j.memberExpression(j.identifier('logger'), j.identifier('error')),
      args
    );
  });
  
  return root.toSource();
};
```

## Metrics & Tracking

| Metric | Target | Current |
|--------|--------|---------|
| Total Violations | 0 | 611 |
| Console Statements | 0 | ~400 |
| Unused Variables | <10 | 76 |
| TypeScript any | <50 | 76 |
| Linting Pass Rate | 100% | 0% |

## References
- [Pino Logger Documentation](https://getpino.io/)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
