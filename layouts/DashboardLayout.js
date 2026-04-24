'use client';

import {
  BarChartOutlined,
  DashboardOutlined,
  LogoutOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { clearToken } from '@/utils/auth';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/jobs', icon: <BarChartOutlined />, label: 'Jobs' },
  { key: '/partners', icon: <TeamOutlined />, label: 'Partners' },
  { key: '/accounting', icon: <ShopOutlined />, label: 'Accounting' },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Logout' }
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleMenuClick({ key }) {
    if (key === 'logout') {
      clearToken();
      router.replace('/login');
      return;
    }

    router.push(key);
  }

  const selectedKey = menuItems
    .filter((item) => item.key !== 'logout')
    .find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))?.key;

  return (
    <AuthGuard>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider breakpoint="lg" collapsedWidth="0">
          <div className="app-logo">ERP Logistics</div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        <Layout>
          <Header className="app-header">
            <Typography.Text strong>Internal Logistics System</Typography.Text>
            <Typography.Text className="muted-text">Demo frontend</Typography.Text>
          </Header>
          <Content className="content-wrap">{children}</Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}
