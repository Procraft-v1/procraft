"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  LinkOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { routes } from '@procraft/config';
import { useAuth, useProfile } from '@procraft/hooks';
import { getErrorFieldMessages, getErrorMessage } from '@procraft/i18n';

function read(user, camelKey, pascalKey, fallback = '') {
  return user?.[camelKey] ?? user?.[pascalKey] ?? fallback;
}

function getPortfolioUrl(user) {
  const username = read(user, 'username', 'Username').trim();
  return username ? `https://${username}.procraft.uz/` : '';
}

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, deleteAccount, updateAccount } = useAuth();
  const [accountForm] = Form.useForm();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const { profile, isLoading: isProfileLoading } = useProfile({ enabled: isAuthenticated });
  const email = read(user, 'email', 'Email', '');
  const username = read(user, 'username', 'Username', '-');
  const phoneNumber = read(user, 'phoneNumber', 'PhoneNumber', '');
  const isEmailConfirmed = Boolean(read(user, 'isEmailConfirmed', 'IsEmailConfirmed', false));
  const portfolioUrl = profile ? getPortfolioUrl(user) : '';
  const deleteConfirmationText = useMemo(
    () => t('settings.danger.confirmText', { username }),
    [t, username],
  );

  const openDeletePrompt = () => {
    Modal.confirm({
      title: t('settings.danger.modalTitle'),
      icon: <ExclamationCircleOutlined />,
      content: t('settings.danger.desc'),
      okText: t('settings.danger.proceed'),
      cancelText: t('settings.danger.cancel'),
      okButtonProps: { danger: true },
      onOk: () => {
        setDeleteConfirmText('');
        setIsDeleteModalOpen(true);
      },
    });
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    accountForm.setFieldsValue({
      email,
      username,
      phoneNumber,
    });
  }, [accountForm, email, phoneNumber, user, username]);

  const handleAccountSave = async (values) => {
    setIsSavingAccount(true);

    try {
      await updateAccount({
        email: values.email,
        username: values.username,
        phoneNumber: values.phoneNumber || null,
      });
      message.success(t('settings.account.saved'));
    } catch (error) {
      const fieldMessages = getErrorFieldMessages(error);
      if (fieldMessages.length > 0) {
        accountForm.setFields(fieldMessages);
      } else {
        message.error(getErrorMessage(error));
      }
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== deleteConfirmationText) {
      message.error(t('settings.danger.wrongConfirm'));
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      message.success(t('settings.danger.deleted'));
      router.replace(routes.login);
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
        message={t('settings.account.notFound')}
        description={t('settings.account.notFoundDesc')}
      />
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>{t('settings.title')}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {t('settings.subtitle')}
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            className="dashboard-card"
            title={(
              <Space>
                <UserOutlined />
                <span>{t('settings.account.title')}</span>
              </Space>
            )}
          >
            <Form
              form={accountForm}
              layout="vertical"
              requiredMark={false}
              onFinish={handleAccountSave}
            >
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('settings.account.email')}
                    name="email"
                    rules={[
                      { type: 'email', message: t('settings.account.emailRequired') },
                    ]}
                  >
                    <Input autoComplete="email" placeholder="email@example.com" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('settings.account.username')}
                    name="username"
                    rules={[
                      { required: true, message: t('settings.account.usernameRequired') },
                      { min: 3, max: 30, message: t('settings.account.usernameLength') },
                      {
                        pattern: /^[a-z0-9_-]+$/,
                        message: t('settings.account.usernameFormat'),
                      },
                    ]}
                  >
                    <Input autoComplete="username" spellCheck={false} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('settings.account.phone')}
                    name="phoneNumber"
                    rules={[
                      {
                        pattern: /^\+?[0-9\s().-]{7,32}$/,
                        message: t('settings.account.phoneFormat'),
                      },
                    ]}
                  >
                    <Input autoComplete="tel" inputMode="tel" placeholder="+998 90 123 45 67" />
                  </Form.Item>
                </Col>
              </Row>

              <Space wrap>
                <Button type="primary" htmlType="submit" loading={isSavingAccount}>
                  {t('settings.account.save')}
                </Button>
                {isEmailConfirmed && <Tag color="green">{t('settings.account.emailConfirmed')}</Tag>}
              </Space>
            </Form>

            <Descriptions column={1} colon={false} style={{ marginTop: 22 }}>
              <Descriptions.Item label={t('settings.account.portfolioLink')}>
                {portfolioUrl ? (
                  <Typography.Text copyable>{portfolioUrl}</Typography.Text>
                ) : (
                  <Typography.Text type="secondary">{t('settings.account.portfolioLinkNotReady')}</Typography.Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            {portfolioUrl ? (
              <Button icon={<ExportOutlined />} href={portfolioUrl} target="_blank" rel="noopener noreferrer">
                {t('settings.account.openPortfolio')}
              </Button>
            ) : (
              <Button icon={<LinkOutlined />} loading={isProfileLoading} onClick={() => router.push(routes.dashboardProfile)}>
                {t('settings.account.fillProfile')}
              </Button>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            className="dashboard-card"
            title={(
              <Space>
                <QuestionCircleOutlined />
                <span>{t('settings.help.title')}</span>
              </Space>
            )}
          >
            <Space direction="vertical" size={14}>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t('settings.help.desc')}
              </Typography.Paragraph>
              <Button
                icon={<ExportOutlined />}
                href="https://t.me/procraftuz"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('settings.help.telegram')}
              </Button>
            </Space>
          </Card>

          <Card
            className="dashboard-card settings-danger-card"
            style={{ marginTop: 16 }}
            title={(
              <Space>
                <DeleteOutlined />
                <span>{t('settings.danger.title')}</span>
              </Space>
            )}
          >
            <Space direction="vertical" size={14}>
              <Typography.Paragraph type="secondary">
                {t('settings.danger.desc')}
              </Typography.Paragraph>
              <Button danger icon={<DeleteOutlined />} onClick={openDeletePrompt}>
                {t('settings.danger.button')}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title={t('settings.danger.modalTitle')}
        open={isDeleteModalOpen}
        okText={t('settings.danger.delete')}
        cancelText={t('settings.danger.cancel')}
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
            message={t('settings.danger.warning')}
            description={t('settings.danger.warningDesc')}
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
