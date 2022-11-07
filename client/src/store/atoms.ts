import { atom, useAtomValue } from 'jotai';
import { selectAtom } from 'jotai/utils';
import { useMemo } from 'react';

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
