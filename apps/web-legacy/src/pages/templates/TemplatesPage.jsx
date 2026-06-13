import { Button, Card, Col, Image, Row, Space, Spin, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useAuth, useProfile, useSelectTemplate, useTemplates } from '@procraft/hooks';
import { getErrorMessage } from '@procraft/i18n';

const templateCopy = {
  minimal: "Oddiy, oq va o'qilishi qulay resume ko'rinishi.",
  modern: "Moviy va cyan urg'ular bilan zamonaviy kartali ko'rinish.",
  classic: "Rasmiy, markazlangan va klassik professional ko'rinish.",
  editorial: "Katta tipografiya va jurnal uslubidagi premium portfolio.",
  developer: "Dark terminal, code editor va dashboard uslubidagi developer portfolio.",
};

function getTemplatePreviewUrl(template) {
  return template.previewUrl || `/templates/${template.slug}.jpg`;
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const { isAuthenticated } = useAuth();
  const { profile, fetchMyProfile } = useProfile({ enabled: isAuthenticated });
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
              <Card className={`template-card template-card--${template.slug}`}>
                <div className="template-card__preview">
                  <Image
                    src={getTemplatePreviewUrl(template)}
                    alt={`${template.name} preview`}
                    preview={{ mask: "Kattaroq ko'rish" }}
                  />
                </div>
                <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Typography.Title level={4} style={{ marginBottom: 0 }}>{template.name}</Typography.Title>
                  {isSelected ? <Tag color="blue" style={{ marginInlineEnd: 0 }}>Tanlangan</Tag> : null}
                </Space>
                <Typography.Paragraph type="secondary">
                  {templateCopy[template.slug] || "Toza ommaviy profil shabloni."}
                </Typography.Paragraph>
                <Button
                  type={isSelected ? 'default' : 'primary'}
                  className={isSelected ? 'template-card__selected-button' : undefined}
                  disabled={isSelected}
                  icon={isSelected ? <CheckCircleOutlined /> : null}
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
