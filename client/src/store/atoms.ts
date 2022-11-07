import { atom } from 'jotai';

import atomWithQueryParamStorage from './helpers/atomWithQueryParamStorage';

import { INITIAL_VIEW_STATE } from 'components/map';

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
