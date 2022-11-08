import { atom, useAtomValue } from 'jotai';
import { atomWithStorage, selectAtom } from 'jotai/utils';
import { useMemo } from 'react';
import Router from 'next/router';

import atomWithQueryParamStorage from './helpers/atomWithQueryParamStorage';

import { INITIAL_VIEW_STATE } from 'components/map';

import type { Material } from 'types';
import type { SelectOption } from 'components/select';
import type { Scenario } from 'containers/scenarios/types';

export type ScenarioComparisonMode = 'relative' | 'absolute';

export const viewStateAtom = atom(INITIAL_VIEW_STATE);

export const currentScenarioAtom = atomWithQueryParamStorage<Scenario['id']>('scenarioId', null);
export const compareScenarioIdAtom = atomWithQueryParamStorage<Scenario['id']>(
  'compareScenarioId',
  null,
);
export const comparisonModeAtom = atom<ScenarioComparisonMode>('absolute');
export const scenarioSearchTerm = atom<string>('');
export const scenarioSortAtom = atom<'-updatedAt' | 'title'>('-updatedAt');

export const isComparisonEnabledAtom = atom((get) => {
  const scenarioId = get(currentScenarioAtom);
  const scenarioCompId = get(compareScenarioIdAtom);

  return !!scenarioId && !!scenarioCompId;
});

export interface AnalysisFilters {
  // layer: 'impact' | 'risk' | 'material' | 'water';
  indicator: SelectOption | null;
  by: string;
  startYear: number;
  endYear: number;
  materials: SelectOption[];
  origins: SelectOption[];
  suppliers: SelectOption[];
  locationTypes: SelectOption[];

  // used for the material layer
  materialId: Material['id'];
}

export const analysisFilterAtom = atom<AnalysisFilters, Partial<AnalysisFilters>>(
  {
    // layer: 'impact',
    by: 'material',
    materials: [],
    origins: [],
    suppliers: [],
    locationTypes: [],
    indicator: null,
    startYear: null,
    endYear: null,
    materialId: null,
  },
  (get, set, payload) => {
    set(analysisFilterAtom, { ...get(analysisFilterAtom), ...payload });
  },
);

export const useFilterValue = <K extends keyof AnalysisFilters>(key: K): AnalysisFilters[K] => {
  const subsetAtom = useMemo(() => selectAtom(analysisFilterAtom, (state) => state[key]), [key]);

  return useAtomValue(subsetAtom);
};

export const filtersForTabularApiAtom = atom((get) => {
  const { startYear, endYear, by, indicator, materials, suppliers, origins, locationTypes } =
    get(analysisFilterAtom);

  return {
    startYear,
    endYear,
    groupBy: by,
    indicatorId: indicator?.value,
    materialIds: materials?.map(({ value }) => value),
    supplierIds: suppliers?.map(({ value }) => value),
    originIds: origins?.map(({ value }) => value),
    locationTypes: locationTypes?.map(({ value }) => value),
  };
});

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
