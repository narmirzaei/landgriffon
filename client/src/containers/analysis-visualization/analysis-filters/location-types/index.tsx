import React, { useCallback } from 'react';
import { useAtom } from 'jotai';

import Component from './component';

import { analysisFilterAtom } from 'store/filters';

const LocationTypesFilter: React.FC = () => {
  const [{ locationTypes }, setFilters] = useAtom(analysisFilterAtom);
  const handleChange = useCallback(
    (selected) => {
      setFilters({ locationTypes: [selected] });
    },
    [setFilters],
  );

  return <Component current={locationTypes} onChange={handleChange} />;
};

export default LocationTypesFilter;
