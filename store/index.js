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
import { debtsApi } from '@/store/services/debtsApi';
import { reportsApi } from '@/store/services/reportsApi';
import { pricingApi } from '@/store/services/pricingApi';
import { adminExtApi } from '@/store/services/adminExtApi';
import { hrmApi } from '@/store/services/hrmApi';
import { debitNotesApi } from '@/store/services/debitNotesApi';
import { cobApi } from '@/store/services/cobApi';
import { notificationsApi } from '@/store/services/notificationsApi';
import { adjustmentsApi } from '@/store/services/adjustmentsApi';
import { securityApi } from '@/store/services/securityApi';

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
    [debtsApi.reducerPath]: debtsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [pricingApi.reducerPath]: pricingApi.reducer,
    [adminExtApi.reducerPath]: adminExtApi.reducer,
    [hrmApi.reducerPath]: hrmApi.reducer,
    [debitNotesApi.reducerPath]: debitNotesApi.reducer,
    [cobApi.reducerPath]: cobApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [adjustmentsApi.reducerPath]: adjustmentsApi.reducer,
    [securityApi.reducerPath]: securityApi.reducer
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
      debtsApi.middleware,
      reportsApi.middleware,
      pricingApi.middleware,
      adminExtApi.middleware,
      hrmApi.middleware,
      debitNotesApi.middleware,
      cobApi.middleware,
      notificationsApi.middleware,
      adjustmentsApi.middleware,
      securityApi.middleware
    )
});
