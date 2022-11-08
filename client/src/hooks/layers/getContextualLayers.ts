import { useQuery } from '@tanstack/react-query';
import { useUpdateAtom } from 'jotai/utils';

import { apiRawService } from 'services/api';
import { setLayerAtom } from 'store/layers';

import type { UseQueryOptions } from '@tanstack/react-query';
import type { LayerMetadata } from 'types';

interface ContextualLayerApiResponse {
  category: string;
  id: string;
  name: string;
  metadata: LayerMetadata;
}

export interface CategoryWithLayers {
  category: string;
  layers: ContextualLayerApiResponse[];
}

type LayerCategoriesApiResponse = {
  data: CategoryWithLayers[];
};

const useContextualLayers = (
  options: Omit<UseQueryOptions<LayerCategoriesApiResponse['data']>, 'select'> = {},
) => {
  const setLayer = useUpdateAtom(setLayerAtom);
  return useQuery(
    ['contextual-layers'],
    () =>
      apiRawService
        .get<LayerCategoriesApiResponse>('/contextual-layers/categories')
        .then(({ data }) => data.data)
        .then((data) => data.filter((category) => category.layers.length > 0)),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true,
      ...options,
      onSuccess: (data) => {
        options?.onSuccess?.(data);

        const allLayers = data.flatMap((data) => data.layers);
        allLayers.forEach((layer, i) => {
          setLayer({
            id: layer.id,
            isContextual: true,
            // TODO: don't hardcode this
            order: i + 2,
          });
        });
      },
    },
  );
};

export default useContextualLayers;
