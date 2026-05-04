import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { getMe, login as loginService } from '@/services/authService';
import { clearAllTokens, getToken, setToken } from '@/utils/auth';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  STAFF: 'STAFF',
  VIEWER: 'VIEWER'
};

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',

  JOBS_VIEW: 'jobs:view',
  JOBS_CREATE: 'jobs:create',
  JOBS_EDIT: 'jobs:edit',
  JOBS_DELETE: 'jobs:delete',
  JOB_VIEW: 'job:view',
  JOB_CREATE: 'job:create',
  JOB_EDIT: 'job:edit',
  JOB_CLOSE: 'job:close',

  PARTNERS_VIEW: 'partners:view',
  PARTNERS_CREATE: 'partners:create',
  PARTNERS_EDIT: 'partners:edit',
  PARTNERS_DELETE: 'partners:delete',
  PARTNER_MANAGE: 'partner:manage',

  ACCOUNTING_VIEW: 'accounting:view',
  ACCOUNTING_CREATE: 'accounting:create',
  ACCOUNTING_EDIT: 'accounting:edit',
  ACCOUNTING_POST: 'accounting:post',

  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  BRANCH_MANAGE: 'branch:manage',
  AUDITLOG_VIEW: 'auditlog:view'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'],
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOBS_EDIT,
    PERMISSIONS.JOBS_DELETE,
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.JOB_CLOSE,
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.PARTNERS_CREATE,
    PERMISSIONS.PARTNERS_EDIT,
    PERMISSIONS.PARTNERS_DELETE,
    PERMISSIONS.PARTNER_MANAGE,
    PERMISSIONS.ACCOUNTING_VIEW,
    PERMISSIONS.ACCOUNTING_CREATE,
    PERMISSIONS.ACCOUNTING_EDIT,
    PERMISSIONS.ACCOUNTING_POST,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.BRANCH_MANAGE,
    PERMISSIONS.AUDITLOG_VIEW
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOBS_EDIT,
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.PARTNERS_CREATE,
    PERMISSIONS.PARTNERS_EDIT,
    PERMISSIONS.PARTNER_MANAGE,
    PERMISSIONS.ACCOUNTING_VIEW
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.ACCOUNTING_VIEW,
    PERMISSIONS.ACCOUNTING_CREATE,
    PERMISSIONS.ACCOUNTING_EDIT,
    PERMISSIONS.ACCOUNTING_POST
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOB_VIEW,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.PARTNERS_VIEW
  ],
  [ROLES.VIEWER]: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.JOBS_VIEW, PERMISSIONS.JOB_VIEW]
};

const PERMISSION_ALIASES = {
  'job:view': [PERMISSIONS.JOBS_VIEW],
  'job:create': [PERMISSIONS.JOBS_CREATE],
  'job:edit': [PERMISSIONS.JOBS_EDIT],
  'partner:manage': [
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.PARTNERS_CREATE,
    PERMISSIONS.PARTNERS_EDIT,
    PERMISSIONS.PARTNERS_DELETE
  ],
  'user:manage': [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_MANAGE],
  'role:manage': [PERMISSIONS.USERS_VIEW],
  'branch:manage': [PERMISSIONS.USERS_VIEW],
  'auditlog:view': [PERMISSIONS.USERS_VIEW]
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const token = await loginService(username, password);
      setToken(token);
      const user = await getMe();
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const restoreSessionThunk = createAsyncThunk(
  'auth/restoreSession',
  async (_arg, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) throw new Error('No token');
      const user = await getMe();
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  token: null,
  user: null,
  sessionStatus: 'idle',
  loginLoading: false,
  loginError: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.sessionStatus = 'idle';
      clearAllTokens();
    },
    updateUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearLoginError(state) {
      state.loginError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.sessionStatus = 'ready';
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload ?? 'Login failed';
      })
      .addCase(restoreSessionThunk.pending, (state) => {
        state.sessionStatus = 'loading';
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.sessionStatus = 'ready';
      })
      .addCase(restoreSessionThunk.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.sessionStatus = 'ready';
      });
  }
});

export const { logout, updateUser, clearLoginError } = authSlice.actions;
export default authSlice.reducer;

export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectSessionStatus = (state) => state.auth.sessionStatus;
export const selectLoginLoading = (state) => state.auth.loginLoading;
export const selectLoginError = (state) => state.auth.loginError;
export const selectUserRoles = (state) => state.auth.user?.roles ?? [];

export const selectUserPermissions = createSelector(
  [(state) => state.auth.user],
  (user) => {
    if (!user) return [];

    const roles = (user.roles ?? []).map((role) => role.name || role);
    const explicit = user.permissions ?? [];

    if (roles.includes(ROLES.SUPER_ADMIN) || explicit.includes('*')) {
      return ['*'];
    }

    const fromRoles = roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? []);
    const expanded = [...fromRoles, ...explicit].flatMap((permission) => [
      permission,
      ...(PERMISSION_ALIASES[permission] ?? [])
    ]);

    return [...new Set(expanded)];
  }
);

export const selectHasPermission = (permission) => (state) => {
  const permissions = selectUserPermissions(state);
  return permissions.includes('*') || permissions.includes(permission);
};

export const selectHasRole = (...roles) => (state) => {
  const userRoles = selectUserRoles(state).map((role) => role.name || role);
  return roles.some((role) => userRoles.includes(role));
};
