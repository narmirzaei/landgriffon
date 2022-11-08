import { createSlice } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';

export type AnalysisUIState = {
  visualizationMode: 'map' | 'table' | 'chart';
};

// Define the initial state using that type
export const initialState: AnalysisUIState = {
  visualizationMode: 'map',
};

export const analysisUISlice = createSlice({
  name: 'analysisUI',
  initialState,
  reducers: {
    setVisualizationMode: (state, action: PayloadAction<AnalysisUIState['visualizationMode']>) => ({
      ...state,
      visualizationMode: action.payload,
    }),
  },
});

export const { setVisualizationMode } = analysisUISlice.actions;

export const analysisUI = (state: RootState) => state['analysis/ui'];

export default analysisUISlice.reducer;
