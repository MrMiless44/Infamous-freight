import type { VercelConfig } from '@vercel/config/v1';

export const vercelDevConfig: VercelConfig = {
  devCommand: 'pnpm --filter web dev',
};
