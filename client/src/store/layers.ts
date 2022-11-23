import { atom, useAtomValue } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';
import { sortBy } from 'lodash-es';
import { useCallback } from 'react';

import type { Layer, WithRequiredProperty } from 'types';

const DEFAULT_LAYER_ATTRIBUTES: Pick<Layer, 'order' | 'active' | 'opacity' | 'isContextual'> = {
  order: 0,
  active: false,
  opacity: 0.7,
  isContextual: false,
};

const DEFAULT_DECKGL_PROPS = {
  data: [],
  wireframe: false,
  filled: true,
  stroked: true,
  extruded: false,
  highPrecision: 'auto',
  pickable: true,
  coverage: 0.9,
  lineWidthMinPixels: 2,
  opacity: DEFAULT_LAYER_ATTRIBUTES.opacity,
  visible: DEFAULT_LAYER_ATTRIBUTES.active,
};

interface DeckGLConstructorProps {
  id: Layer['id'];
  visible: boolean;
  opacity: number;
}

export const layersAtom = atom<Record<Layer['id'], Layer>>({
  impact: { ...DEFAULT_LAYER_ATTRIBUTES, active: true, id: 'impact' },
  material: {
    ...DEFAULT_LAYER_ATTRIBUTES,
    id: 'material',
    order: 1,
    isContextual: false,
  },
});

type UpdateLayerPayload = WithRequiredProperty<Partial<Layer>, 'id'>;

export const setLayerAtom = atom<never, UpdateLayerPayload>(null, (get, set, update) => {
  const state = get(layersAtom);
  const newState =
    update.id in state
      ? { ...state, [update.id]: { ...state[update.id], ...update } }
      : { ...state, [update.id]: { ...DEFAULT_LAYER_ATTRIBUTES, ...update } };

  set(layersAtom, newState);
});

export const orderedLayersAtom = atom<Layer[], Layer[]>(
  (get) => {
    const items = Object.values(get(layersAtom));
    return sortBy(items, 'order');
  },
  (_get, set, payload) => {
    payload.forEach((layer) => {
      set(setLayerAtom, layer);
    });
  },
);

export const useLayerAtom = (layerId: Layer['id']) => {
  const innerSetLayer = useUpdateAtom(setLayerAtom);
  const setLayer = useCallback(
    (props: Partial<Layer>) => innerSetLayer({ id: layerId, ...props }),
    [innerSetLayer, layerId],
  );
  const layers = useAtomValue(layersAtom);
  return [layers[layerId], setLayer] as const;
};

const layerDeckGLPropsMapAtom = atom<Record<Layer['id'], DeckGLConstructorProps>>({});

type SetDeckGLPropsPayload = WithRequiredProperty<Partial<DeckGLConstructorProps>, 'id'>;

export const layerDeckGLPropsAtom = atom<
  Record<Layer['id'], DeckGLConstructorProps>,
  SetDeckGLPropsPayload
>(
  (get) => {
    const currentDeckGLProps = get(layerDeckGLPropsMapAtom);
    const layerProps = get(layersAtom);

    return Object.fromEntries(
      Object.entries(currentDeckGLProps).map(([id, layer]) => [
        id,
        {
          ...DEFAULT_DECKGL_PROPS,
          ...layer,
          opacity: layerProps[id].opacity,
          visible: layerProps[id].active,
        },
      ]),
    );
  },
  (get, set, update) => {
    const currentDeckGLProps = get(layerDeckGLPropsMapAtom);
    const newDeckGLProps = {
      ...currentDeckGLProps,
      [update.id]: { ...currentDeckGLProps[update.id], ...update },
    };

    set(layerDeckGLPropsMapAtom, newDeckGLProps);
  },
);
