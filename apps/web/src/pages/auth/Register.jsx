import { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, Spin } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@procraft/hooks";
import { getErrorFieldMessages, getErrorMessage } from "@procraft/i18n";
import { Logo } from "@procraft/ui";

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();
  const [form] = Form.useForm();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading]);

  async function handleFinish(values) {
    setError("");
    setIsSubmitting(true);
    try {
      await register(values);
      navigate("/dashboard", { replace: true });
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
            Procraft ish maydoningizni yarating.
          </Typography.Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
          onFinish={handleFinish}
        >
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
            ]}
          >
            <Input autoComplete="off" spellCheck={false} size="large" />
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
            Ro'yxatdan o'tish
          </Button>
        </Form>

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          Hisobingiz bormi? <Link to="/login">Kirish</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
