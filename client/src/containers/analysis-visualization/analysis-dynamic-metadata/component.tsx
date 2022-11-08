import { useMemo, useCallback } from 'react';
import classNames from 'classnames';
import { InformationCircleIcon } from '@heroicons/react/solid';
import { useAtom, useAtomValue } from 'jotai';

import { useScenario } from 'hooks/scenarios';
import { useIndicator } from 'hooks/indicators';
import Badge from 'components/badge/component';
import { ComparisonToggle } from 'components/legend/item/comparisonModeToggle';
import { analysisFilterAtom } from 'store/filters';
import {
  currentScenarioAtom,
  isComparisonEnabledAtom,
  compareScenarioIdAtom,
} from 'store/scenarios';

import type { SelectOption } from 'components/select';
import type { FC } from 'react';

const values = 'absolute';
const materialArticle = 'of';
const originArticle = 'in';
const supplierArticle = 'from';
const locationTypeArticle = 'aggregated by';

type AnalysisDynamicMetadataTypes = {
  className?: string;
};

const AnalysisDynamicMetadata: FC<AnalysisDynamicMetadataTypes> = ({
  className,
}: AnalysisDynamicMetadataTypes) => {
  const currentScenario = useAtomValue(currentScenarioAtom);
  const isComparisonEnabled = useAtomValue(isComparisonEnabledAtom);
  const scenarioToCompare = useAtomValue(compareScenarioIdAtom);
  const { data: scenario } = useScenario(currentScenario);
  const { data: scenarioB } = useScenario(scenarioToCompare);

  const scenario1 = useMemo(
    () => (currentScenario ? scenario?.title : 'Actual data'),
    [currentScenario, scenario?.title],
  );

  const scenario2 = useMemo(
    () => (scenarioToCompare ? scenarioB?.title : 'Actual data'),
    [scenarioToCompare, scenarioB?.title],
  );

  const [{ materials, origins, suppliers, locationTypes, indicator }, setFilters] =
    useAtom(analysisFilterAtom);

  const handleRemoveBadge = useCallback(
    (id: string, list: SelectOption[], option: SelectOption) => {
      const filteredKeys = list.filter((key) => option.label !== key.label);
      setFilters({ [id]: filteredKeys });
    },
    [setFilters],
  );

  const { data: unit } = useIndicator(indicator?.value, { select: (data) => data?.unit });

  const indicatorsTemplate = useMemo(
    () => indicator?.value !== 'all' && <span className="font-bold">({unit?.symbol})</span>,
    [indicator?.value, unit?.symbol],
  );

  const comparisonTemplate = useMemo(
    () =>
      !!isComparisonEnabled && (
        <span>
          compared to <span className="font-bold whitespace-nowrap">{scenario2}</span>
        </span>
      ),
    [isComparisonEnabled, scenario2],
  );

  const materialTemplate = useMemo(
    () =>
      !!materials.length && (
        <span>
          {materialArticle}{' '}
          <ul className="inline-flex text-xs">
            {materials.map((material) => (
              <li key={material.value} className="pr-1">
                <Badge
                  key={material.value}
                  data={material}
                  onClick={() => handleRemoveBadge('materials', materials, material)}
                  removable
                >
                  {material.label}
                </Badge>
              </li>
            ))}
          </ul>
        </span>
      ),
    [handleRemoveBadge, materials],
  );
  const originTemplate = useMemo(
    () =>
      !!origins.length && (
        <span>
          {originArticle}{' '}
          <ul className="inline-flex">
            {origins.map((origin) => (
              <li key={origin.value}>
                <Badge
                  key={origin.value}
                  data={origin}
                  onClick={() => handleRemoveBadge('origins', origins, origin)}
                  removable
                >
                  {origin.label}
                </Badge>
              </li>
            ))}
          </ul>
        </span>
      ),
    [handleRemoveBadge, origins],
  );
  const supplierTemplate = useMemo(
    () =>
      !!suppliers.length && (
        <span>
          {supplierArticle}{' '}
          <ul className="inline-flex">
            {suppliers.map((supplier) => (
              <li key={supplier.value}>
                <Badge
                  key={supplier.value}
                  data={supplier}
                  onClick={() => handleRemoveBadge('suppliers', suppliers, supplier)}
                  removable
                >
                  {supplier.label}
                </Badge>
              </li>
            ))}
          </ul>
        </span>
      ),
    [handleRemoveBadge, suppliers],
  );
  const locationTypeTemplate = useMemo(
    () =>
      !!locationTypes.length && (
        <span>
          {locationTypeArticle}{' '}
          <ul className="inline-flex">
            {locationTypes.map((locationType) => (
              <li key={locationType.value}>
                <Badge
                  key={locationType.value}
                  data={locationType}
                  onClick={() => handleRemoveBadge('locationTypes', locationTypes, locationType)}
                  removable
                >
                  {locationType.label}
                </Badge>
              </li>
            ))}
          </ul>
        </span>
      ),
    [handleRemoveBadge, locationTypes],
  );

  return (
    <div
      className={classNames('flex items-center justify-start text-xs gap-x-1 flex-wrap', className)}
    >
      <InformationCircleIcon className="w-4 h-4 text-gray-900 shrink-0" />
      Viewing {isComparisonEnabled ? <ComparisonToggle /> : values}
      <span>
        <span className="whitespace-nowrap">Impact values for</span>
        <span className="font-bold whitespace-nowrap"> {scenario1} </span>
      </span>
      {comparisonTemplate}
      {indicatorsTemplate}
      {materialTemplate}
      {originTemplate}
      {supplierTemplate}
      {locationTypeTemplate}
    </div>
  );
};

export default AnalysisDynamicMetadata;
