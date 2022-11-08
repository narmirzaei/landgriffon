import { useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';

import LegendTypeChoropleth from 'components/legend/types/choropleth';
import LegendItem from 'components/legend/item';
import { NUMBER_FORMAT } from 'utils/number-format';
import { COLOR_RAMPS } from 'utils/colors';
import Materials from 'containers/analysis-visualization/analysis-filters/materials/component';
import { useMaterial } from 'hooks/materials';
import useH3MaterialData from 'hooks/h3-data/material';
import { analysisFilterAtom, setLayerAtom, useLayerAtom } from 'store/atoms';

import type { TreeSelectOption } from 'components/tree-select/types';
import type { Legend, LegendItem as LegendItemsProps } from 'types';

const LAYER_ID = 'material';

const MaterialLayer = () => {
  const [{ indicator, materialId }, setFilters] = useAtom(analysisFilterAtom);
  const setLayer = useUpdateAtom(setLayerAtom);

  const [layer] = useLayerAtom(LAYER_ID);
  const handleOpacity = useCallback(
    (opacity: number) => {
      setLayer({ id: LAYER_ID, opacity });
    },
    [setLayer],
  );

  const { isFetching, isSuccess, data, isError, error } = useH3MaterialData(undefined, {
    onSuccess: (data) => {
      setLayer({
        id: LAYER_ID,
        metadata: {
          legend: {
            id: `${LAYER_ID}-${indicator.value}`,
            type: 'basic',
            name: `${material.metadata.name}`,
            unit: data.metadata.unit,
            min: !!data.metadata.quantiles.length && NUMBER_FORMAT(data.metadata.quantiles[0]),
            items: data.metadata.quantiles.slice(1).map(
              (v, index): LegendItemsProps => ({
                value: NUMBER_FORMAT(v),
                color: COLOR_RAMPS[LAYER_ID][index],
              }),
            ),
          },
        },
      });
    },
  });

  const { data: material } = useMaterial(materialId);

  const legendItems = useMemo<Legend['items']>(
    () =>
      layer.metadata?.legend?.items?.map((item) => ({
        ...item,
        label: item.label || `${item.value}`,
      })) || [],
    [layer.metadata?.legend.items],
  );

  const handleMaterialChange = useCallback(
    (material: TreeSelectOption) => {
      setFilters({ materialId: material?.value as string });
    },
    [setFilters],
  );

  const Selector = useMemo(() => {
    return (
      <div>
        <div>Material Production</div>
        <Materials
          current={material ? { label: material.name, value: material.id } : null}
          onChange={handleMaterialChange}
        />
      </div>
    );
  }, [handleMaterialChange, material]);

  return (
    <LegendItem
      name={Selector}
      info={material?.metadata?.name}
      {...data?.metadata?.legend}
      unit={data?.metadata?.unit}
      showToolbar
      opacity={layer.opacity}
      onChangeOpacity={handleOpacity}
      isLoading={isFetching}
      main
    >
      {isSuccess && (
        <LegendTypeChoropleth
          className="text-sm text-gray-500"
          min={data.metadata.legend?.min}
          items={legendItems}
        />
      )}
      {isError && error.response?.status === 404 && (
        <div className="text-sm text-red-500">No data found for this parameters</div>
      )}
    </LegendItem>
  );
};

export default MaterialLayer;
