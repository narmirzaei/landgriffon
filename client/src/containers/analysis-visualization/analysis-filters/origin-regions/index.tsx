import React, { useCallback } from 'react';
import { useAtom } from 'jotai';

import Component from './component';

import { analysisFilterAtom } from 'store/filters';

const OriginRegionsFilter: React.FC<{ multiple?: boolean }> = (props) => {
  const { multiple = false } = props;
  const [filters, setFilters] = useAtom(analysisFilterAtom);
  const handleChange = useCallback((selected) => setFilters({ origins: [selected] }), [setFilters]);

  return <Component current={filters.origins} multiple={multiple} onChange={handleChange} />;
};

export default OriginRegionsFilter;
