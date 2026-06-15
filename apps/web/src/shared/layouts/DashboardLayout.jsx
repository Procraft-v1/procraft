"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Drawer, Layout, Menu, Modal, Segmented, Space, Typography } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  BarChartOutlined,
  ExportOutlined,
  FilePdfOutlined,
  IdcardOutlined,
  LayoutOutlined,
  LoginOutlined,
  LinkOutlined,
  LogoutOutlined,
  MenuOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { PROCRAFT_CONTACT_LINKS, routes } from "@procraft/config";
import { useAuth, useProfile } from "@procraft/hooks";
import { Logo } from "@procraft/ui";

const LANG_STORAGE_KEY = "procraft_lang";
const LANG_OPTIONS = [
  { label: "UZ", value: "uz" },
  { label: "EN", value: "en" },
  { label: "RU", value: "ru" },
];

function buildMenuItems(t) {
  return [
    { key: routes.dashboardProfile, icon: <UserOutlined />, label: t("sidebar.profile") },
    {
      key: routes.dashboardTemplates,
      icon: <LayoutOutlined />,
      label: t("sidebar.templates"),
    },
    {
      key: routes.dashboardAnalytics,
      icon: <BarChartOutlined />,
      label: t("sidebar.analytics"),
    },
    { key: routes.dashboardPdf, icon: <FilePdfOutlined />, label: t("sidebar.pdf") },
    {
      key: routes.dashboardSubscription,
      icon: <ThunderboltOutlined />,
      label: t("sidebar.subscription"),
      disabled: true,
    },
    {
      key: routes.dashboardSettings,
      icon: <IdcardOutlined />,
      label: t("sidebar.settings"),
    },
  ];
}

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

