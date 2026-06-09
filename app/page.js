'use client';

import { useEffect } from 'react';
import { Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getFirstAuthorizedPath } from '@/config/routes';
import { restoreSessionThunk, selectSessionStatus, selectUser, selectUserPermissions } from '@/store/slices/authSlice';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sessionStatus = useAppSelector(selectSessionStatus);
  const user = useAppSelector(selectUser);
  const userPermissions = useAppSelector(selectUserPermissions);

  useEffect(() => {
    if (sessionStatus === 'idle') {
      dispatch(restoreSessionThunk());
      return;
    }

    if (sessionStatus === 'ready') {
      if (!user) {
        router.replace('/login');
        return;
      }
      router.replace(getFirstAuthorizedPath(userPermissions));
    }
  }, [dispatch, router, sessionStatus, user, userPermissions]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Spin size="large" />
    </div>
  );
}
