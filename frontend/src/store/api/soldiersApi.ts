import { baseApi } from './baseApi';
import { Soldier } from '../../types/entities';
import { CreateSoldierDto, UpdateSoldierDto } from '../../types/dtos';

export const soldiersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSoldiers: builder.query<Soldier[], void>({
      query: () => '/soldiers',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Soldier' as const, id })),
              { type: 'Soldier', id: 'LIST' },
            ]
          : [{ type: 'Soldier', id: 'LIST' }],
    }),
    getSoldier: builder.query<Soldier, string>({
      query: (id) => `/soldiers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Soldier', id }],
    }),
    createSoldier: builder.mutation<Soldier, CreateSoldierDto>({
      query: (body) => ({
        url: '/soldiers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Soldier', id: 'LIST' }],
    }),
    updateSoldier: builder.mutation<Soldier, { id: string; data: UpdateSoldierDto }>({
      query: ({ id, data }) => ({
        url: `/soldiers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Soldier', id },
        { type: 'Soldier', id: 'LIST' },
      ],
    }),
    deleteSoldier: builder.mutation<void, string>({
      query: (id) => ({
        url: `/soldiers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Soldier', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSoldiersQuery,
  useGetSoldierQuery,
  useCreateSoldierMutation,
  useUpdateSoldierMutation,
  useDeleteSoldierMutation,
} = soldiersApi;
