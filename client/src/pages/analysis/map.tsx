import ApplicationLayout from 'layouts/application';
import AnalysisLayout from 'layouts/analysis';
import AnalysisMap from 'containers/analysis-visualization/analysis-map';
import TitleTemplate from 'utils/titleTemplate';

import type { NextPageWithLayout } from 'pages/_app';
import type { ReactElement } from 'react';

const MapPage: NextPageWithLayout = () => {
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
