import ApplicationLayout from 'layouts/application';
import AnalysisLayout from 'layouts/analysis';
import AnalysisTable from 'containers/analysis-visualization/analysis-table';
import TitleTemplate from 'utils/titleTemplate';

import type { NextPageWithLayout } from 'pages/_app';
import type { ReactElement } from 'react';

export const getServerSideProps = ({ query }) => {
  return { props: { query } };
};

const TablePage: NextPageWithLayout = () => {
  return (
    <>
      <TitleTemplate title="Analysis Table" />
      <AnalysisTable />
    </>
  );
};

TablePage.Layout = function getLayout(page: ReactElement) {
  return (
    <ApplicationLayout>
      <AnalysisLayout>{page}</AnalysisLayout>
    </ApplicationLayout>
  );
};

export default TablePage;
