import React, { useCallback } from 'react';
import { useUpdateAtom } from 'jotai/utils';

import Component from './component';

import { analysisFilterAtom, useFilterValue } from 'store/atoms';

const MaterialsFilter: React.FC<{ multiple?: boolean }> = (props) => {
  const { multiple = false } = props;
  const setFilters = useUpdateAtom(analysisFilterAtom);
  const handleChange = useCallback(
    (selected) => setFilters({ suppliers: [selected] }),
    [setFilters],
  );

  const suppliers = useFilterValue('suppliers');

  return <Component current={suppliers} multiple={multiple} onChange={handleChange} />;
};

export default MaterialsFilter;
