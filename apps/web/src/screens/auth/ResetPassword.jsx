"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, Spin } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth, useForgotPassword, useResetPassword } from "@procraft/hooks";
import { getErrorMessage } from "@procraft/i18n";
import { Logo } from "@procraft/ui";

export default function ResetPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();
  const [form] = Form.useForm();

  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleFinish(values) {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (!challenge) {
        const nextChallenge = await forgotPassword.mutateAsync({ email: values.email });
        setChallenge(nextChallenge);
        form.resetFields(["code", "newPassword"]);
        return;
      }

      await resetPassword.mutateAsync({
        resetId: challenge.resetId,
        code: values.code,
        newPassword: values.newPassword,
      });
      setSuccess(t("auth.resetPassword.success"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <Space
        direction="vertical"
        size={24}
        style={{ width: "100%", maxWidth: 380 }}
      >
        <div style={{ textAlign: "center" }}>
          <Logo size={42} />
          <Typography.Title
            level={3}
            style={{ marginTop: 24, marginBottom: 4 }}
          >
            {t("auth.resetPassword.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {challenge
              ? challenge.telegramLink
                ? t("auth.resetPassword.subtitleTelegramCode")
                : t("auth.resetPassword.subtitleEmailCode", { email: challenge.maskedEmail })
              : t("auth.resetPassword.subtitle")}
          </Typography.Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
          onFinish={handleFinish}
        >
          {!challenge ? (
            <Form.Item
              label={t("auth.resetPassword.email")}
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: t("auth.resetPassword.emailRequired"),
                },
              ]}
            >
              <Input autoComplete="email" size="large" />
            </Form.Item>
          ) : (
            <>
              {challenge?.telegramLink ? (
                <div style={{ marginBottom: 16, textAlign: "center" }}>
                  <Button
                    size="large"
                    block
                    href={challenge.telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "#229ED9", borderColor: "#229ED9", color: "#fff", marginBottom: 12 }}
                  >
                    {t("auth.resetPassword.telegramCodeButton")}
                  </Button>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t("auth.resetPassword.telegramBotHint")}
                  </Typography.Text>
                </div>
              ) : null}
              <Form.Item
                label={t("auth.resetPassword.verifyCode")}
                name="code"
                rules={[
                  { required: true, message: t("auth.resetPassword.codeRequired") },
                  { pattern: /^\d{4}$/, message: t("auth.resetPassword.codeLength") },
                ]}
              >
                <Input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={4}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label={t("auth.resetPassword.newPassword")}
                name="newPassword"
                rules={[
                  { required: true, message: t("auth.resetPassword.newPasswordRequired") },
                  { min: 8, message: t("auth.resetPassword.newPasswordLength") },
                ]}
              >
                <Input.Password autoComplete="new-password" size="large" />
              </Form.Item>
            </>
          )}

          {error ? (
            <Typography.Paragraph type="danger" style={{ marginTop: -4 }}>
              {error}
            </Typography.Paragraph>
          ) : null}

          {success ? (
            <Typography.Paragraph type="success" style={{ marginTop: -4 }}>
              {success}
            </Typography.Paragraph>
          ) : null}

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
            disabled={Boolean(success)}
          >
            {challenge ? t("auth.resetPassword.submitUpdate") : t("auth.resetPassword.sendCode")}
          </Button>

          {challenge && !success ? (
            <Button
              type="link"
              block
              onClick={() => {
                setChallenge(null);
                setError("");
                form.resetFields();
              }}
              style={{ marginTop: 8 }}
            >
              {t("auth.resetPassword.changeEmail")}
            </Button>
          ) : null}
        </Form>

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          <Link href="/login">{t("auth.resetPassword.backToLogin")}</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
