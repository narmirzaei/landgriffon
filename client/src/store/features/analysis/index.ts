import { analysisUISlice } from './ui';
import { analysisFiltersSlice } from './filters';
import { analysisMapSlice } from './map';

import type { RootState } from 'store';
import type { AnalysisUIState } from './ui';
import type { AnalysisFiltersState } from './filters';
import type { AnalysisMapState } from './map';

export { analysisUI } from './ui';
export { analysisFilters } from './filters';
export { analysisMap } from './map';

export type AnalysisState = {
  'analysis/ui': AnalysisUIState;
  'analysis/filters': AnalysisFiltersState;
  'analysis/map': AnalysisMapState;
};

type FeatureState = RootState & { analysis: AnalysisState };

export const { setVisualizationMode, setSidebarCollapsed, setSubContentCollapsed } =
  analysisUISlice.actions;

export const { setFilter, setFilters, resetFiltersAndOverride } = analysisFiltersSlice.actions;

export const { setLayer } = analysisMapSlice.actions;

export const analysis = (state: FeatureState) => state.analysis;
