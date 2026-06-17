"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, Spin } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@procraft/hooks";
import { getErrorFieldMessages, getErrorMessage } from "@procraft/i18n";
import { Logo } from "@procraft/ui";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { register, verifyRegister, isAuthenticated, isLoading } = useAuth();
  const [form] = Form.useForm();

  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getReturnTo = () => {
    const value = searchParams.get("returnTo");
    return value && value.startsWith("/") && !value.includes("[object Object]") && !value.startsWith("/register")
      ? value
      : "/";
  };

  useEffect(() => {
    if (!challenge && !isLoading && isAuthenticated) {
      router.replace(getReturnTo());
    }
  }, [challenge, isAuthenticated, isLoading, router, searchParams]);

  async function handleFinish(values) {
    setError("");
    setIsSubmitting(true);
    try {
      if (!challenge) {
        const nextChallenge = await register(values);
        if (!nextChallenge?.verificationId) {
          setError(t("auth.register.codeNotReceived"));
          return;
        }

        setChallenge(nextChallenge);
        form.resetFields(["code"]);
        return;
      }

      await verifyRegister({
        verificationId: challenge.verificationId,
        code: values.code,
      });
      router.replace(getReturnTo());
    } catch (err) {
      const fieldMessages = getErrorFieldMessages(err);

      if (fieldMessages.length > 0) {
        form.setFields(fieldMessages);
        setError("");
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
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
            {t("auth.register.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {challenge
              ? challenge.telegramLink
                ? t("auth.register.subtitleTelegramCode")
                : t("auth.register.subtitleEmailCode", { email: challenge.maskedEmail })
              : t("auth.register.subtitle")}
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
            <>
              <Form.Item
                label={t("auth.register.fullName")}
                name="fullname"
                rules={[{ required: true, message: t("auth.register.fullNameRequired") }]}
              >
                <Input autoComplete="name" size="large" />
              </Form.Item>

              <Form.Item
                label={t("auth.register.username")}
                name="username"
                rules={[
                  { required: true, message: t("auth.register.usernameRequired") },
                  { min: 3, max: 30, message: t("auth.register.usernameLength") },
                  {
                    pattern: /^[a-z0-9_-]+$/,
                    message: t("auth.register.usernameFormat"),
                  },
                ]}
              >
                <Input autoComplete="off" spellCheck={false} size="large" />
              </Form.Item>

              <Form.Item
                label={t("auth.register.phone")}
                name="phoneNumber"
                rules={[
                  {
                    pattern: /^\+?[0-9\s().-]{7,32}$/,
                    message: t("auth.register.phoneFormat"),
                  },
                ]}
              >
                <Input autoComplete="tel" inputMode="tel" size="large" placeholder="+998 90 123 45 67" />
              </Form.Item>

              <Form.Item
                label={t("auth.register.password")}
                name="password"
                rules={[
                  { required: true, message: t("auth.register.passwordRequired") },
                  { min: 8, message: t("auth.register.passwordLength") },
                ]}
              >
                <Input.Password autoComplete="new-password" size="large" />
              </Form.Item>
            </>
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
                    {t("auth.register.telegramCodeButton")}
                  </Button>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {t("auth.register.telegramBotHint")}
                  </Typography.Text>
                </div>
              ) : null}
              <Form.Item
                label={t("auth.register.verifyCode")}
                name="code"
                rules={[
                  { required: true, message: t("auth.register.codeRequired") },
                  { pattern: /^\d{4}$/, message: t("auth.register.codeLength") },
                ]}
              >
                <Input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={4}
                  size="large"
                />
              </Form.Item>
            </>
          )}

          {error ? (
            <Typography.Paragraph type="danger" style={{ marginTop: -4 }}>
              {error}
            </Typography.Paragraph>
          ) : null}

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
          >
            {challenge ? t("auth.register.verifySubmit") : t("auth.register.sendCode")}
          </Button>

          {challenge ? (
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
              {t("auth.register.changeEmail")}
            </Button>
          ) : null}
        </Form>

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          {t("auth.register.hasAccount")} <Link href="/login">{t("auth.register.loginLink")}</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
