import { Button, Card, Col, Row, Spin, Tag, Typography, message } from 'antd';
import { useProfile, useSelectTemplate, useTemplates } from '@procraft/hooks';

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
    <section>
      <Typography.Title level={3}>Templates</Typography.Title>
      <Row gutter={[16, 16]}>
        {templates.map((template) => {
          const isSelected =
            profile?.templateId === template.id || profile?.templateSlug === template.slug;

          return (
            <Col key={template.id} xs={24} md={8}>
              <Card
                title={template.name}
                extra={isSelected ? <Tag color="blue">Selected</Tag> : null}
                cover={
                  <div
                    style={{
                      height: 140,
                      background: 'linear-gradient(135deg, #F6F7F9 0%, #E5E7EB 100%)',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  />
                }
              >
                <Typography.Paragraph type="secondary">
                  {template.slug === 'minimal'
                    ? 'Clean white resume style.'
                    : template.slug === 'modern'
                      ? 'Card-based blue and cyan accents.'
                      : 'Formal centered layout.'}
                </Typography.Paragraph>
                <Button
                  type={isSelected ? 'default' : 'primary'}
                  disabled={isSelected}
                  loading={selectTemplate.isPending}
                  onClick={() => selectTemplate.mutate(template.id)}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
