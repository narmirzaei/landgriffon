import { createSlice } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import type { Layer } from 'types';

const DEFAULT_LAYER_ATTRIBUTES = {
  order: 0,
  active: false,
  opacity: 0.7,
  loading: false,
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

export type AnalysisMapState = {
  layers: Record<Layer['id'], Layer>;
  // Deck.gl layer props by layer id
  layerDeckGLProps: Record<Layer['id'], Partial<DeckGLConstructorProps>>;
};

// Define the initial state using that type
export const initialState: AnalysisMapState = {
  layers: {
    impact: {
      ...DEFAULT_LAYER_ATTRIBUTES,
      id: 'impact',
      order: 0,
      active: true,
      isContextual: false,
    },
    material: {
      ...DEFAULT_LAYER_ATTRIBUTES,
      id: 'material',
      order: 1,
      isContextual: true,
    },
  },
  layerDeckGLProps: {},
};

export const analysisMapSlice = createSlice({
  name: 'analysisMap',
  initialState,
  reducers: {
    setLayer: (
      state,
      action: PayloadAction<{
        id: Layer['id'];
        layer: Partial<Layer>;
      }>,
    ) => {
      const layers = {
        ...state.layers,
        [action.payload.id]: {
          ...DEFAULT_LAYER_ATTRIBUTES,
          id: action.payload.id,
          ...state.layers[action.payload.id],
          ...action.payload.layer,
        },
      };

      return {
        ...state,
        layerDeckGLProps: {
          ...state.layerDeckGLProps,
          [action.payload.id]: {
            ...DEFAULT_DECKGL_PROPS,
            id: action.payload.id,
            ...state.layerDeckGLProps[action.payload.id],
            visible: layers[action.payload.id].active,
            opacity: layers[action.payload.id].opacity,
          },
        },
        layers,
      };
    },
    setLayerDeckGLProps: (
      state,
      action: PayloadAction<{
        id: Layer['id'];
        props: Partial<DeckGLConstructorProps>;
      }>,
    ) => {
      return {
        ...state,
        layerDeckGLProps: {
          ...state.layerDeckGLProps,
          [action.payload.id]: {
            ...DEFAULT_DECKGL_PROPS,
            ...state.layerDeckGLProps[action.payload.id],
            ...action.payload.props,
          },
        },
      };
    },
    setLayerOrder: (state, action: PayloadAction<Layer['id'][]>) => {
      Object.values(state.layers).forEach((layer) => {
        layer.order = action.payload.indexOf(layer.id);
      });
      return state;
    },
  },
});

export const { setLayer, setLayerDeckGLProps, setLayerOrder } = analysisMapSlice.actions;

export const analysisMap = (state: RootState) => state['analysis/map'];

export default analysisMapSlice.reducer;
