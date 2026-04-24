'use client';

import { Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken } from '@/utils/auth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token && pathname !== '/login') {
      router.replace('/login');
      return;
    }

    // This guard intentionally waits until localStorage is available on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return children;
}
