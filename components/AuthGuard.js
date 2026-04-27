'use client';


import { Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken } from '@/utils/auth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const token = getToken();

    if (!token && pathname !== '/login') {
      router.replace('/login');
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (!isClient || checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return children;
}
