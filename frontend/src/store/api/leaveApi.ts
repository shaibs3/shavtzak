import { baseApi } from './baseApi';
import { LeaveRecord } from '../../types/entities';
import { CreateLeaveRecordDto, UpdateLeaveRecordDto } from '../../types/dtos';

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaveRecords: builder.query<LeaveRecord[], { soldierId?: string }>({
      query: (params) => ({
        url: '/leave',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Leave' as const, id })),
              { type: 'Leave', id: 'LIST' },
            ]
          : [{ type: 'Leave', id: 'LIST' }],
    }),
    getLeaveRecord: builder.query<LeaveRecord, string>({
      query: (id) => `/leave/${id}`,
      providesTags: (result, error, id) => [{ type: 'Leave', id }],
    }),
    createLeaveRecord: builder.mutation<LeaveRecord, CreateLeaveRecordDto>({
      query: (body) => ({
        url: '/leave',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),
    updateLeaveRecord: builder.mutation<LeaveRecord, { id: string; data: UpdateLeaveRecordDto }>({
      query: ({ id, data }) => ({
        url: `/leave/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Leave', id },
        { type: 'Leave', id: 'LIST' },
      ],
    }),
    deleteLeaveRecord: builder.mutation<void, string>({
      query: (id) => ({
        url: `/leave/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetLeaveRecordsQuery,
  useGetLeaveRecordQuery,
  useCreateLeaveRecordMutation,
  useUpdateLeaveRecordMutation,
  useDeleteLeaveRecordMutation,
} = leaveApi;
