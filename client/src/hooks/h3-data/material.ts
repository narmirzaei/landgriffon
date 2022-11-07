import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';

import { DEFAULT_QUERY_OPTIONS, responseParser } from './utils';

import { apiRawService } from 'services/api';
import { COLOR_RAMPS, useColors } from 'utils/colors';
import { useYears } from 'hooks/years';
import { analysisFilterAtom } from 'store/atoms';

import type { UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { H3APIResponse, MaterialH3APIParams } from 'types';

const useH3MaterialData = <T = H3APIResponse>(
  params: Partial<MaterialH3APIParams> = {},
  options: Partial<UseQueryOptions<H3APIResponse, AxiosError, T>> = {},
) => {
  const colors = useColors('material', COLOR_RAMPS);
  const { materialId, origins } = useAtomValue(analysisFilterAtom);

  const { data: year } = useYears(
    [materialId],
    'all',
    {
      enabled: !!materialId,
      select: (years) => years?.[years?.length - 1],
    },
    'material',
  );

  const urlParams = useMemo(
    () => ({
      materialId,
      resolution: origins?.length ? 6 : 4,
      year,
      ...params,
    }),
    [materialId, origins?.length, params, year],
  );

  const enabled = (options.enabled ?? true) && !!urlParams.year && !!urlParams.materialId;

  const fetchMaterialData = useCallback(
    () =>
      apiRawService
        .get<H3APIResponse>('/h3/map/material', {
          params: urlParams,
        })
        // Adding color to the response
        .then((response) => response.data)
        .then((response) => responseParser(response, colors)),
    [colors, urlParams],
  );

  const query = useQuery(['h3-data-material', urlParams], fetchMaterialData, {
    ...DEFAULT_QUERY_OPTIONS,
    ...options,
    enabled,
  });

  return query;
};

export default useH3MaterialData;
