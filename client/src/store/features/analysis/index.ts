import type { RootState } from 'store';
import type { AnalysisMapState } from './map';

export { analysisMap } from './map';

export type AnalysisState = {
  'analysis/map': AnalysisMapState;
};

type FeatureState = RootState & { analysis: AnalysisState };

export const analysis = (state: FeatureState) => state.analysis;
