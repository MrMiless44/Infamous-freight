import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  functions: {
    'api/test.php': {
      runtime: 'vercel-php@0.5.2',
    },
  },
};
