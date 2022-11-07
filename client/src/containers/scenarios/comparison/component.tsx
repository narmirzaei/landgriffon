import { useCallback, useMemo, useEffect } from 'react';
import { useAtom } from 'jotai';

import { useScenarios } from 'hooks/scenarios';
import { useAppDispatch } from 'store/hooks';
import { setComparisonEnabled } from 'store/features/analysis/scenarios';
import Select from 'components/select';
import useEffectOnce from 'hooks/once';
import { compareScenarioIdAtom, currentScenarioAtom } from 'store/atoms';

import type { Dispatch, FC } from 'react';
import type { SelectOption } from 'components/select/types';

const ScenariosComparison: FC = () => {
  const [scenarioId, setScenarioId] = useAtom(currentScenarioAtom);
  const [compareScenarioId, setCompareScenarioId] = useAtom(compareScenarioIdAtom);

  const dispatch = useAppDispatch();

  const { data: scenarios } = useScenarios({
    params: { disablePagination: true, hasActiveInterventions: true, sort: '-updatedAt' },
    options: {
      select: (data) => data.data,
    },
  });

  const options = useMemo<SelectOption[]>(() => {
    const filteredData = scenarios.filter(({ id }) => id !== scenarioId);
    return filteredData.map(({ id, title }) => ({ label: title, value: id }));
  }, [scenarioId, scenarios]);
  const selected = useMemo(
    () => options.find(({ value }) => value === compareScenarioId),
    [compareScenarioId, options],
  );

  const handleOnChange = useCallback<Dispatch<SelectOption>>(
    (current) => {
      setCompareScenarioId(current?.value || null);
    },
    [setCompareScenarioId],
  );

  // Reset comparison when options changes
  useEffect(() => {
    if (selected?.value && compareScenarioId !== selected?.value) {
      setScenarioId(selected?.value || null);
      setCompareScenarioId(null);
    }
  }, [selected, dispatch, options, compareScenarioId, setScenarioId, setCompareScenarioId]);

  return (
    <div data-testid="comparison-select">
      <label className="block mb-1 text-sm text-gray-500">Compare with:</label>
      <Select
        showSearch
        current={selected}
        options={options}
        placeholder="Select what to compare"
        allowEmpty
        onChange={handleOnChange}
      />
    </div>
  );
};

export default ScenariosComparison;
