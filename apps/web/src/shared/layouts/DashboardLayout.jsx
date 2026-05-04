import { Layout, Menu, Typography } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import {
  BarChartOutlined,
  FilePdfOutlined,
  LayoutOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { routes } from '@procraft/config';

const menuItems = [
  { key: routes.dashboardProfile, icon: <UserOutlined />, label: 'Profile' },
  { key: routes.dashboardTemplates, icon: <LayoutOutlined />, label: 'Templates' },
  { key: routes.dashboardAnalytics, icon: <BarChartOutlined />, label: 'Analytics' },
  { key: routes.dashboardPdf, icon: <FilePdfOutlined />, label: 'PDF' },
  { key: routes.dashboardSubscription, icon: <ThunderboltOutlined />, label: 'Subscription' },
  { key: routes.dashboardSettings, icon: <SettingOutlined />, label: 'Settings' },
];

/** Navy shell scaffolding — tighten navigation once IAM exists. */

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100%' }}>
      <Layout.Sider
        collapsible
        breakpoint="lg"
        style={{
          background: '#0D1B2A',
          boxShadow: 'inset -1px 0 0 #1e293b',
        }}
      >
        <div style={{ padding: '20px', color: '#fff', display: 'flex', gap: 8 }}>
          <TeamOutlined />
          <Typography.Title level={5} style={{ margin: 0, color: '#fff' }}>
            Procraft
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          style={{
            marginTop: 12,
            background: 'transparent',
            borderInlineEnd: 'none',
          }}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Content style={{ padding: 28 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
