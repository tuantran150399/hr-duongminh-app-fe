'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';

/**
 * StoreProvider bọc toàn bộ app với Redux store.
 *
 * Cần thiết vì Next.js App Router dùng Server Components mặc định —
 * Redux Provider phải là Client Component.
 */
export function StoreProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
