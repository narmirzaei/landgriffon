import { useAtomValue } from 'jotai';

import ImpactChart from './impact-chart';
import ComparisonChart from './comparison-chart';

import { compareScenarioIdAtom } from 'store/scenarios';

import type { Indicator } from 'types';

type AnalysisChartProps = {
  indicator: Indicator;
};

const AnalysisChart: React.FC<AnalysisChartProps> = ({ indicator }) => {
  const compareScenarioId = useAtomValue(compareScenarioIdAtom);

  if (compareScenarioId) return <ComparisonChart indicator={indicator} />;

  return <ImpactChart indicator={indicator} />;
};

export default AnalysisChart;
