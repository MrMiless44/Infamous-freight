import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  functions: {
    'pages/blog/[hello].tsx': {
      memory: 1024,
    },
    'src/pages/isr/**/*': {
      maxDuration: 10,
    },
  },
};
