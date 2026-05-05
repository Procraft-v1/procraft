import { Button, Card, Space, Typography, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import { useDownloadResume } from '@procraft/hooks';

export default function PdfPage() {
  const downloadResume = useDownloadResume({
    onSuccess: () => {
      message.success('PDF download started');
    },
    onError: () => {
      message.error('Could not download PDF');
    },
  });

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>PDF export</Typography.Title>
        <Typography.Paragraph type="secondary">
          Download an ATS-friendly resume generated from your Procraft profile.
        </Typography.Paragraph>
      </div>

      <Card className="dashboard-form-card">
        <Space direction="vertical" size={18}>
          <FilePdfOutlined style={{ color: '#2563EB', fontSize: 34 }} />
          <div>
            <Typography.Title level={4}>Resume PDF</Typography.Title>
            <Typography.Paragraph type="secondary" style={{ maxWidth: 560 }}>
              Your profile details, experience, education, skills, projects, and certificates are compiled into a clean PDF.
            </Typography.Paragraph>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<FilePdfOutlined />}
            loading={downloadResume.isPending}
            onClick={() => downloadResume.mutate()}
          >
            Download PDF
          </Button>
        </Space>
      </Card>
    </section>
  );
}
