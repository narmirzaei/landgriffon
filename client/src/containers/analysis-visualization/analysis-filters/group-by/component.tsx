import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';

import Select from 'components/forms/select';
import { analysisFilterAtom } from 'store/atoms';

import type { Option, SelectProps } from 'components/forms/select/types';
import type { Group } from 'types';

const GROUP_BY_OPTIONS: Group[] = [
  {
    id: 'material',
    name: 'Material',
  },
  {
    id: 'business-unit',
    name: 'Business Unit',
  },
  {
    id: 'region',
    name: 'Region',
  },
  {
    id: 'supplier',
    name: 'Supplier',
  },
  {
    id: 'location-type',
    name: 'Location type',
  },
];

const GroupByFilter: React.FC = () => {
  const { replace, query = {} } = useRouter();
  const [filters, setFilters] = useAtom(analysisFilterAtom);

  const options: SelectProps['options'] = useMemo(
    () =>
      GROUP_BY_OPTIONS.map(({ id, name }) => ({
        label: name,
        value: id,
      })),
    [],
  );

  const currentValue: Option = useMemo(
    () => options.find((option) => option.value === query.by) || options[0],
    [query.by, options],
  );

  const handleChange: SelectProps['onChange'] = useCallback(
    ({ value }) => {
      replace({ query: { ...query, by: value } }, undefined, {
        shallow: true,
      });
    },
    [query, replace],
  );

  useEffect(() => {
    if (currentValue?.value !== filters.by) {
      setFilters({ by: currentValue?.value });
    }
  }, [currentValue, filters.by, setFilters]);

  return (
    <Select
      icon={<span className="text-sm text-gray-400">by</span>}
      value={currentValue}
      options={options}
      onChange={handleChange}
    />
  );
};

export default GroupByFilter;
