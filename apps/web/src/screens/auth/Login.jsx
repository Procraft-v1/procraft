"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, Spin } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@procraft/hooks";
import { getErrorMessage } from "@procraft/i18n";
import { Logo } from "@procraft/ui";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getReturnTo = () => {
    const value = searchParams.get("returnTo");
    return value && value.startsWith("/") && !value.includes("[object Object]") && !value.startsWith("/login")
      ? value
      : "/";
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getReturnTo());
    }
  }, [isAuthenticated, isLoading]);

  async function handleFinish(values) {
    setError("");
    setIsSubmitting(true);
    try {
      await login(values);
      router.replace(getReturnTo());
    } catch (err) {
      setError(getErrorMessage(err));
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
            Xush kelibsiz
          </Typography.Title>
          <Typography.Text type="secondary">
            Procraft hisobingizga kiring.
          </Typography.Text>
        </div>

        <Form layout="vertical" requiredMark={false} onFinish={handleFinish}>
          <Form.Item
            label="Elektron pochta yoki foydalanuvchi nomi"
            name="emailOrUsername"
            rules={[
              { required: true, message: "Elektron pochta yoki foydalanuvchi nomini kiriting." },
            ]}
          >
            <Input autoComplete="username" size="large" />
          </Form.Item>

          <Form.Item
            label="Parol"
            name="password"
            rules={[{ required: true, message: "Parolni kiriting." }]}
          >
            <Input.Password autoComplete="current-password" size="large" />
          </Form.Item>

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
            Kirish
          </Button>
        </Form>

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          <Link href="/reset-password">Parolni unutdingizmi?</Link>
        </Typography.Text>

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          Procraftda yangimisiz? <Link href="/register">Ro'yxatdan o'ting</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
