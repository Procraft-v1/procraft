"use client";

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
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile({ enabled: isAuthenticated });
  const portfolioUrl = profile && user?.username ? `https://${user.username}.procraft.uz/` : '';
  const completion = getCompletion(profile);
  const hasProfile = Boolean(profile);
  const nextStep = !hasProfile
    ? t('dashboard.nextStep.fillProfile')
    : completion < 70
      ? t('dashboard.nextStep.fillContent')
      : t('dashboard.nextStep.share');

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Space size={10} wrap>
          <Typography.Title level={2} style={{ margin: 0 }}>{t('dashboard.title')}</Typography.Title>
          <Tag color={hasProfile ? 'green' : 'blue'}>
            {hasProfile ? t('dashboard.profileCreated') : t('dashboard.readyToStart')}
          </Tag>
        </Space>
        <Typography.Paragraph type="secondary">
          {t('dashboard.subtitle')}
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
                    {hasProfile ? t('dashboard.portfolio.titleCreated') : t('dashboard.portfolio.titleStart')}
                  </Typography.Title>
                  <Typography.Text type="secondary">{nextStep}</Typography.Text>
                </div>
              </Space>

              <Progress percent={completion} status={completion >= 70 ? 'success' : 'active'} />

              <Space wrap>
                <Button type="primary" icon={<UserOutlined />} onClick={() => router.push(routes.dashboardProfile)}>
                  {t('dashboard.editProfile')}
                </Button>
                <Button icon={<LayoutOutlined />} onClick={() => router.push(routes.dashboardTemplates)}>
                  {t('dashboard.selectTemplate')}
                </Button>
                <Button icon={<FilePdfOutlined />} onClick={() => router.push(routes.dashboardPdf)}>
                  {t('sidebar.pdf')}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="dashboard-card" style={{ height: '100%' }}>
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <div>
              <Typography.Title level={4}>{t('dashboard.publicLink.title')}</Typography.Title>
              {portfolioUrl ? (
                <>
                  <Typography.Paragraph type="secondary">
                    {t('dashboard.publicLink.ready')}
                  </Typography.Paragraph>
                  <Typography.Text copyable>{portfolioUrl}</Typography.Text>
                </>
              ) : (
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {t('dashboard.publicLink.notReady')}
                </Typography.Paragraph>
              )}
              </div>
              {portfolioUrl ? (
                <Button icon={<ExportOutlined />} href={portfolioUrl} target="_blank" rel="noopener noreferrer" block>
                  {t('dashboard.publicLink.open')}
                </Button>
              ) : (
                <Button
                  icon={<LinkOutlined />}
                  loading={isProfileLoading}
                  onClick={() => router.push(routes.dashboardProfile)}
                  block
                >
                  {t('dashboard.publicLink.getLink')}
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {[
          ['profile', hasProfile, t('dashboard.checks.profile'), t('dashboard.checks.profileDesc')],
          ['template', Boolean(profile?.templateSlug), t('dashboard.checks.template'), t('dashboard.checks.templateDesc')],
          ['content', completion >= 70, t('dashboard.checks.content'), t('dashboard.checks.contentDesc')],
        ].map(([key, done, title, text]) => (
          <Col xs={24} md={8} key={key}>
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
