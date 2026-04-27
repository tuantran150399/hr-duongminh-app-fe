'use client';

import {
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  AppstoreOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Layout, Menu, Input, Button, Avatar, Typography } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { clearToken } from '@/utils/auth';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Bảng điều khiển' },
  { key: '/jobs', icon: <span className="material-symbols-outlined menu-icon">local_shipping</span>, label: 'Lô hàng' },
  { key: '/partners', icon: <TeamOutlined />, label: 'Đối tác' },
  { key: '/accounting', icon: <span className="material-symbols-outlined menu-icon">groups</span>, label: 'Khách hàng' },
  { key: '/users', icon: <SettingOutlined />, label: 'Cài đặt' }
  // { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất' }
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
        <Sider
          width={240}
          breakpoint="lg"
          collapsedWidth="0"
          className="dashboard-sider"
          theme="light"
        >
          {/* Brand */}
          <div className="sider-brand">
            <div className="sider-brand-icon">HR</div>
            <div>
              <div className="sider-brand-title">HR LOGISTIC</div>
              <div className="sider-brand-sub">MAKE IT EASY</div>
            </div>
          </div>

          {/* Menu */}
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={menuItems}
            onClick={handleMenuClick}
            className="sider-menu"
          />

          {/* CTA bottom */}
          <div className="sider-cta">
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              block
              onClick={() => router.push('/logout')}
            >
              Đăng xuất
            </Button>
          </div>
        </Sider>

        <Layout>
          {/* Header */}
          <Header className="dashboard-header">
            <div className="header-search">
            </div>
            <div className="header-actions">
              <Button type="text" icon={<BellOutlined />} className="header-icon-btn" />
              <Button type="text" icon={<QuestionCircleOutlined />} className="header-icon-btn" />
              <Button type="text" icon={<AppstoreOutlined />} className="header-icon-btn" />
              <div className="header-divider" />
              <Avatar
                size={28}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmQyJDXTGZKm4cYD-kWQElFA-NjsBpGesN0FGAh-X8nUPa7JFLJoKcigp6Yy96GXLwJry85JotHlnFNlQPa9-t9EPYjgcNVKp-gHwVM-wsXPmhL6CtnlHwUq8b8AaaqD7BvTI1GuoFPBFyfqs1G9Y83z_VnITvM0Bl0So8zJKJGLriPijG4UDrh-mdeY609K2wStGhmifATmCUhLgm4wrqP0LAduSGqPO87jON8IgoJ5CaQb3sONBi7i8YtOkT9KAPFV6ihdfGdfsU"
                alt="Profile"
              />
            </div>
          </Header>

          <Content className="dashboard-content">{children}</Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}
