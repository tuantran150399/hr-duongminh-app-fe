'use client';

import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { clearAllTokens } from '@/utils/auth';
import { useLanguage } from '@/components/AppProviders';

export default function NoAccessPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();

  function handleLogout() {
    dispatch(logout());
    clearAllTokens();
    router.replace('/login');
  }

  return (
    <AuthGuard>
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <Result
          status="403"
          title={t('noAccess.title')}
          subTitle={t('noAccess.subtitle')}
          extra={[
            <Button key="logout" type="primary" onClick={handleLogout}>
              {t('common.signOut')}
            </Button>
          ]}
        />
      </main>
    </AuthGuard>
  );
}
