'use client';

import { Spin, Result, Button } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  logout,
  restoreSessionThunk,
  selectSessionStatus,
  selectUser,
  selectUserPermissions,
  selectUserRoles
} from '@/store/slices/authSlice';
import { canAccessPath, getFirstAuthorizedPath, PUBLIC_ROUTES } from '@/config/routes';
import { useLanguage } from '@/components/AppProviders';

/**
 * AuthGuard — bảo vệ toàn bộ ứng dụng.
 *
 * Xử lý 3 trường hợp:
 *   1. Session chưa được restore (app mới load) → show spinner, gọi restoreSession
 *   2. Không có token / session hết hạn         → redirect /login
 *   3. Có session nhưng không đủ quyền          → show 403 Forbidden
 */
export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();

  const sessionStatus = useAppSelector(selectSessionStatus);
  const user = useAppSelector(selectUser);
  const userPermissions = useAppSelector(selectUserPermissions);
  const userRoles = useAppSelector(selectUserRoles).map((role) => role.name || role);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Restore session khi app load lần đầu
  useEffect(() => {
    if (sessionStatus === 'idle') {
      dispatch(restoreSessionThunk());
    }
  }, [sessionStatus, dispatch]);

  // Chờ restore session xong
  if (sessionStatus === 'idle' || sessionStatus === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" tip={t('common.loading')}>
          <div />
        </Spin>
      </div>
    );
  }

  // Session đã ready — kiểm tra auth
  if (!isPublicRoute) {
    const isAuthenticated = Boolean(user);

    // Không có session → redirect login
    if (!isAuthenticated) {
      router.replace('/login');
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <Spin size="large" />
        </div>
      );
    }

    // Có session nhưng không đủ quyền truy cập path hiện tại
    if (!canAccessPath(pathname, userPermissions, userRoles)) {
      const fallbackPath = getFirstAuthorizedPath(userPermissions, userRoles);
      if (pathname !== fallbackPath && fallbackPath !== '/no-access') {
        router.replace(fallbackPath);
        return (
          <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
            <Spin size="large" />
          </div>
        );
      }

      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <Result
            status="403"
            title={t('authGuard.forbiddenTitle')}
            subTitle={t('authGuard.forbiddenSubtitle')}
            extra={[
              <Button
                key="fallback"
                type="primary"
                onClick={() => router.push(fallbackPath)}
              >
                {fallbackPath === '/no-access'
                  ? t('authGuard.viewAccountStatus')
                  : t('authGuard.goToAuthorizedPage')}
              </Button>,
              <Button
                key="logout"
                onClick={() => {
                  dispatch(logout());
                  router.replace('/login');
                }}
              >
                {t('common.signOut')}
              </Button>
            ]}
          />
        </div>
      );
    }
  }

  return children;
}
