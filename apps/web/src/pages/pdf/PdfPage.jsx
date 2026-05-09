import { Button, Card, Space, Typography, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import { useDownloadResume } from '@procraft/hooks';
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
          <Button
            type="primary"
            size="large"
            icon={<FilePdfOutlined />}
            loading={downloadResume.isPending}
            onClick={() => downloadResume.mutate()}
          >
            PDF yuklab olish
          </Button>
        </Space>
      </Card>
    </section>
  );
}
