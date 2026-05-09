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
  Typography,
  message,
} from "antd";
import {
  LogoutOutlined,
  ReloadOutlined,
  TeamOutlined,
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
          <Statistic title="Template tanlamagan profillar" value={stats?.profilesWithoutTemplate ?? 0} />
        </Card>
      </section>

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
              name="login"
              rules={[{ required: true, message: "Login kiriting." }]}
            >
              <Input autoComplete="login" size="large" />
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
