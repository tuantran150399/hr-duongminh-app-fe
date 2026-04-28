import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import { jobsApi } from '@/store/services/jobsApi';
import { partnersApi } from '@/store/services/partnersApi';
import { dashboardApi } from '@/store/services/dashboardApi';

export const store = configureStore({
  reducer: {
    // Auth / User state
    auth: authReducer,

    // RTK Query reducers — quản lý cache của từng API slice
    [jobsApi.reducerPath]: jobsApi.reducer,
    [partnersApi.reducerPath]: partnersApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer

    // Thêm các reducer khác tại đây khi cần (ví dụ: uiSlice, notificationSlice...)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      jobsApi.middleware,
      partnersApi.middleware,
      dashboardApi.middleware
    )
});
