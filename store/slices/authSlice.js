import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { getMe, login as loginService } from '@/services/authService';
import {
  clearAllTokens,
  getToken,
  setToken
} from '@/utils/auth';

// --------------------------------------------------------------------------
// Định nghĩa roles và permissions
// --------------------------------------------------------------------------

/**
 * ROLE_HIERARCHY — mỗi role bao gồm toàn bộ quyền của role bên dưới.
 *
 * SUPER_ADMIN  → toàn quyền
 * ADMIN        → quản lý operations + accounting
 * MANAGER      → xem + tạo jobs, partners, accounting
 * ACCOUNTANT   → chỉ accounting
 * STAFF        → chỉ xem jobs, partners
 * VIEWER       → chỉ đọc dashboard
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  STAFF: 'STAFF',
  VIEWER: 'VIEWER'
};

/**
 * PERMISSIONS — danh sách quyền chi tiết theo module.
 * Format: `<module>:<action>`
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',

  // Jobs
  JOBS_VIEW: 'jobs:view',
  JOBS_CREATE: 'jobs:create',
  JOBS_EDIT: 'jobs:edit',
  JOBS_DELETE: 'jobs:delete',

  // Partners
  PARTNERS_VIEW: 'partners:view',
  PARTNERS_CREATE: 'partners:create',
  PARTNERS_EDIT: 'partners:edit',
  PARTNERS_DELETE: 'partners:delete',

  // Accounting
  ACCOUNTING_VIEW: 'accounting:view',
  ACCOUNTING_CREATE: 'accounting:create',
  ACCOUNTING_EDIT: 'accounting:edit',

  // Users / Settings
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage'
};

/** Map role → danh sách permissions được cấp mặc định */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'], // wildcard — toàn quyền
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOBS_EDIT,
    PERMISSIONS.JOBS_DELETE,
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.PARTNERS_CREATE,
    PERMISSIONS.PARTNERS_EDIT,
    PERMISSIONS.PARTNERS_DELETE,
    PERMISSIONS.ACCOUNTING_VIEW,
    PERMISSIONS.ACCOUNTING_CREATE,
    PERMISSIONS.ACCOUNTING_EDIT,
    PERMISSIONS.USERS_VIEW
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOBS_EDIT,
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.PARTNERS_CREATE,
    PERMISSIONS.PARTNERS_EDIT,
    PERMISSIONS.ACCOUNTING_VIEW
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.ACCOUNTING_VIEW,
    PERMISSIONS.ACCOUNTING_CREATE,
    PERMISSIONS.ACCOUNTING_EDIT
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.PARTNERS_VIEW
  ],
  [ROLES.VIEWER]: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.JOBS_VIEW]
};

// --------------------------------------------------------------------------
// Async thunks
// --------------------------------------------------------------------------

/** Đăng nhập: lấy token rồi fetch thông tin user */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const token = await loginService(username, password);
      setToken(token);
      const user = await getMe();
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

/** Khôi phục session từ localStorage khi app load lần đầu */
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

// --------------------------------------------------------------------------
// Slice
// --------------------------------------------------------------------------

const initialState = {
  /** Token JWT hiện tại */
  token: null,

  /** Thông tin user đang đăng nhập */
  user: null,

  /** Trạng thái khôi phục session ban đầu */
  sessionStatus: 'idle', // 'idle' | 'loading' | 'ready'

  /** Loading khi đang login */
  loginLoading: false,

  /** Lỗi login */
  loginError: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Đăng xuất — xoá token + reset state */
    logout(state) {
      state.token = null;
      state.user = null;
      state.sessionStatus = 'idle';
      clearAllTokens();
    },

    /** Cập nhật thông tin user (dùng sau khi user tự edit profile) */
    updateUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    /** Xoá lỗi login */
    clearLoginError(state) {
      state.loginError = null;
    }
  },
  extraReducers: (builder) => {
    // --- loginThunk ---
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
        state.loginError = action.payload ?? 'Đăng nhập thất bại';
      });

    // --- restoreSessionThunk ---
    builder
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
        state.sessionStatus = 'ready'; // ready nhưng không có user → redirect login
      });
  }
});

export const { logout, updateUser, clearLoginError } = authSlice.actions;
export default authSlice.reducer;

// --------------------------------------------------------------------------
// Selectors
// --------------------------------------------------------------------------

export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;
export const selectSessionStatus = (state) => state.auth.sessionStatus;
export const selectLoginLoading = (state) => state.auth.loginLoading;
export const selectLoginError = (state) => state.auth.loginError;

/** Lấy danh sách roles của user hiện tại */
export const selectUserRoles = (state) => state.auth.user?.roles ?? [];

/** Lấy danh sách permissions của user (merge từ roles + explicit permissions) */
export const selectUserPermissions = createSelector(
  [(state) => state.auth.user],
  (user) => {
    if (!user) return [];

    const roles = user.roles ?? [];
    const explicit = user.permissions ?? [];

    // Wildcard từ roles
    if (roles.includes(ROLES.SUPER_ADMIN) || explicit.includes('*')) {
      return ['*'];
    }

    // Merge permissions từ tất cả roles được gán
    const fromRoles = roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? []);
    return [...new Set([...fromRoles, ...explicit])];
  }
);

/**
 * Kiểm tra user có quyền `permission` không.
 * Hỗ trợ wildcard '*'.
 */
export const selectHasPermission = (permission) => (state) => {
  const permissions = selectUserPermissions(state);
  return permissions.includes('*') || permissions.includes(permission);
};

/**
 * Kiểm tra user có ít nhất 1 trong các roles không.
 */
export const selectHasRole = (...roles) => (state) => {
  const userRoles = selectUserRoles(state);
  return roles.some((role) => userRoles.includes(role));
};
