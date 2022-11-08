import { useCallback, useMemo } from 'react';
import { useDebounceCallback } from '@react-hook/debounce';
import { SortDescendingIcon } from '@heroicons/react/solid';
import { useAtom } from 'jotai';

import Select from 'components/forms/select';
import Search from 'components/search';
import { scenarioSearchTerm, scenarioSortAtom } from 'store/scenarios';

import type { FC } from 'react';

const SORT_OPTIONS = [
  {
    label: 'Recent',
    value: '-updatedAt',
  },
  {
    label: 'Title',
    value: 'title',
  },
];

const ScenariosFilters: FC = () => {
  const [searchTerm, setSearchTerm] = useAtom(scenarioSearchTerm);
  const [sort, setSort] = useAtom(scenarioSortAtom);

  const handleSort = useCallback((selected) => setSort(selected.value), [setSort]);
  const handleSearchByTerm = useDebounceCallback((value) => setSearchTerm(value), 250);

  const currentSort = useMemo(() => SORT_OPTIONS.find(({ value }) => value === sort), [sort]);

  return (
    <div className="flex items-center justify-between space-x-4">
      <Search placeholder="Search" defaultValue={searchTerm} onChange={handleSearchByTerm} />
      <Select
        value={currentSort}
        options={SORT_OPTIONS}
        onChange={handleSort}
        icon={<SortDescendingIcon className="w-4 h-4" />}
      />
    </div>
  );
};

export default ScenariosFilters;
