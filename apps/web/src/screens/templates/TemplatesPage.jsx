"use client";

import { Button, Card, Col, Image, Row, Space, Spin, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth, useProfile, useSelectTemplate, useTemplates } from '@procraft/hooks';
import { getErrorMessage } from '@procraft/i18n';

const TEMPLATE_COPY_KEYS = {
  minimal: 'templates.minimal',
  modern: 'templates.modern',
  classic: 'templates.classic',
  editorial: 'templates.editorial',
  developer: 'templates.developer',
};

// Bump ?v= when a template thumbnail image is regenerated so browsers and the
// CDN fetch the fresh file instead of a cached copy at the same URL.
const TEMPLATE_PREVIEW_VERSION = '2';

function getTemplatePreviewUrl(template) {
  const base = template.previewUrl || `/templates/${template.slug}.jpg`;
  return `${base}?v=${TEMPLATE_PREVIEW_VERSION}`;
}

export default function TemplatesPage() {
  const { t } = useTranslation();
  const { data: templates = [], isLoading } = useTemplates();
  const { isAuthenticated } = useAuth();
  const { profile, fetchMyProfile } = useProfile({ enabled: isAuthenticated });
  const selectTemplate = useSelectTemplate({
    onSuccess: async () => {
      await fetchMyProfile();
      message.success(t('templates.selectSuccess'));
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
        <Typography.Title level={2}>{t('templates.title')}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {t('templates.subtitle')}
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
                    preview={{ mask: t('templates.preview') }}
                  />
                </div>
                <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Typography.Title level={4} style={{ marginBottom: 0 }}>{template.name}</Typography.Title>
                  {isSelected ? <Tag color="blue" style={{ marginInlineEnd: 0 }}>{t('templates.selected')}</Tag> : null}
                </Space>
                <Typography.Paragraph type="secondary">
                  {TEMPLATE_COPY_KEYS[template.slug] ? t(TEMPLATE_COPY_KEYS[template.slug]) : t('templates.default')}
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
                  {isSelected ? t('templates.selected') : t('templates.select')}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
