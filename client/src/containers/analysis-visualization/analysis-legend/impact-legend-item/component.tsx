import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';

import LegendTypeChoropleth from 'components/legend/types/choropleth';
import LegendTypeComparative from 'components/legend/types/comparative';
import LegendItem from 'components/legend/item';
import { useIndicator } from 'hooks/indicators';
import { useFilterValue } from 'store/filters';
import { useLayerAtom } from 'store/layers';
import { isComparisonEnabledAtom } from 'store/scenarios';

import type { Legend } from 'types';

const LAYER_ID = 'impact';

const ImpactLayer = () => {
  const indicatorOption = useFilterValue('indicator');
  const { data: indicator } = useIndicator(indicatorOption?.value);

  const [layer, setLayer] = useLayerAtom(LAYER_ID);

  const handleOpacity = useCallback(
    (opacity: number) => {
      setLayer({ id: LAYER_ID, opacity });
    },
    [setLayer],
  );

  const legendItems = useMemo<Legend['items']>(
    () =>
      layer.metadata?.legend?.items?.map((item) => ({
        ...item,
        label: item.label || `${item.value}`,
      })) || [],
    [layer.metadata?.legend.items],
  );
  const isComparisonEnabled = useAtomValue(isComparisonEnabledAtom);

  const name = useMemo(() => {
    if (!layer.metadata?.legend?.name) return null;

    if (isComparisonEnabled) {
      return `Difference in ${layer.metadata.legend.name}`;
    }

    return layer.metadata.legend.name;
  }, [isComparisonEnabled, layer.metadata?.legend]);

  if (!layer.metadata) return null;
  // TO-DO: add Loading component
  return (
    <LegendItem
      info={indicator?.metadata?.description}
      {...layer.metadata.legend}
      name={name}
      opacity={layer.opacity}
      onChangeOpacity={handleOpacity}
      showComparisonModeToggle
      isLoading={layer.loading}
      main
    >
      {isComparisonEnabled ? (
        <LegendTypeComparative
          className="flex-1 text-sm text-gray-500"
          min={layer.metadata.legend.min}
          items={legendItems}
        />
      ) : (
        <LegendTypeChoropleth
          className="flex-1 text-sm text-gray-500"
          min={layer.metadata.legend.min}
          items={legendItems}
        />
      )}
    </LegendItem>
  );
};

export default ImpactLayer;
