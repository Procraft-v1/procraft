import { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, Spin } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useForgotPassword, useResetPassword } from "@procraft/hooks";
import { getErrorMessage } from "@procraft/i18n";
import { Logo } from "@procraft/ui";

export default function ResetPassword() {
  const navigate = useNavigate();
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
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

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
      setSuccess("Parol yangilandi. Endi yangi parol bilan kirishingiz mumkin.");
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
            Parolni tiklash
          </Typography.Title>
          <Typography.Text type="secondary">
            {challenge
              ? `${challenge.maskedEmail} manziliga yuborilgan kodni kiriting.`
              : "Emailingizga tasdiqlash kodi yuboramiz."}
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
          ) : (
            <>
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

              <Form.Item
                label="Yangi parol"
                name="newPassword"
                rules={[
                  { required: true, message: "Yangi parolni kiriting." },
                  { min: 8, message: "Parol kamida 8 ta belgidan iborat bo'lishi kerak." },
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
            {challenge ? "Parolni yangilash" : "Kod yuborish"}
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
              Emailni o'zgartirish
            </Button>
          ) : null}
        </Form>

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          <Link to="/login">Login sahifasiga qaytish</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
