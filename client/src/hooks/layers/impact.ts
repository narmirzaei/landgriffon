import { useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';

import { NUMBER_FORMAT } from 'utils/number-format';
import { COLOR_RAMPS } from 'utils/colors';
import useH3ImpactData from 'hooks/h3-data/impact';
import useH3ComparisonData from 'hooks/h3-data/impact/comparison';
import { storeToQueryParams } from 'hooks/h3-data/utils';
import { analysisFilterAtom } from 'store/filters';
import { layerDeckGLPropsAtom, useLayerAtom } from 'store/layers';
import {
  currentScenarioAtom,
  isComparisonEnabledAtom,
  compareScenarioIdAtom,
  comparisonModeAtom,
} from 'store/scenarios';

import type { LegendItem as LegendItemProp } from 'types';

export const useImpactLayer = () => {
  const filters = useAtomValue(analysisFilterAtom);
  const scenarioId = useAtomValue(currentScenarioAtom);

  const isComparisonEnabled = useAtomValue(isComparisonEnabledAtom);
  const scenarioToCompare = useAtomValue(compareScenarioIdAtom);
  const comparisonMode = useAtomValue(comparisonModeAtom);
  const colorKey = scenarioToCompare ? 'compare' : 'impact';

  const [impactLayer, setImpactLayer] = useLayerAtom('impact');
  const setLayerDeckGLProps = useUpdateAtom(layerDeckGLPropsAtom);

  const params = useMemo(
    () => ({
      ...storeToQueryParams(filters),
      scenarioId,
      scenarioToCompare,
      isComparisonEnabled,
    }),
    [filters, isComparisonEnabled, scenarioId, scenarioToCompare],
  );

  const { indicator } = filters;
  const { year } = params;

  const normalQuery = useH3ImpactData(params, { enabled: !isComparisonEnabled });
  const comparisonQuery = useH3ComparisonData(
    {
      ...params,
      baseScenarioId: params.scenarioId,
      comparedScenarioId: scenarioToCompare,
      relative: comparisonMode === 'relative',
    },
    { enabled: isComparisonEnabled },
  );

  const query = isComparisonEnabled ? comparisonQuery : normalQuery;

  const { data, isSuccess, isFetched } = query;

  // Populating legend
  useEffect(() => {
    if (data && isSuccess && indicator) {
      setImpactLayer({
        loading: query.isFetching,
        metadata: {
          legend: {
            id: `impact-${indicator.value}-${isComparisonEnabled || 'compare'}`,
            type: 'basic',
            name: `${indicator.label} in ${year}`,
            unit: data.metadata.unit,
            min: !!data.metadata.quantiles.length && NUMBER_FORMAT(data.metadata.quantiles[0]),
            items: data.metadata.quantiles
              .sort((a, b) => a - b) // always sort quantiles
              .slice(1)
              .map(
                (v, index): LegendItemProp => ({
                  value: NUMBER_FORMAT(v),
                  color: COLOR_RAMPS[colorKey][index],
                }),
              ),
          },
        },
      });
    }
  }, [
    data,
    isSuccess,
    indicator,
    query.isFetching,
    year,
    isComparisonEnabled,
    colorKey,
    setImpactLayer,
  ]);

  useEffect(() => {
    if (!isFetched) return;

    setLayerDeckGLProps({
      id: 'impact',
      opacity: impactLayer.opacity,
      visible: impactLayer.active,
    });
  }, [impactLayer.active, impactLayer.opacity, isFetched, setLayerDeckGLProps]);

  return query;
};
