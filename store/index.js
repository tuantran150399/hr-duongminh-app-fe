import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import { authApi } from '@/store/services/authApi';
import { jobsApi } from '@/store/services/jobsApi';
import { partnersApi } from '@/store/services/partnersApi';
import { dashboardApi } from '@/store/services/dashboardApi';
import { adminApi } from '@/store/services/adminApi';

export const store = configureStore({
  reducer: {
    // Auth / User state
    auth: authReducer,

    // RTK Query reducers — quản lý cache của từng API slice
    [authApi.reducerPath]: authApi.reducer,
    [jobsApi.reducerPath]: jobsApi.reducer,
    [partnersApi.reducerPath]: partnersApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer

    // Thêm các reducer khác tại đây khi cần (ví dụ: uiSlice, notificationSlice...)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      jobsApi.middleware,
      partnersApi.middleware,
      dashboardApi.middleware,
      adminApi.middleware
    )
});
