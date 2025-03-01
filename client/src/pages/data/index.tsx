import { useMemo } from 'react';
import Head from 'next/head';

import { useSourcingLocations } from 'hooks/sourcing-locations';
import { useTasks } from 'hooks/tasks';
import AdminLayout from 'layouts/admin';
import AdminDataUploader from 'containers/admin/data-uploader';
import AdminDataTable from 'containers/admin/data-table';
import Loading from 'components/loading';

import type { Task } from 'types';

const AdminDataPage: React.FC = () => {
  // Getting sourcing locations to check if there are any data
  const {
    data: sourcingLocations,
    isFetched: isSourcingLocationsFetched,
    isLoading: isSourcingLocationsLoading,
  } = useSourcingLocations({
    fields: 'updatedAt',
    'page[number]': 1,
    'page[size]': 1,
  });
  const thereIsData = useMemo(() => sourcingLocations?.meta?.totalItems > 0, [sourcingLocations]);

  // Getting last task available, this task is checking every 10 seconds if there is a new task
  const {
    data: tasks,
    isFetched: isTaskFetched,
    isLoading: isTasksLoading,
  } = useTasks(
    {
      'page[size]': 1,
      sort: '-createdAt',
    },
    {
      refetchInterval: 10000,
    },
  );
  const lastTask = useMemo(() => tasks?.[0] as Task, [tasks]);

  const isLoading = useMemo(
    () => isTasksLoading && isSourcingLocationsLoading,
    [isTasksLoading, isSourcingLocationsLoading],
  );

  const isFetched = useMemo(
    () => isTaskFetched && isSourcingLocationsFetched,
    [isTaskFetched, isSourcingLocationsFetched],
  );

  return (
    <AdminLayout title="Manage data">
      <Head>
        <title>Manage data | Landgriffon</title>
      </Head>

      {isLoading && (
        <div className="flex items-center justify-center w-full h-full">
          <Loading className="w-5 h-5 text-navy-400" />
        </div>
      )}

      {/* Content when empty */}
      {isFetched && (!thereIsData || lastTask?.status === 'processing') && (
        <AdminDataUploader task={lastTask} />
      )}

      {/* Content when data */}
      {isFetched && thereIsData && <AdminDataTable />}
    </AdminLayout>
  );
};

export default AdminDataPage;
