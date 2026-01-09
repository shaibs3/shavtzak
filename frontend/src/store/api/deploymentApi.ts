import { baseApi } from './baseApi';
import { Deployment } from '../../types/entities';
import { CreateDeploymentDto, UpdateDeploymentDto } from '../../types/dtos';

export const deploymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeployments: builder.query<Deployment[], { activeOnly?: boolean }>({
      query: (params) => ({
        url: '/deployment',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Deployment' as const, id })),
              { type: 'Deployment', id: 'LIST' },
            ]
          : [{ type: 'Deployment', id: 'LIST' }],
    }),
    getDeployment: builder.query<Deployment, string>({
      query: (id) => `/deployment/${id}`,
      providesTags: (result, error, id) => [{ type: 'Deployment', id }],
    }),
    createDeployment: builder.mutation<Deployment, CreateDeploymentDto>({
      query: (body) => ({
        url: '/deployment',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Deployment', id: 'LIST' }],
    }),
    updateDeployment: builder.mutation<Deployment, { id: string; data: UpdateDeploymentDto }>({
      query: ({ id, data }) => ({
        url: `/deployment/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Deployment', id },
        { type: 'Deployment', id: 'LIST' },
      ],
    }),
    deleteDeployment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/deployment/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Deployment', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDeploymentsQuery,
  useGetDeploymentQuery,
  useCreateDeploymentMutation,
  useUpdateDeploymentMutation,
  useDeleteDeploymentMutation,
} = deploymentApi;
