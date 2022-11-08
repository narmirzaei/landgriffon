import { analysisUISlice } from './ui';
import { analysisMapSlice } from './map';

import type { RootState } from 'store';
import type { AnalysisUIState } from './ui';
import type { AnalysisMapState } from './map';

export { analysisUI } from './ui';
export { analysisMap } from './map';

export type AnalysisState = {
  'analysis/ui': AnalysisUIState;
  'analysis/map': AnalysisMapState;
};

type FeatureState = RootState & { analysis: AnalysisState };

export const { setVisualizationMode } = analysisUISlice.actions;

export const { setLayer } = analysisMapSlice.actions;

export const analysis = (state: FeatureState) => state.analysis;
