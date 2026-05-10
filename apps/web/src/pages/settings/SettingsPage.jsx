import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ExportOutlined,
  GlobalOutlined,
  LinkOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { routes } from '@procraft/config';
import { useAuth, useProfile } from '@procraft/hooks';

function read(user, camelKey, pascalKey, fallback = '') {
  return user?.[camelKey] ?? user?.[pascalKey] ?? fallback;
}

function getPortfolioUrl(user) {
  const username = read(user, 'username', 'Username').trim();
  return username ? `https://${username}.procraft.uz/` : '';
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile({ enabled: isAuthenticated });
  const email = read(user, 'email', 'Email', '-');
  const username = read(user, 'username', 'Username', '-');
  const isEmailConfirmed = Boolean(read(user, 'isEmailConfirmed', 'IsEmailConfirmed', false));
  const portfolioUrl = profile ? getPortfolioUrl(user) : '';

  if (!user) {
    return (
      <Alert
        type="warning"
        message="Account topilmadi"
        description="Sozlamalarni ko'rish uchun qayta login qiling."
      />
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>Sozlamalar</Typography.Title>
        <Typography.Paragraph type="secondary">
          Account va public link ma'lumotlari.
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            className="dashboard-card"
            title={(
              <Space>
                <UserOutlined />
                <span>Account</span>
              </Space>
            )}
          >
            <Descriptions column={1} colon={false}>
              <Descriptions.Item label="Email">
                <Space wrap>
                  <Typography.Text copyable>{email}</Typography.Text>
                  {isEmailConfirmed && (
                    <Tag color="green">Tasdiqlangan</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Username">
                <Typography.Text copyable>{username}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Portfolio link">
                {portfolioUrl ? (
                  <Typography.Text copyable>{portfolioUrl}</Typography.Text>
                ) : (
                  <Typography.Text type="secondary">Profil yaratilgandan keyin chiqadi</Typography.Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {portfolioUrl ? (
              <Button
                icon={<ExportOutlined />}
                href={portfolioUrl}
                target="_blank"
                rel="noreferrer"
              >
                Portfolio ochish
              </Button>
            ) : (
              <Button
                icon={<LinkOutlined />}
                loading={isProfileLoading}
                onClick={() => navigate(routes.dashboardProfile)}
              >
                Profilni to'ldirish
              </Button>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            className="dashboard-card"
            title={(
              <Space>
                <GlobalOutlined />
                <span>Interfeys</span>
                <Tag>V2</Tag>
              </Space>
            )}
          >
            <Select
              disabled
              value="uz"
              style={{ width: '100%' }}
              options={[
                { value: 'uz', label: "O'zbekcha" },
                { value: 'ru', label: 'Русский' },
                { value: 'en', label: 'English' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </section>
  );
}
