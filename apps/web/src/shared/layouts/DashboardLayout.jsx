import { Layout, Menu, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import {
  BarChartOutlined,
  FilePdfOutlined,
  LayoutOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { routes } from '@procraft/config';
import { Logo } from '@procraft/ui';

const menuItems = [
  { key: routes.dashboardProfile, icon: <UserOutlined />, label: 'Profile' },
  { key: routes.dashboardTemplates, icon: <LayoutOutlined />, label: 'Templates' },
  { key: routes.dashboardAnalytics, icon: <BarChartOutlined />, label: 'Analytics' },
  { key: routes.dashboardPdf, icon: <FilePdfOutlined />, label: 'PDF' },
  { key: routes.dashboardSubscription, icon: <ThunderboltOutlined />, label: 'Subscription' },
  { key: routes.dashboardSettings, icon: <SettingOutlined />, label: 'Settings' },
];

const pageTitles = {
  [routes.dashboard]: 'Dashboard',
  [routes.dashboardProfile]: 'Profile',
  [routes.dashboardTemplates]: 'Templates',
  [routes.dashboardAnalytics]: 'Analytics',
  [routes.dashboardPdf]: 'PDF',
  [routes.dashboardSubscription]: 'Subscription',
  [routes.dashboardSettings]: 'Settings',
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <Layout className="dashboard-shell">
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth={0}
        width={264}
        className="dashboard-sidebar"
        style={{ background: '#0D1B2A' }}
      >
        <div className="dashboard-sidebar__brand">
          <Logo size={36} textColor="#FFFFFF" />
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="dashboard-menu"
        />
      </Layout.Sider>

      <Layout className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <Typography.Text type="secondary">Workspace</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
          </div>
          <Typography.Text className="dashboard-topbar__status">Cookie session active</Typography.Text>
        </header>
        <Layout.Content className="dashboard-content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
