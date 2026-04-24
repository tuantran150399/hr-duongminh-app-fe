'use client';

import { Card, Empty } from 'antd';
import DashboardLayout from '@/layouts/DashboardLayout';

export default function UsersPage() {
  return (
    <DashboardLayout>
      <h1 className="page-title">Users</h1>
      <Card>
        <Empty description="User management can be connected here later." />
      </Card>
    </DashboardLayout>
  );
}
