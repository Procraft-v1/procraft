import { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, Spin } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@procraft/hooks";
import { getErrorMessage } from "@procraft/i18n";
import { Logo } from "@procraft/ui";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, verifyLogin, isAuthenticated, isLoading } = useAuth();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const getReturnTo = () => {
    const value = searchParams.get("returnTo");
    return value && value.startsWith("/") && !value.includes("[object Object]") && !value.startsWith("/login")
      ? value
      : "/";
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(getReturnTo(), { replace: true });
    }
  }, [isAuthenticated, isLoading]);

  async function handleFinish(values) {
    setError("");
    setIsSubmitting(true);
    try {
      if (challenge) {
        await verifyLogin({
          verificationId: challenge.verificationId,
          code: values.code,
        });
        navigate(getReturnTo(), { replace: true });
        return;
      }

      const result = await login(values);
      setChallenge(result);
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
            {challenge
              ? `${challenge.maskedEmail} manziliga yuborilgan kodni kiriting.`
              : "Procraft hisobingizga kiring."}
          </Typography.Text>
        </div>

        <Form layout="vertical" requiredMark={false} onFinish={handleFinish}>
          {challenge ? (
            <>
              <Button
                block
                href="https://mail.google.com/mail/u/0/#inbox"
                icon={<ExportOutlined />}
                rel="noreferrer"
                target="_blank"
                style={{ marginBottom: 16 }}
              >
                Pochtani tekshirish
              </Button>

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
          ) : (
            <>
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
            {challenge ? "Tasdiqlash" : "Kirish"}
          </Button>

          {challenge ? (
            <Button
              type="link"
              block
              onClick={() => {
                setChallenge(null);
                setError("");
              }}
              style={{ marginTop: 8 }}
            >
              Email yoki parolni o'zgartirish
            </Button>
          ) : null}
        </Form>

        {!challenge ? (
          <Typography.Text type="secondary" style={{ textAlign: "center" }}>
            <Link to="/reset-password">Parolni unutdingizmi?</Link>
          </Typography.Text>
        ) : null}

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          Procraftda yangimisiz? <Link to="/register">Ro'yxatdan o'ting</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
