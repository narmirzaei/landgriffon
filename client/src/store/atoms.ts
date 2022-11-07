import { atom, useAtomValue } from 'jotai';

import type { PrimitiveAtom } from 'jotai';
import type { Scenario } from 'containers/scenarios/types';

export const currentScenarioAtom = atom<Scenario['id'] | null>(null) as PrimitiveAtom<
  Scenario['id']
>;

export const useCurrentScenario = () => useAtomValue(currentScenarioAtom);
