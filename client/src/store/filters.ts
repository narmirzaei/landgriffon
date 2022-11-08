import { atom, useAtomValue } from 'jotai';
import { selectAtom } from 'jotai/utils';
import { useMemo } from 'react';

import type { SelectOption } from 'components/select';
import type { Material } from 'types';

export interface AnalysisFilters {
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
