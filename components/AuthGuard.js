'use client';

import { Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getToken } from '@/utils/auth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = getToken();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!token && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoginPage, router, token]);

  if (!token && !isLoginPage) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return children;
}
