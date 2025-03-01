import { useQuery } from '@tanstack/react-query';

import { apiService } from 'services/api';

import type { UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import type { APIMetadataPagination, ErrorResponse, Task } from 'types';

type TaskAPIResponse = Task;

type TasksAPIResponse = {
  data: Task[];
  meta: APIMetadataPagination;
};

const DEFAULT_QUERY_OPTIONS = {
  retry: false,
  keepPreviousData: true,
  refetchOnWindowFocus: false,
};

export const useTasks = <T = TasksAPIResponse>(
  params: Record<string, string | number | boolean> = {},
  options: UseQueryOptions<TasksAPIResponse, ErrorResponse, T, ['tasks', typeof params]> = {},
) => {
  const query = useQuery(
    ['tasks', params],
    () =>
      apiService
        .request<{ data: TasksAPIResponse }>({
          method: 'GET',
          url: '/tasks',
          params,
        })
        .then(({ data: responseData }) => responseData.data),
    {
      ...DEFAULT_QUERY_OPTIONS,
      ...options,
    },
  );

  return query;
};

export function useTask(
  id: Task['id'],
  options: UseQueryOptions<TaskAPIResponse> = {},
): UseQueryResult<TaskAPIResponse> {
  const query = useQuery<TaskAPIResponse>(
    ['tasks', id],
    () =>
      apiService
        .request({
          method: 'GET',
          url: `/tasks/${id}`,
        })
        .then(({ data: responseData }) => responseData.data),
    {
      ...DEFAULT_QUERY_OPTIONS,
      ...options,
    },
  );

  return query;
}
