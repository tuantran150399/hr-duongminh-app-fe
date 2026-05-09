import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';

// Existing RTK Query APIs
import { authApi } from '@/store/services/authApi';
import { jobsApi } from '@/store/services/jobsApi';
import { partnersApi } from '@/store/services/partnersApi';
import { dashboardApi } from '@/store/services/dashboardApi';
import { adminApi } from '@/store/services/adminApi';

// New RTK Query APIs (migrated from legacy services/)
import { advancesApi } from '@/store/services/advancesApi';
import { accountingApi } from '@/store/services/accountingApi';
import { paymentRequestsApi } from '@/store/services/paymentRequestsApi';
import { debtPoliciesApi } from '@/store/services/debtPoliciesApi';
import { reportsApi } from '@/store/services/reportsApi';
import { pricingApi } from '@/store/services/pricingApi';
import { adminExtApi } from '@/store/services/adminExtApi';
import { hrmApi } from '@/store/services/hrmApi';

export const store = configureStore({
  reducer: {
    // Auth / User state
    auth: authReducer,

    // RTK Query reducers
    [authApi.reducerPath]: authApi.reducer,
    [jobsApi.reducerPath]: jobsApi.reducer,
    [partnersApi.reducerPath]: partnersApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,

    // Migrated APIs
    [advancesApi.reducerPath]: advancesApi.reducer,
    [accountingApi.reducerPath]: accountingApi.reducer,
    [paymentRequestsApi.reducerPath]: paymentRequestsApi.reducer,
    [debtPoliciesApi.reducerPath]: debtPoliciesApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [pricingApi.reducerPath]: pricingApi.reducer,
    [adminExtApi.reducerPath]: adminExtApi.reducer,
    [hrmApi.reducerPath]: hrmApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      jobsApi.middleware,
      partnersApi.middleware,
      dashboardApi.middleware,
      adminApi.middleware,
      advancesApi.middleware,
      accountingApi.middleware,
      paymentRequestsApi.middleware,
      debtPoliciesApi.middleware,
      reportsApi.middleware,
      pricingApi.middleware,
      adminExtApi.middleware,
      hrmApi.middleware
    )
});
