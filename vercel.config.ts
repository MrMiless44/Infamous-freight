import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  devCommand: 'pnpm --filter web dev',
};
