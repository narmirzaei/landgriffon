import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAtom, useAtomValue } from 'jotai';

import { useIndicators } from 'hooks/indicators';
import Select from 'components/forms/select';
import { analysisFilterAtom } from 'store/filters';
import { visualizationModeAtom } from 'store/visualizationMode';

import type { Indicator } from 'types';
import type { SelectOption } from 'components/select';
import type { SelectProps } from 'components/forms/select/types';

const ALL = {
  id: 'all',
  name: 'All indicators',
  nameCode: 'all',
};

const IndicatorsFilter = () => {
  const ref = useRef(null);
  const { query = {}, replace } = useRouter();
  const { indicator } = query;
  const visualizationMode = useAtomValue(visualizationModeAtom);
  const [filters, setFilters] = useAtom(analysisFilterAtom);

  const {
    data = [],
    isFetching,
    error,
  } = useIndicators(
    {},
    {
      select: (data) => data.data,
    },
  );

  const options: SelectProps['options'] = useMemo(() => {
    let d: Partial<Indicator>[] = data || [];
    if (visualizationMode !== 'map') d = [...[ALL], ...data];
    return d.map((indicator) => ({ label: indicator.name, value: indicator.id }));
  }, [data, visualizationMode]);

  // Those lines allow to keep the selected indicator when the user changes the visualization mode
  const current = useMemo<SelectOption>(() => {
    const selected = options?.find((option) => option.value === indicator);
    return selected || options?.[0];
  }, [indicator, options]);

  // Update the filter when the indicator changes
  useEffect(() => {
    if (current && filters.indicator?.value !== current.value) {
      setFilters({ indicator: current });
    }
  }, [current, , filters.indicator?.value, setFilters]);

  const handleChange: SelectProps['onChange'] = useCallback(
    (selected) => {
      replace({ query: { ...query, indicator: selected?.value } }, undefined, {
        shallow: true,
      });
    },
    [query, replace],
  );

  return (
    <Select
      data-testid="indicators-filter"
      value={current}
      onChange={handleChange}
      options={options}
      loading={isFetching}
      disabled={!!error}
      ref={ref}
    />
  );
};

export default IndicatorsFilter;
