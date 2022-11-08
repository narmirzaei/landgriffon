import useH3ContextualData from 'hooks/h3-data/contextual';
import { useLayerAtom } from 'store/layers';

import type { Layer } from 'types';

export const useContextualLayer = (id: Layer['id']) => {
  const [layerInfo, setLayer] = useLayerAtom(id);

  const query = useH3ContextualData(id, {
    enabled: layerInfo.active,
    onSuccess: () => {
      setLayer({
        id: layerInfo.id,

        // TODO: is this necessary?
        opacity: layerInfo.opacity,
        active: layerInfo.active,
      });
    },
  });

  return query;
};
