import { useUpdateAtom } from 'jotai/utils';

import useEffectOnce from 'hooks/once';
import ApplicationLayout from 'layouts/application';
import AnalysisLayout from 'layouts/analysis';
import AnalysisTable from 'containers/analysis-visualization/analysis-table';
import TitleTemplate from 'utils/titleTemplate';
import { visualizationModeAtom } from 'store/atoms';

import type { NextPageWithLayout } from 'pages/_app';
import type { ReactElement } from 'react';

export const getServerSideProps = ({ query }) => {
  return { props: { query } };
};

const TablePage: NextPageWithLayout = () => {
  const setVisualizationMode = useUpdateAtom(visualizationModeAtom);

  useEffectOnce(() => {
    setVisualizationMode('table');
  });
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
