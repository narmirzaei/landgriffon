import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import Router from 'next/router';

// visualization mode
export const isSidebarCollapsedAtom = atom(false);

const getVisualizationModeFromPath = (path: string): 'map' | 'table' | 'chart' | null => {
  if (!path) return null;

  const pathWithoutSearch = path.split('?').shift();

  const lastParam = pathWithoutSearch.split('/').pop();
  if (['map', 'table', 'chart'].includes(lastParam)) return lastParam as 'map' | 'table' | 'chart';

  return null;
};

const synchedVisualizationModeAtom = atomWithStorage<'map' | 'table' | 'chart' | null>(null, null, {
  delayInit: true,
  removeItem: () => void {},
  getItem: () => {
    const value = getVisualizationModeFromPath(Router.pathname);

    return value;
  },
  setItem: async (_key, newValue) => {
    if (!['map', 'table', 'chart'].includes(newValue)) return;
    await Router.replace({ pathname: `/analysis/${newValue}` });
  },
  subscribe: (_key, setValue) => {
    const handler = (path: string) => {
      const value = getVisualizationModeFromPath(path) as 'map' | 'table' | 'chart';
      setValue(value);
    };

    Router.events.on('routeChangeComplete', handler);

    return () => {
      Router.events.off('routeChangeComplete', handler);
    };
  },
});

export const visualizationModeAtom = atom((get) => get(synchedVisualizationModeAtom));
