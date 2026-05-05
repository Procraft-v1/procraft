import { Button, Card, Col, Row, Spin, Tag, Typography, message } from 'antd';
import { useProfile, useSelectTemplate, useTemplates } from '@procraft/hooks';

const templateCopy = {
  minimal: 'Clean white resume style for direct, readable profiles.',
  modern: 'Structured cards with blue and cyan accents for a sharper digital look.',
  classic: 'Formal centered presentation with a traditional professional tone.',
};

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const { profile, fetchMyProfile } = useProfile();
  const selectTemplate = useSelectTemplate({
    onSuccess: async () => {
      await fetchMyProfile();
      message.success('Template selected');
    },
  });

  if (isLoading) {
    return <Spin />;
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>Templates</Typography.Title>
        <Typography.Paragraph type="secondary">
          Select how your public profile should be presented. Content stays reusable across every design.
        </Typography.Paragraph>
      </div>

      <Row gutter={[18, 18]}>
        {templates.map((template) => {
          const isSelected =
            profile?.templateId === template.id || profile?.templateSlug === template.slug;

          return (
            <Col key={template.id} xs={24} md={12} xl={8}>
              <Card
                className={`template-card template-card--${template.slug}`}
                extra={isSelected ? <Tag color="blue">Selected</Tag> : null}
              >
                <div className="template-card__preview">
                  <span />
                  <strong>{template.name}</strong>
                  <i />
                  <i />
                </div>
                <Typography.Title level={4}>{template.name}</Typography.Title>
                <Typography.Paragraph type="secondary">
                  {templateCopy[template.slug] || 'A clean public profile template.'}
                </Typography.Paragraph>
                <Button
                  type={isSelected ? 'default' : 'primary'}
                  disabled={isSelected}
                  loading={selectTemplate.isPending}
                  onClick={() => selectTemplate.mutate(template.id)}
                  block
                >
                  {isSelected ? 'Selected' : 'Select template'}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
