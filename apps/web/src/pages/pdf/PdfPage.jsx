import { Button, Card, Modal, Space, Typography, message } from 'antd';
import { DownloadOutlined, EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useDownloadResume, usePreviewResume } from '@procraft/hooks';
import { getErrorMessage } from '@procraft/i18n';

export default function PdfPage() {
  const downloadResume = useDownloadResume({
    onSuccess: () => {
      message.success('PDF yuklab olish boshlandi');
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
        <Typography.Title level={2}>PDF eksport</Typography.Title>
        <Typography.Paragraph type="secondary">
          Procraft profilingiz asosida ATS uchun qulay resume PDF yuklab oling.
        </Typography.Paragraph>
      </div>

      <Card className="dashboard-form-card">
        <Space direction="vertical" size={18}>
          <FilePdfOutlined style={{ color: '#2563EB', fontSize: 34 }} />
          <div>
            <Typography.Title level={4}>Resume PDF</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ maxWidth: 560 }}>
              Profil ma'lumotlari, tajriba, ta'lim, ko'nikmalar, loyihalar va sertifikatlar toza PDF faylga jamlanadi.
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
              PDF ko'rish
            </Button>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              loading={downloadResume.isPending}
              onClick={() => downloadResume.mutate()}
            >
              PDF yuklab olish
            </Button>
          </Space>
        </Space>
      </Card>

      <Modal
        open={Boolean(previewResume.previewUrl)}
        title="Resume PDF"
        footer={[
          <Button key="download" icon={<DownloadOutlined />} loading={downloadResume.isPending} onClick={() => downloadResume.mutate()}>
            Yuklab olish
          </Button>,
          <Button key="close" type="primary" onClick={previewResume.closePreview}>
            Yopish
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
