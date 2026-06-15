"use client";

import {
  Alert,
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  EyeOutlined,
  GlobalOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAnalyticsSummary } from '@procraft/hooks';

function read(data, camelKey, pascalKey, fallback) {
  return data?.[camelKey] ?? data?.[pascalKey] ?? fallback;
}

function normalizeUnknown(value, t) {
  return !value || value === 'Unknown' ? t('analytics.unknown') : value;
}

function translateTime(value, t) {
  return String(value || '')
    .replace('minutes ago', t('analytics.minutesAgo'))
    .replace('minute ago', t('analytics.minutesAgo'));
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useAnalyticsSummary();

  if (isLoading) {
    return <Spin />;
  }

  if (isError) {
    return (
      <Alert
        type="error"
        message={t('analytics.loadError')}
        description={error?.response?.data?.message || t('errors.generic')}
      />
    );
  }

  const totalViews = read(data, 'totalViews', 'TotalViews', 0);
  const last30DaysViews = read(data, 'last30DaysViews', 'Last30DaysViews', 0);
  const topCountries = read(data, 'topCountries', 'TopCountries', []);
  const viewsByDate = read(data, 'viewsByDate', 'ViewsByDate', []);
  const recentVisitors = read(data, 'recentVisitors', 'RecentVisitors', []);
  const maxDailyViews = Math.max(...viewsByDate.map((item) => read(item, 'count', 'Count', 0)), 1);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>{t('analytics.title')}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {t('analytics.subtitle')}
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="dashboard-card">
            <Statistic
              title={t('analytics.totalViews')}
              value={totalViews}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="dashboard-card">
            <Statistic
              title={t('analytics.last30Days')}
              value={last30DaysViews}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="dashboard-card">
            <Statistic
              title={t('analytics.countries')}
              value={topCountries.length}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          <Card title={t('analytics.viewsByDate')} className="dashboard-card">
            {viewsByDate.length === 0 ? (
              <Empty description={t('analytics.noViews')} />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {viewsByDate.map((item) => {
                  const date = read(item, 'date', 'Date', '');
                  const count = read(item, 'count', 'Count', 0);

                  return (
                    <div key={date}>
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Typography.Text>{date}</Typography.Text>
                        <Typography.Text strong>{count}</Typography.Text>
                      </Space>
                      <Progress
                        percent={Math.round((count / maxDailyViews) * 100)}
                        showInfo={false}
                        strokeColor="#2563EB"
                      />
                    </div>
                  );
                })}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card title={t('analytics.topCountries')} className="dashboard-card">
            {topCountries.length === 0 ? (
              <Empty description={t('analytics.noCountries')} />
            ) : (
              <List
                dataSource={topCountries}
                renderItem={(item) => (
                  <List.Item>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Typography.Text>{normalizeUnknown(read(item, 'country', 'Country', ''), t)}</Typography.Text>
                      <Tag color="blue">{read(item, 'count', 'Count', 0)}</Tag>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card title={t('analytics.recentVisitors')} className="dashboard-card">
            {recentVisitors.length === 0 ? (
              <Empty description={t('analytics.noVisitors')} />
            ) : (
              <List
                dataSource={recentVisitors}
                renderItem={(item) => {
                  const city = normalizeUnknown(read(item, 'city', 'City', ''), t);
                  const country = normalizeUnknown(read(item, 'country', 'Country', ''), t);

                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<TeamOutlined style={{ color: '#2563EB', fontSize: 18 }} />}
                        title={`${city}, ${country}`}
                        description={translateTime(read(item, 'time', 'Time', ''), t)}
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
