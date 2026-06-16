"use client";

import { Button, Card, Modal, Space, Typography, message } from 'antd';
import { DownloadOutlined, EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { buildResumeFileName, useAuth, useDownloadResume, useProfile, usePreviewResume } from '@procraft/hooks';
import { getErrorMessage } from '@procraft/i18n';

export default function PdfPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { profile } = useProfile({ enabled: isAuthenticated });
  const fileName = buildResumeFileName(
    profile?.fullName || user?.fullName || user?.username,
  );
  const downloadResume = useDownloadResume({
    fileName,
    onSuccess: () => {
      message.success(t('pdf.downloadStart'));
    },
    onError: (error) => {
      message.error(getErrorMessage(error));
    },
  });
  const previewResume = usePreviewResume({
    onError: (error) => {
      message.error(getErrorMessage(error));
    },
  });

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>{t('pdf.title')}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {t('pdf.subtitle')}
        </Typography.Paragraph>
      </div>

      <Card className="dashboard-form-card">
        <Space direction="vertical" size={18}>
          <FilePdfOutlined style={{ color: '#2563EB', fontSize: 34 }} />
          <div>
            <Typography.Title level={4}>{t('pdf.resumeTitle')}</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ maxWidth: 560 }}>
              {t('pdf.resumeDesc')}
            </Typography.Paragraph>
          </div>
          <Space wrap>
            <Button
              type="primary"
              size="large"
              icon={<EyeOutlined />}
              loading={previewResume.isPending}
              onClick={() => previewResume.mutate()}
            >
              {t('pdf.preview')}
            </Button>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              loading={downloadResume.isPending}
              onClick={() => downloadResume.mutate()}
            >
              {t('pdf.download')}
            </Button>
          </Space>
        </Space>
      </Card>

      <Modal
        open={Boolean(previewResume.previewUrl)}
        title={t('pdf.resumeTitle')}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} loading={downloadResume.isPending} onClick={() => downloadResume.mutate()}>
            {t('pdf.downloadButton')}
          </Button>,
          <Button key="close" type="primary" onClick={previewResume.closePreview}>
            {t('pdf.close')}
          </Button>,
        ]}
        width="min(1040px, calc(100vw - 32px))"
        centered
        destroyOnHidden
        onCancel={previewResume.closePreview}
        styles={{
          body: {
            height: 'min(78vh, 860px)',
            padding: 0,
            background: '#111827',
          },
          content: {
            overflow: 'hidden',
          },
        }}
      >
        {previewResume.previewUrl ? (
          <iframe
            title="Resume PDF preview"
            src={`${previewResume.previewUrl}#toolbar=0&navpanes=0&view=FitH`}
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              background: '#111827',
            }}
          />
        ) : null}
      </Modal>
    </section>
  );
}
