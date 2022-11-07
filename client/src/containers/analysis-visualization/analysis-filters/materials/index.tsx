import React, { useCallback } from 'react';
import { useAtom } from 'jotai';

import Component from './component';

import { analysisFilterAtom } from 'store/atoms';

import type { MaterialsFilterProps } from './component';

const MaterialsFilter = <IsMulti extends boolean = false>(props: MaterialsFilterProps<IsMulti>) => {
  const [{ materials }, setFilters] = useAtom(analysisFilterAtom);

  const handleChange = useCallback(
    (selected) => {
      setFilters({ materials: [selected] });
    },
    [setFilters],
  );

  return <Component current={materials} onChange={handleChange} {...props} />;
};

export default MaterialsFilter;
