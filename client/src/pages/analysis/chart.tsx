import { useMemo } from 'react';
import classNames from 'classnames';

import { useIndicators } from 'hooks/indicators';
import ApplicationLayout from 'layouts/application';
import AnalysisLayout from 'layouts/analysis';
import AnalysisChart from 'containers/analysis-chart';
import AnalysisDynamicMetadata from 'containers/analysis-visualization/analysis-dynamic-metadata';
import Loading from 'components/loading';
import TitleTemplate from 'utils/titleTemplate';
import { useFilterValue } from 'store/atoms';

import type { ReactElement } from 'react';
import type { NextPageWithLayout } from 'pages/_app';
import type { Indicator } from 'types';

const ChartPage: NextPageWithLayout = () => {
  const indicator = useFilterValue('indicator');
  // Show as many charts as there are indicators selected
  const { data, isLoading } = useIndicators();

  const activeIndicators: Indicator[] = useMemo(() => {
    if (indicator?.value === 'all') return data?.data;
    if (data?.data.length) {
      return data.data.filter((indicatorData) => indicatorData.id === indicator?.value);
    }
    return [];
  }, [data, indicator]);

  return (
    <div className="pl-6 pr-6 my-6 xl:pl-12">
      <TitleTemplate title="Analysis chart" />
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <Loading className="w-5 h-5 m-auto text-navy-400" />
        </div>
      )}
      {!isLoading && activeIndicators?.length > 0 && (
        <>
          <div className="mb-6">
            <AnalysisDynamicMetadata />
          </div>
          <div
            className={classNames('grid gap-6', {
              'grid-cols-1': activeIndicators?.length === 1,
              'grid-cols-1 2xl:grid-cols-2': activeIndicators?.length > 1,
            })}
            data-testid="analysis-charts"
          >
            {activeIndicators.map((indicator) => (
              <AnalysisChart key={`analysis-chart-${indicator.id}`} indicator={indicator} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

ChartPage.Layout = function getLayout(page: ReactElement) {
  return (
    <ApplicationLayout>
      <AnalysisLayout>{page}</AnalysisLayout>
    </ApplicationLayout>
  );
};

export function getServerSideProps({ query }) {
  return { props: { query } };
}

export default ChartPage;
