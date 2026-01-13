import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Creates a dynamically imported component with loading fallback
 * Reduces initial bundle size by lazy-loading components
 */
export function createDynamicComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  loadingComponent?: ComponentType
) {
  return dynamic(importFn, {
    loading: loadingComponent || (() => <div>Loading...</div>),
    ssr: false, // Disable SSR for better code splitting
  });
}

/**
 * Pre-configured dynamic imports for common heavy components
 */
export const DynamicComponents = {
  // Example: Charts/Analytics (typically heavy libraries)
  Chart: createDynamicComponent(() => import('../components/Chart')),
  
  // Example: Map components (if using maps)
  Map: createDynamicComponent(() => import('../components/Map')),
  
  // Example: Rich text editor
  Editor: createDynamicComponent(() => import('../components/Editor')),
};
