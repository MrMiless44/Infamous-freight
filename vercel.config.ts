import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  functions: {
    'src/pages/isr/**/*': {
      maxDuration: 10,
    },
  },
};
