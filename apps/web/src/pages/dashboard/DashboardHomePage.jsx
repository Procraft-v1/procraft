import { Card, Col, Row, Typography } from 'antd';

const cards = [
  ['Profil', "Ommaviy profilingizni doim tayyor va yangilangan holda saqlang."],
  ['Shablonlar', 'Minimal, Modern va Classic ko\'rinishlar orasidan tanlang.'],
  ['Nashr qilish', "Ommaviy profil tanlangan shablon asosida ko'rinadi."],
];

export default function DashboardHomePage() {
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
    </section>
  );
}
