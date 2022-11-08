import { useAtomValue } from 'jotai';

import IndicatorsFilter from './indicators';
import GroupByFilter from './group-by';
import YearsRangeFilter from './years-range';
import MoreFilters from './more-filters';

import YearsFilter from 'containers/years';
import { visualizationModeAtom } from 'store/visualizationMode';

const AnalysisFilters: React.FC = () => {
  const visualizationMode = useAtomValue(visualizationModeAtom);

  return (
    <div className="inline-flex flex-wrap gap-2">
      <IndicatorsFilter />
      {visualizationMode !== 'map' && <GroupByFilter />}
      {visualizationMode === 'map' && <YearsFilter />}
      {visualizationMode !== 'map' && <YearsRangeFilter />}
      <MoreFilters />
    </div>
  );
};

export default AnalysisFilters;
