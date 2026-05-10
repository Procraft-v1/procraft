import { Button, Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ExportOutlined,
  FilePdfOutlined,
  LayoutOutlined,
  LinkOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { routes } from '@procraft/config';
import { useAuth, useProfile } from '@procraft/hooks';

function getCompletion(profile) {
  const checks = [
    Boolean(profile?.fullName),
    Boolean(profile?.title),
    Boolean(profile?.bio),
    Boolean(profile?.location),
    Boolean(profile?.templateSlug),
    (profile?.skills?.length ?? 0) > 0,
    (profile?.projects?.length ?? 0) > 0,
    (profile?.socialLinks?.length ?? 0) > 0,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile({ enabled: isAuthenticated });
  const portfolioUrl = profile && user?.username ? `https://${user.username}.procraft.uz/` : '';
  const completion = getCompletion(profile);
  const hasProfile = Boolean(profile);
  const nextStep = !hasProfile
    ? "Profil ma'lumotlarini kiriting"
    : completion < 70
      ? "Ko'nikma, loyiha va social linklarni to'ldiring"
      : "Public linkni ulashing yoki PDF tayyorlang";

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Space size={10} wrap>
          <Typography.Title level={2} style={{ margin: 0 }}>Procraft ish maydoningiz</Typography.Title>
          <Tag color={hasProfile ? 'green' : 'blue'}>
            {hasProfile ? 'Profil yaratilgan' : 'Boshlashga tayyor'}
          </Tag>
        </Space>
        <Typography.Paragraph type="secondary">
          Portfolio holatini kuzating, keyingi qadamlarni bajaring va public sahifangizni boshqaring.
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} lg={14}>
          <Card className="dashboard-card" style={{ height: '100%' }}>
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <Space size={12}>
                <ThunderboltOutlined style={{ color: '#2563EB', fontSize: 24 }} />
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {hasProfile ? 'Portfolio holati' : 'Portfolio yaratishni boshlang'}
                  </Typography.Title>
                  <Typography.Text type="secondary">{nextStep}</Typography.Text>
                </div>
              </Space>

              <Progress percent={completion} status={completion >= 70 ? 'success' : 'active'} />

              <Space wrap>
                <Button type="primary" icon={<UserOutlined />} onClick={() => navigate(routes.dashboardProfile)}>
                  Profilni tahrirlash
                </Button>
                <Button icon={<LayoutOutlined />} onClick={() => navigate(routes.dashboardTemplates)}>
                  Shablon tanlash
                </Button>
                <Button icon={<FilePdfOutlined />} onClick={() => navigate(routes.dashboardPdf)}>
                  PDF
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="dashboard-card" style={{ height: '100%' }}>
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <div>
              <Typography.Title level={4}>Public link</Typography.Title>
              {portfolioUrl ? (
                <>
                  <Typography.Paragraph type="secondary">
                    Sahifangiz tayyor. Linkni ulashishingiz mumkin.
                  </Typography.Paragraph>
                  <Typography.Text copyable>{portfolioUrl}</Typography.Text>
                </>
              ) : (
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Link profil saqlangandan keyin chiqadi.
                </Typography.Paragraph>
              )}
              </div>
              {portfolioUrl ? (
                <Button icon={<ExportOutlined />} href={portfolioUrl} target="_blank" rel="noreferrer" block>
                  Ochish
                </Button>
              ) : (
                <Button
                  icon={<LinkOutlined />}
                  loading={isProfileLoading}
                  onClick={() => navigate(routes.dashboardProfile)}
                  block
                >
                  Link olish
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {[
          ['Profil', hasProfile, "Asosiy ma'lumotlar va bio"],
          ['Shablon', Boolean(profile?.templateSlug), "Public ko'rinish tanlangan"],
          ['Kontent', completion >= 70, "Skill, loyiha va havolalar"],
        ].map(([title, done, text]) => (
          <Col xs={24} md={8} key={title}>
            <Card className="dashboard-card">
              <Space align="start" size={12}>
                <CheckCircleOutlined style={{ color: done ? '#16A34A' : '#94A3B8', fontSize: 22 }} />
                <div>
                  <Typography.Title level={4} style={{ marginTop: 0 }}>{title}</Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>{text}</Typography.Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  );
}
