import { useState } from "react";
import { Avatar, Button, Drawer, Layout, Menu, Space, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  BarChartOutlined,
  ExportOutlined,
  FilePdfOutlined,
  IdcardOutlined,
  LayoutOutlined,
  LinkOutlined,
  MenuOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { routes } from "@procraft/config";
import { useAuth } from "@procraft/hooks";
import { Logo } from "@procraft/ui";

const menuItems = [
  { key: routes.dashboardProfile, icon: <UserOutlined />, label: "Profil" },
  {
    key: routes.dashboardTemplates,
    icon: <LayoutOutlined />,
    label: "Shablonlar",
  },
  {
    key: routes.dashboardAnalytics,
    icon: <BarChartOutlined />,
    label: "Analitika",
  },
  { key: routes.dashboardPdf, icon: <FilePdfOutlined />, label: "PDF" },
  {
    key: routes.dashboardSubscription,
    icon: <ThunderboltOutlined />,
    label: "Obuna (V2)",
    disabled: true,
  },
  {
    key: routes.dashboardSettings,
    icon: <IdcardOutlined />,
    label: "Profile",
  },
];

const pageTitles = {
  [routes.dashboard]: "Bosh panel",
  [routes.dashboardProfile]: "Profil",
  [routes.dashboardTemplates]: "Shablonlar",
  [routes.dashboardAnalytics]: "Analitika",
  [routes.dashboardPdf]: "PDF",
  [routes.dashboardSubscription]: "Obuna",
  [routes.dashboardSettings]: "Profile",
};

const pageDescriptions = {
  [routes.dashboard]: "Profilingiz holati va tezkor amallar.",
  [routes.dashboardProfile]:
    "Portfolio ma'lumotlarini to'ldiring va tartiblang.",
  [routes.dashboardTemplates]: "Public profilingiz uchun ko'rinish tanlang.",
  [routes.dashboardAnalytics]: "Profil ko'rishlari va faollik statistikasi.",
  [routes.dashboardPdf]: "Resume faylingizni PDF formatida yuklab oling.",
  [routes.dashboardSubscription]: "Tarif va imkoniyatlarni boshqaring.",
  [routes.dashboardSettings]: "Account va public link ma'lumotlari.",
};

function getInitials(user) {
  const source = user?.fullName || user?.username || user?.email || "P";
  return source
    .split(/[ @._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getPortfolioUrl(user) {
  const username = user?.username?.trim();
  return username ? `https://${username}.procraft.uz/` : "";
}

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || "Bosh panel";
  const description =
    pageDescriptions[location.pathname] || "Procraft ish maydoni.";
  const userLabel = user?.username || user?.email || "Account";
  const portfolioUrl = getPortfolioUrl(user);
  const selectedKeys = [location.pathname];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setIsMobileMenuOpen(false);
  };

  return (
    <Layout className="dashboard-shell">
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth={0}
        width={264}
        className="dashboard-sidebar"
        style={{ background: "#0D1B2A" }}
      >
        <div className="dashboard-sidebar__brand">
          <Logo size={36} textColor="#FFFFFF" />
        </div>
        <Menu
          theme="dark"
          selectedKeys={selectedKeys}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          className="dashboard-menu"
        />
      </Layout.Sider>

      <Drawer
        className="dashboard-mobile-drawer"
        placement="left"
        width={280}
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        closable={false}
        styles={{
          body: { padding: 0, background: "#0D1B2A" },
          content: { background: "#0D1B2A" },
        }}
      >
        <div className="dashboard-sidebar__brand">
          <Logo size={36} textColor="#FFFFFF" />
        </div>
        <Menu
          theme="dark"
          selectedKeys={selectedKeys}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          className="dashboard-menu"
        />
      </Drawer>

      <Layout className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <Button
              className="dashboard-menu-button"
              icon={<MenuOutlined />}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menyuni ochish"
            />
            <div className="dashboard-topbar__heading">
              <Typography.Title level={4} style={{ marginTop: "0" }}>
                {title}
              </Typography.Title>
              <Typography.Text type="secondary">{description}</Typography.Text>
            </div>
          </div>

          <div className="dashboard-topbar__actions">
            {portfolioUrl ? (
              <Button
                icon={<ExportOutlined />}
                href={portfolioUrl}
                target="_blank"
                rel="noreferrer"
              >
                Portfolio
              </Button>
            ) : (
              <Button
                icon={<LinkOutlined />}
                onClick={() => navigate(routes.dashboardProfile)}
              >
                Profil
              </Button>
            )}
            <Space className="dashboard-topbar__account" size={10}>
              <Avatar size={36} style={{ background: "#2563EB" }}>
                {getInitials(user)}
              </Avatar>
              <div>
                <Typography.Text strong>{userLabel}</Typography.Text>
              </div>
            </Space>
          </div>
        </header>
        <Layout.Content className="dashboard-content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
