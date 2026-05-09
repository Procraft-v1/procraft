import { Button, Card, Col, Row, Typography } from 'antd';
import { ExportOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { routes } from '@procraft/config';
import { useAuth, useProfile } from '@procraft/hooks';

const cards = [
  ['Profil', "Ommaviy profilingizni doim tayyor va yangilangan holda saqlang."],
  ['Shablonlar', 'Minimal, Modern va Classic ko\'rinishlar orasidan tanlang.'],
  ['Nashr qilish', "Ommaviy profil tanlangan shablon asosida ko'rinadi."],
];

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const portfolioUrl = profile && user?.username ? `https://${user.username}.procraft.uz/` : '';

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>Procraft ish maydoningiz</Typography.Title>
        <Typography.Paragraph type="secondary">
          Profil ma'lumotlarini tahrirlang, shablon tanlang va ommaviy sahifangizni bir joydan boshqaring.
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {cards.map(([title, text]) => (
          <Col xs={24} md={8} key={title}>
            <Card className="dashboard-card">
              <Typography.Title level={4}>{title}</Typography.Title>
              <Typography.Paragraph type="secondary">{text}</Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="dashboard-card dashboard-public-link-card">
        <div>
          <Typography.Title level={4}>Portfolio linkingiz</Typography.Title>
          {portfolioUrl ? (
            <>
              <Typography.Paragraph type="secondary">
                Public portfolio sahifangiz shu manzilda ochiladi.
              </Typography.Paragraph>
              <Typography.Text copyable>{portfolioUrl}</Typography.Text>
            </>
          ) : (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Public link profil yaratilgandan keyin chiqadi.
            </Typography.Paragraph>
          )}
        </div>
        {portfolioUrl ? (
          <Button icon={<ExportOutlined />} href={portfolioUrl} target="_blank" rel="noreferrer">
            Ochish
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
    </section>
  );
}
