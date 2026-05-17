import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  GlobalOutlined,
  LinkOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { routes } from '@procraft/config';
import { useAuth, useProfile } from '@procraft/hooks';
import { getErrorMessage } from '@procraft/i18n';

function read(user, camelKey, pascalKey, fallback = '') {
  return user?.[camelKey] ?? user?.[pascalKey] ?? fallback;
}

function getPortfolioUrl(user) {
  const username = read(user, 'username', 'Username').trim();
  return username ? `https://${username}.procraft.uz/` : '';
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, deleteAccount } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { profile, isLoading: isProfileLoading } = useProfile({ enabled: isAuthenticated });
  const email = read(user, 'email', 'Email', '-');
  const username = read(user, 'username', 'Username', '-');
  const isEmailConfirmed = Boolean(read(user, 'isEmailConfirmed', 'IsEmailConfirmed', false));
  const portfolioUrl = profile ? getPortfolioUrl(user) : '';
  const deleteConfirmationText = useMemo(
    () => `${username} akkauntimni o'chirish`,
    [username],
  );

  const openDeletePrompt = () => {
    Modal.confirm({
      title: "Accountni o'chirishni xohlaysizmi?",
      icon: <ExclamationCircleOutlined />,
      content: "Bu amal account, portfolio va profil ma'lumotlarini o'chiradi.",
      okText: 'Ha, davom etish',
      cancelText: 'Bekor qilish',
      okButtonProps: { danger: true },
      onOk: () => {
        setDeleteConfirmText('');
        setIsDeleteModalOpen(true);
      },
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== deleteConfirmationText) {
      message.error("Tasdiqlash matni to'g'ri yozilmadi");
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      message.success("Account o'chirildi");
      navigate(routes.login, { replace: true });
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!user) {
    return (
      <Alert
        type="warning"
        message="Account topilmadi"
        description="Sozlamalarni ko'rish uchun qayta login qiling."
      />
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>Sozlamalar</Typography.Title>
        <Typography.Paragraph type="secondary">
          Account va public link ma'lumotlari.
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            className="dashboard-card"
            title={(
              <Space>
                <UserOutlined />
                <span>Account</span>
              </Space>
            )}
          >
            <Descriptions column={1} colon={false}>
              <Descriptions.Item label="Email">
                <Space wrap>
                  <Typography.Text copyable>{email}</Typography.Text>
                  {isEmailConfirmed && (
                    <Tag color="green">Tasdiqlangan</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Username">
                <Typography.Text copyable>{username}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Portfolio link">
                {portfolioUrl ? (
                  <Typography.Text copyable>{portfolioUrl}</Typography.Text>
                ) : (
                  <Typography.Text type="secondary">Profil yaratilgandan keyin chiqadi</Typography.Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {portfolioUrl ? (
              <Button
                icon={<ExportOutlined />}
                href={portfolioUrl}
                target="_blank"
                rel="noreferrer"
              >
                Portfolio ochish
              </Button>
            ) : (
              <Button
                icon={<LinkOutlined />}
                loading={isProfileLoading}
                onClick={() => navigate(routes.dashboardProfile)}
              >
                Profilni to'ldirish
              </Button>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            className="dashboard-card"
            title={(
              <Space>
                <GlobalOutlined />
                <span>Interfeys</span>
                <Tag>V2</Tag>
              </Space>
            )}
          >
            <Select
              disabled
              value="uz"
              style={{ width: '100%' }}
              options={[
                { value: 'uz', label: "O'zbekcha" },
                { value: 'ru', label: 'Русский' },
                { value: 'en', label: 'English' },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            className="dashboard-card settings-danger-card"
            title={(
              <Space>
                <DeleteOutlined />
                <span>Accountni o'chirish</span>
              </Space>
            )}
          >
            <Space direction="vertical" size={14}>
              <Typography.Paragraph type="secondary">
                Account o'chirilsa, login sessiyasi tugaydi va profil ma'lumotlari qayta tiklanmaydi.
              </Typography.Paragraph>
              <Button danger icon={<DeleteOutlined />} onClick={openDeletePrompt}>
                Accountni o'chirish
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Accountni o'chirishni tasdiqlang"
        open={isDeleteModalOpen}
        okText="O'chirish"
        cancelText="Bekor qilish"
        okButtonProps={{
          danger: true,
          disabled: deleteConfirmText.trim() !== deleteConfirmationText,
          loading: isDeletingAccount,
        }}
        confirmLoading={isDeletingAccount}
        onOk={handleDeleteAccount}
        onCancel={() => {
          if (!isDeletingAccount) {
            setIsDeleteModalOpen(false);
          }
        }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message="Bu amalni ortga qaytarib bo'lmaydi"
            description="Davom etish uchun pastdagi matnni aynan yozing."
          />
          <Typography.Text code>{deleteConfirmationText}</Typography.Text>
          <Input
            autoFocus
            value={deleteConfirmText}
            placeholder={deleteConfirmationText}
            disabled={isDeletingAccount}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
          />
        </Space>
      </Modal>
    </section>
  );
}
