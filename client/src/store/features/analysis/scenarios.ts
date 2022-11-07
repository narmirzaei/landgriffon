import { createSlice } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';

export type ScenarioComparisonMode = 'relative' | 'absolute';

export type ScenariosState = {
  comparisonMode: ScenarioComparisonMode;
  // To remove
  searchTerm: string;
  filter: 'all' | 'private' | 'public';
  sort: '-updatedAt' | 'title';
  pagination: {
    page: number;
    size: number;
  };
};

// Define the initial state using that type
export const initialState: ScenariosState = {
  comparisonMode: 'absolute',
  searchTerm: null,
  filter: 'all',
  sort: '-updatedAt',
  pagination: {
    page: 1,
    size: 300,
  },
};

export const analysisScenariosSlice = createSlice({
  name: 'analysis/scenarios',
  initialState,
  reducers: {
    setComparisonMode: (state, action: PayloadAction<ScenariosState['comparisonMode']>) => ({
      ...state,
      comparisonMode: action.payload,
    }),
    setScenarioFilter: (state, action: PayloadAction<ScenariosState['filter']>) => ({
      ...state,
      filter: action.payload,
    }),
    setSort: (state, action: PayloadAction<ScenariosState['sort']>) => ({
      ...state,
      sort: action.payload,
    }),
    setSearchTerm: (state, action: PayloadAction<ScenariosState['searchTerm']>) => ({
      ...state,
      searchTerm: action.payload,
    }),
  },
});

export const { setScenarioFilter, setSort, setSearchTerm } = analysisScenariosSlice.actions;

export const scenarios = (state: RootState) => state['analysis/scenarios'];

export default analysisScenariosSlice.reducer;
