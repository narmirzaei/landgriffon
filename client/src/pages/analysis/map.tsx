import { useUpdateAtom } from 'jotai/utils';

import useEffectOnce from 'hooks/once';
import ApplicationLayout from 'layouts/application';
import AnalysisLayout from 'layouts/analysis';
import AnalysisMap from 'containers/analysis-visualization/analysis-map';
import TitleTemplate from 'utils/titleTemplate';
import { visualizationModeAtom } from 'store/atoms';

import type { NextPageWithLayout } from 'pages/_app';
import type { ReactElement } from 'react';

const MapPage: NextPageWithLayout = () => {
  const setVisualizationMode = useUpdateAtom(visualizationModeAtom);

  useEffectOnce(() => {
    setVisualizationMode('map');
  });

  return (
    <>
      <TitleTemplate title="Analysis Map" />
      <AnalysisMap />
    </>
  );
};

MapPage.Layout = function getLayout(page: ReactElement) {
  return (
    <ApplicationLayout>
      <AnalysisLayout>{page}</AnalysisLayout>
    </ApplicationLayout>
  );
};

export function getServerSideProps({ query }) {
  return { props: { query } };
}

export default MapPage;
