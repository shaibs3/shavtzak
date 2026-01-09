import { baseApi } from './baseApi';
import { Shift } from '../../types/entities';
import { CreateShiftDto, UpdateShiftDto } from '../../types/dtos';

export const shiftsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShifts: builder.query<Shift[], { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/shifts',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Shift' as const, id })),
              { type: 'Shift', id: 'LIST' },
            ]
          : [{ type: 'Shift', id: 'LIST' }],
    }),
    getShift: builder.query<Shift, string>({
      query: (id) => `/shifts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Shift', id }],
    }),
    createShift: builder.mutation<Shift, CreateShiftDto>({
      query: (body) => ({
        url: '/shifts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Shift', id: 'LIST' }],
    }),
    updateShift: builder.mutation<Shift, { id: string; data: UpdateShiftDto }>({
      query: ({ id, data }) => ({
        url: `/shifts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Shift', id },
        { type: 'Shift', id: 'LIST' },
      ],
    }),
    deleteShift: builder.mutation<void, string>({
      query: (id) => ({
        url: `/shifts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Shift', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetShiftsQuery,
  useGetShiftQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} = shiftsApi;