function getCurrentLocation() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function DashboardFooter() {
  const { t } = useTranslation();

  return (
    <footer className="dashboard-footer">
      <Typography.Text className="dashboard-footer__brand">Procraft</Typography.Text>
      <nav className="dashboard-footer__links" aria-label={t("footer.contactLabel")}>
        <Typography.Link
          href={PROCRAFT_CONTACT_LINKS.telegram}
          target="_blank"
          rel="noopener noreferrer"
        >
          Telegram
        </Typography.Link>
        <Typography.Link href={PROCRAFT_CONTACT_LINKS.email}>
          Email
        </Typography.Link>
        <span className="dashboard-footer__disabled" aria-disabled="true">
          Instagram
        </span>
        <Typography.Link
          href={PROCRAFT_CONTACT_LINKS.youtube}
          target="_blank"
          rel="noopener noreferrer"
        >
          YouTube
        </Typography.Link>
      </nav>
    </footer>
  );
}

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(null);
  const [isHeaderShrunk, setIsHeaderShrunk] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile({ enabled: isAuthenticated });
  const userLabel = user?.username || user?.email || "Account";
  const portfolioUrl = profile ? getPortfolioUrl(user) : "";
  const selectedKeys = [pathname];
  const menuItems = buildMenuItems(t);
  const currentLang = LANG_OPTIONS.some((option) => option.value === i18n.language)
    ? i18n.language
    : "uz";

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_STORAGE_KEY, lng);
    }
  };

  useEffect(() => {
    const handleAuthRequired = (event) => {
      setAuthPrompt({
        returnTo: event.detail?.returnTo || getCurrentLocation(),
      });
    };

    window.addEventListener("procraft:auth-required", handleAuthRequired);
    return () => window.removeEventListener("procraft:auth-required", handleAuthRequired);
  }, [pathname]);

  useEffect(() => {
    window.__procraftRequireAuth = (returnTo) => {
      setAuthPrompt({
        returnTo: returnTo || getCurrentLocation(),
      });
    };

    return () => {
      delete window.__procraftRequireAuth;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderShrunk(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuClick = ({ key }) => {
    router.push(key);
    setIsMobileMenuOpen(false);
  };

  const getReturnTo = (nextReturnTo) =>
    typeof nextReturnTo === "string" ? nextReturnTo : getCurrentLocation();

  const goToLogin = (nextReturnTo) => {
    const returnTo = getReturnTo(nextReturnTo);
    router.push(`${routes.login}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const goToRegister = (nextReturnTo) => {
    const returnTo = getReturnTo(nextReturnTo);
    router.push(`${routes.register}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const handleLogout = async () => {
    if (!user) {
      setIsMobileMenuOpen(false);
      goToLogin();
      return;
    }

    setIsLoggingOut(true);
    setIsMobileMenuOpen(false);

    try {
      await logout();
      router.replace(routes.login);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const logoutMenuItems = [
    {
      key: user ? "logout" : "login",
      icon: user ? <LogoutOutlined /> : <LoginOutlined />,
      label: user
        ? isLoggingOut
          ? t("sidebar.loggingOut")
          : t("sidebar.logout")
        : t("sidebar.login"),
      disabled: isLoggingOut,
    },
  ];

  return (
    <Layout className="dashboard-shell">
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth={0}
        width={264}
        className="dashboard-sidebar"
        style={{ background: "#0D1B2A" }}
      >
        <button
          type="button"
          className="dashboard-sidebar__brand dashboard-sidebar__brand-button"
          onClick={() => router.push(routes.dashboard)}
        >
          <Logo size={36} textColor="#FFFFFF" />
        </button>
        <Menu
          theme="dark"
          selectedKeys={selectedKeys}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          className="dashboard-menu"
        />
        <div className="dashboard-sidebar__footer">
          <Menu
            theme="dark"
            selectable={false}
            mode="inline"
            items={logoutMenuItems}
            onClick={handleLogout}
            className="dashboard-menu dashboard-menu--logout"
          />
        </div>
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
        <button
          type="button"
          className="dashboard-sidebar__brand dashboard-sidebar__brand-button"
          onClick={() => {
            router.push(routes.dashboard);
            setIsMobileMenuOpen(false);
          }}
        >
          <Logo size={36} textColor="#FFFFFF" />
        </button>
        <Menu
          theme="dark"
          selectedKeys={selectedKeys}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          className="dashboard-menu"
        />
        <div className="dashboard-sidebar__footer">
          <Menu
            theme="dark"
            selectable={false}
            mode="inline"
            items={logoutMenuItems}
            onClick={handleLogout}
            className="dashboard-menu dashboard-menu--logout"
          />
        </div>
      </Drawer>

      <Layout className="dashboard-main">
        <header className={`dashboard-topbar${isHeaderShrunk ? " dashboard-topbar--shrunk" : ""}`}>
          <div className="dashboard-topbar__left">
            <Button
              className="dashboard-menu-button"
              icon={<MenuOutlined />}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label={t("topbar.menuOpen")}
            />
            <button
              type="button"
              className="dashboard-topbar__mobile-brand"
              onClick={() => router.push(routes.dashboard)}
              aria-label={t("topbar.homeLink")}
            >
              <Logo size={30} showText={false} />
            </button>
          </div>

          <div className="dashboard-topbar__actions">
            <Segmented
              className="dashboard-lang-switcher"
              size="small"
              value={currentLang}
              onChange={handleLanguageChange}
              options={LANG_OPTIONS}
            />
            {portfolioUrl ? (
              <Button
                icon={<ExportOutlined />}
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("topbar.portfolio")}
              </Button>
            ) : (
              <Button
                icon={<LinkOutlined />}
                onClick={() => router.push(routes.dashboardProfile)}
                loading={isProfileLoading}
              >
                {t("topbar.profile")}
              </Button>
            )}
            {user ? (
              <Space className="dashboard-topbar__account" size={10}>
                <Avatar size={36} style={{ background: "#2563EB" }}>
                  {getInitials(user)}
                </Avatar>
                <div>
                  <Typography.Text strong>{userLabel}</Typography.Text>
                </div>
              </Space>
            ) : (
              <Button icon={<LoginOutlined />} type="primary" onClick={() => goToLogin()}>
                {t("topbar.login")}
              </Button>
            )}
          </div>
        </header>
        <Layout.Content className="dashboard-content">
          {children}
          <DashboardFooter />
        </Layout.Content>
      </Layout>

      <Modal
        open={Boolean(authPrompt)}
        title={t("auth.modal.title")}
        footer={[
          <Button key="later" onClick={() => setAuthPrompt(null)}>
            {t("auth.modal.later")}
          </Button>,
          <Button key="login" onClick={() => {
            const returnTo = authPrompt?.returnTo || getCurrentLocation();
            setAuthPrompt(null);
            goToLogin(returnTo);
          }}>
            {t("auth.modal.login")}
          </Button>,
          <Button key="register" type="primary" onClick={() => {
            const returnTo = authPrompt?.returnTo || getCurrentLocation();
            setAuthPrompt(null);
            goToRegister(returnTo);
          }}>
            {t("auth.modal.register")}
          </Button>,
        ]}
        centered
        onCancel={() => setAuthPrompt(null)}
      >
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {t("auth.modal.description")}
        </Typography.Paragraph>
      </Modal>
    </Layout>
  );
}
