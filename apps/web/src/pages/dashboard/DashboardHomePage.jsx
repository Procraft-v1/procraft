import { Card, Col, Row, Typography } from 'antd';

const cards = [
  ['Profile', 'Keep your public story current and ready to share.'],
  ['Templates', 'Switch between Minimal, Modern, and Classic presentations.'],
  ['Publishing', 'Your public profile app renders from the selected template.'],
];

export default function DashboardHomePage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>Your Procraft workspace</Typography.Title>
        <Typography.Paragraph type="secondary">
          Edit profile details, choose a template, and keep your public presence tidy from one place.
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
