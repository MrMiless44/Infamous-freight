import type { VercelConfig } from '@vercel/config/v1';
 
export const config: VercelConfig = {
  buildCommand:
    'cd web && bash scripts/validate-build.sh && cd .. && pnpm --filter web build',
};
