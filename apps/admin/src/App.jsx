import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Progress,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  EyeOutlined,
  LinkOutlined,
  LogoutOutlined,
  ReloadOutlined,
  RiseOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { getApiBaseUrl } from "@procraft/config";
import { Logo } from "@procraft/ui";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function getErrorText(error) {
  return error?.response?.data?.message || "Xatolik yuz berdi. Qayta urinib ko'ring.";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPortfolioUrl(username) {
  return `https://${username}.procraft.uz/`;
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const maxTemplateUsers = useMemo(
    () => Math.max(1, ...(stats?.templateUsage ?? []).map((item) => item.users)),
    [stats],
  );

  async function loadStats() {
    setIsLoadingStats(true);

    try {
      const response = await api.get("/admin/stats");
      setStats(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        setIsAuthenticated(false);
      } else {
        message.error(getErrorText(error));
      }
    } finally {
      setIsLoadingStats(false);
    }
  }

  useEffect(() => {
    api
      .get("/admin/me")
      .then(() => loadStats())
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsBooting(false));
  }, []);

  async function handleLogin(values) {
    setIsLoggingIn(true);

    try {
      await api.post("/admin/login", values);
      await loadStats();
    } catch (error) {
      message.error(getErrorText(error));
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await api.post("/admin/logout");
    } finally {
      setStats(null);
      setIsAuthenticated(false);
      setIsLoggingOut(false);
    }
  }

  if (isBooting) {
    return (
      <main className="admin-center">
        <Spin size="large" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen isLoading={isLoggingIn} onFinish={handleLogin} />;
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-header__brand">
          <Logo size={36} />
          <div>
            <Typography.Title level={3}>Admin panel</Typography.Title>
            <Typography.Text type="secondary">Foydalanuvchilar va template statistikasi</Typography.Text>
          </div>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={isLoadingStats} onClick={loadStats}>
            Yangilash
          </Button>
          <Button icon={<LogoutOutlined />} loading={isLoggingOut} onClick={handleLogout}>
            Chiqish
          </Button>
        </Space>
      </header>

      <section className="admin-stats-grid">
        <Card>
          <Statistic
            title="Jami foydalanuvchilar"
            value={stats?.totalUsers ?? 0}
            prefix={<TeamOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Profil yaratganlar"
            value={stats?.totalProfiles ?? 0}
            prefix={<UserSwitchOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Bugun ro'yxatdan o'tganlar"
            value={stats?.usersToday ?? 0}
            prefix={<UserAddOutlined />}
          />
        </Card>
        <Card>
          <Statistic title="Bugun profil yaratganlar" value={stats?.profilesToday ?? 0} />
        </Card>
        <Card>
          <Statistic
            title="Public profil ko'rishlari"
            value={stats?.totalProfileViews ?? 0}
            prefix={<EyeOutlined />}
          />
        </Card>
        <Card>
          <Statistic
            title="Oxirgi 7 kun ko'rishlari"
            value={stats?.profileViewsLast7Days ?? 0}
            prefix={<RiseOutlined />}
          />
        </Card>
        <Card>
          <Statistic title="Template tanlamagan profillar" value={stats?.profilesWithoutTemplate ?? 0} />
        </Card>
      </section>

      <Card
        className="admin-table-card"
        title="Portfolio yaratganlar"
        extra={<Typography.Text type="secondary">{stats?.portfolioCreators?.length ?? 0} ta profil</Typography.Text>}
      >
        {stats?.portfolioCreators?.length ? (
          <Table
            rowKey="profileId"
            dataSource={stats.portfolioCreators}
            scroll={{ x: 980 }}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            columns={[
              {
                title: "Profil egasi",
                dataIndex: "fullName",
                width: 240,
                render: (fullName, item) => (
                  <div>
                    <Typography.Text strong>{fullName || item.username}</Typography.Text>
                    <Typography.Text type="secondary" className="admin-template-slug">
                      @{item.username}
                    </Typography.Text>
                  </div>
                ),
              },
              {
                title: "Email",
                dataIndex: "email",
                width: 260,
                render: (email, item) => (
                  <Space direction="vertical" size={4}>
                    <Typography.Text copyable>{email}</Typography.Text>
                    <Tag color={item.isEmailConfirmed ? "green" : "gold"}>
                      {item.isEmailConfirmed ? "Tasdiqlangan" : "Tasdiqlanmagan"}
                    </Tag>
                  </Space>
                ),
              },
              {
                title: "Kasb / template",
                dataIndex: "title",
                width: 220,
                render: (title, item) => (
                  <div>
                    <Typography.Text>{title || "-"}</Typography.Text>
                    <Typography.Text type="secondary" className="admin-template-slug">
                      {item.templateName || item.templateSlug || "Template yo'q"}
                    </Typography.Text>
                  </div>
                ),
              },
              {
                title: "Kontent",
                width: 170,
                render: (_, item) => (
                  <Typography.Text>
                    {item.skillsCount} skill, {item.projectsCount} loyiha, {item.experiencesCount} ish
                  </Typography.Text>
                ),
              },
              {
                title: "Ko'rish",
                dataIndex: "views",
                width: 100,
                render: (views) => <Typography.Text strong>{views}</Typography.Text>,
              },
              {
                title: "Yaratilgan",
                dataIndex: "createdAt",
                width: 170,
                render: formatDate,
              },
              {
                title: "Link",
                dataIndex: "username",
                width: 120,
                render: (username) => (
                  <Button
                    icon={<LinkOutlined />}
                    href={getPortfolioUrl(username)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ochish
                  </Button>
                ),
              },
            ]}
          />
        ) : (
          <Alert type="info" message="Hali portfolio yaratgan foydalanuvchilar yo'q." />
        )}
      </Card>

      <Card
        className="admin-table-card"
        title="Eng ko'p ko'rilgan profillar"
        extra={<Typography.Text type="secondary">{stats?.topProfiles?.length ?? 0} ta profil</Typography.Text>}
      >
        {stats?.topProfiles?.length ? (
          <Table
            rowKey="profileId"
            pagination={false}
            dataSource={stats.topProfiles}
            columns={[
              {
                title: "Profil",
                dataIndex: "fullName",
                render: (fullName, item) => (
                  <div>
                    <Typography.Text strong>{fullName || item.username}</Typography.Text>
                    <Typography.Text type="secondary" className="admin-template-slug">
                      {item.username}.procraft.uz
                    </Typography.Text>
                  </div>
                ),
              },
              {
                title: "Ko'rishlar",
                dataIndex: "views",
                width: 160,
                render: (views) => <Typography.Text strong>{views}</Typography.Text>,
              },
            ]}
          />
        ) : (
          <Alert type="info" message="Hali public profile ko'rishlari yo'q." />
        )}
      </Card>

      <Card
        className="admin-table-card"
        title="Template ishlatilishi"
        extra={<Typography.Text type="secondary">{stats?.templateUsage?.length ?? 0} ta model</Typography.Text>}
      >
        {stats?.templateUsage?.length ? (
          <Table
            rowKey="templateId"
            pagination={false}
            dataSource={stats.templateUsage}
            columns={[
              {
                title: "Template",
                dataIndex: "name",
                render: (name, item) => (
                  <div>
                    <Typography.Text strong>{name}</Typography.Text>
                    <Typography.Text type="secondary" className="admin-template-slug">
                      {item.slug}
                    </Typography.Text>
                  </div>
                ),
              },
              {
                title: "Foydalanganlar",
                dataIndex: "users",
                width: 180,
                render: (users) => <Typography.Text strong>{users}</Typography.Text>,
              },
              {
                title: "Ulush",
                dataIndex: "users",
                render: (users) => (
                  <Progress
                    percent={Math.round((users / maxTemplateUsers) * 100)}
                    showInfo={false}
                    strokeColor="#2563EB"
                  />
                ),
              },
            ]}
          />
        ) : (
          <Alert type="info" message="Hali template statistikasi yo'q." />
        )}
      </Card>
    </main>
  );
}

function LoginScreen({ isLoading, onFinish }) {
  return (
    <main className="admin-login">
      <Card className="admin-login-card">
        <Space direction="vertical" size={22} className="admin-login-card__body">
          <div className="admin-login-card__brand">
            <Logo size={42} />
            <Typography.Title level={3}>Admin kirish</Typography.Title>
            <Typography.Text type="secondary">Statistikani ko'rish uchun statik admin loginni kiriting.</Typography.Text>
          </div>

          <Form layout="vertical" requiredMark={false} onFinish={onFinish}>
            <Form.Item
              label="Login"
              name="username"
              rules={[{ required: true, message: "Login kiriting." }]}
            >
              <Input autoComplete="username" size="large" />
            </Form.Item>
            <Form.Item
              label="Parol"
              name="password"
              rules={[{ required: true, message: "Parol kiriting." }]}
            >
              <Input.Password autoComplete="current-password" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
              Kirish
            </Button>
          </Form>
        </Space>
      </Card>
    </main>
  );
}
