import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtom } from 'jotai';

import { useYears } from 'hooks/years';
import Select from 'components/forms/select';
import { analysisFilterAtom } from 'store/filters';

import type { Option, SelectProps } from 'components/forms/select/types';

const YearsFilter: React.FC = () => {
  const [filters, setFilters] = useAtom(analysisFilterAtom);
  const { materials, indicator, startYear } = filters;

  const materialsIds = useMemo(() => materials.map((mat) => mat.value), [materials]);
  const { data: years, isLoading } = useYears(materialsIds, indicator?.value);
  const [selectedOption, setSelectedOption] = useState<Option<number>>(null);

  useEffect(() => {
    setSelectedOption({
      label: startYear?.toString(),
      value: startYear,
    });
  }, [startYear]);

  const yearOptions: Option<number>[] = useMemo(
    () =>
      years?.map((year) => ({
        label: year.toString(),
        value: year,
      })),
    [years],
  );

  const handleChange: SelectProps<number>['onChange'] = useCallback(
    (option) => {
      setSelectedOption(option);
      setFilters({ startYear: option.value });
    },
    [setFilters],
  );

  // Update filters when data changes
  useEffect(() => {
    if (years?.length && !isLoading) {
      setFilters({ ...(startYear ? {} : { startYear: years[years.length - 1] }), endYear: null });
    }
  }, [isLoading, years, startYear, setFilters]);

  return (
    <Select
      icon={<span className="text-sm text-gray-400">in</span>}
      loading={isLoading}
      // TODO: make select generic
      value={selectedOption as unknown as Option<string>}
      options={yearOptions as unknown as Option<string>[]}
      placeholder="Select a year"
      onChange={handleChange as unknown as SelectProps['onChange']}
    />
  );
};

export default YearsFilter;
