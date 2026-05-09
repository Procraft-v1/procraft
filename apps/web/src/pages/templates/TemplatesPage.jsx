import { Button, Card, Col, Row, Spin, Tag, Typography, message } from 'antd';
import { useProfile, useSelectTemplate, useTemplates } from '@procraft/hooks';
import { getErrorMessage } from '@procraft/i18n';

const templateCopy = {
  minimal: "Oddiy, oq va o'qilishi qulay resume ko'rinishi.",
  modern: "Moviy va cyan urg'ular bilan zamonaviy kartali ko'rinish.",
  classic: "Rasmiy, markazlangan va klassik professional ko'rinish.",
};

function getTemplatePreviewUrl(template) {
  return template.previewUrl || `/templates/${template.slug}.jpg`;
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const { profile, fetchMyProfile } = useProfile();
  const selectTemplate = useSelectTemplate({
    onSuccess: async () => {
      await fetchMyProfile();
      message.success('Shablon tanlandi');
    },
    onError: (error) => {
      message.error(getErrorMessage(error));
    },
  });

  if (isLoading) {
    return <Spin />;
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>Shablonlar</Typography.Title>
        <Typography.Paragraph type="secondary">
          Ommaviy profilingiz qanday ko'rinishda chiqishini tanlang.
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
                extra={isSelected ? <Tag color="blue">Tanlangan</Tag> : null}
              >
                <div className="template-card__preview">
                  <img src={getTemplatePreviewUrl(template)} alt={`${template.name} preview`} />
                </div>
                <Typography.Title level={4}>{template.name}</Typography.Title>
                <Typography.Paragraph type="secondary">
                  {templateCopy[template.slug] || "Toza ommaviy profil shabloni."}
                </Typography.Paragraph>
                <Button
                  type={isSelected ? 'default' : 'primary'}
                  disabled={isSelected}
                  loading={selectTemplate.isPending}
                  onClick={() => selectTemplate.mutate(template.id)}
                  block
                >
                  {isSelected ? 'Tanlangan' : 'Shablonni tanlash'}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
