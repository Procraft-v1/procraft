"use client";

import { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, Spin } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@procraft/hooks";
import { getErrorFieldMessages, getErrorMessage } from "@procraft/i18n";
import { Logo } from "@procraft/ui";

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
          setError("Ro'yxatdan o'tish kodi olinmadi. Backendni yangilab qayta urinib ko'ring.");
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
            Ro'yxatdan o'tish
          </Typography.Title>
          <Typography.Text type="secondary">
            {challenge
              ? challenge.telegramLink
                ? "Telegram botdan tasdiqlash kodini oling va kiriting."
                : `${challenge.maskedEmail} manziliga yuborilgan kodni kiriting.`
              : "Procraft ish maydoningizni yarating."}
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
                label="Elektron pochta"
                name="email"
                rules={[
                  {
                    required: true,
                    type: "email",
                    message: "To'g'ri elektron pochta manzilini kiriting.",
                  },
                ]}
              >
                <Input autoComplete="email" size="large" />
              </Form.Item>

              <Form.Item
                label="To'liq ism"
                name="fullname"
                rules={[{ required: true, message: "To'liq ismingizni kiriting." }]}
              >
                <Input autoComplete="name" size="large" />
              </Form.Item>

              <Form.Item
                label="Foydalanuvchi nomi"
                name="username"
                rules={[
                  { required: true, message: "Foydalanuvchi nomini tanlang." },
                  { min: 3, max: 30, message: "Foydalanuvchi nomi 3-30 ta belgidan iborat bo'lishi kerak." },
                  {
                    pattern: /^[a-z0-9_-]+$/,
                    message: "Faqat kichik harf, raqam, tire yoki pastki chiziq kiriting.",
                  },
                ]}
              >
                <Input autoComplete="off" spellCheck={false} size="large" />
              </Form.Item>

              <Form.Item
                label="Telefon raqam"
                name="phoneNumber"
                rules={[
                  {
                    pattern: /^\+?[0-9\s().-]{7,32}$/,
                    message: "Telefon raqam formatini to'g'ri kiriting.",
                  },
                ]}
              >
                <Input autoComplete="tel" inputMode="tel" size="large" placeholder="+998 90 123 45 67" />
              </Form.Item>

              <Form.Item
                label="Parol"
                name="password"
                rules={[
                  { required: true, message: "Parol yarating." },
                  { min: 8, message: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." },
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
                    Telegram botdan kod oling
                  </Button>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Botni ochib, yuborilgan 4 ta raqamli kodni quyiga kiriting.
                  </Typography.Text>
                </div>
              ) : null}
              <Form.Item
                label="Tasdiqlash kodi"
                name="code"
                rules={[
                  { required: true, message: "4 xonali kodni kiriting." },
                  { pattern: /^\d{4}$/, message: "Kod 4 ta raqamdan iborat bo'lishi kerak." },
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
            {challenge ? "Tasdiqlash" : "Kod yuborish"}
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
              Emailni o'zgartirish
            </Button>
          ) : null}
        </Form>

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          Hisobingiz bormi? <Link href="/login">Kirish</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
