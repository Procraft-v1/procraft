import { useEffect, useState } from "react";
import { Button, Form, Input, Space, Typography, Spin } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@procraft/hooks";
import { Logo } from "@procraft/ui";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(searchParams.get("returnTo") || "/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading]);

  async function handleFinish(values) {
    setError("");
    setIsSubmitting(true);
    try {
      await login(values);
      navigate(searchParams.get("returnTo") || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
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
            Welcome back
          </Typography.Title>
          <Typography.Text type="secondary">
            Sign in to continue to Procraft.
          </Typography.Text>
        </div>

        <Form layout="vertical" requiredMark={false} onFinish={handleFinish}>
          <Form.Item
            label="Email or username"
            name="emailOrUsername"
            rules={[
              { required: true, message: "Enter your email or username." },
            ]}
          >
            <Input autoComplete="username" size="large" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Enter your password." }]}
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
            Log in
          </Button>
        </Form>

        <Typography.Text type="secondary" style={{ textAlign: "center" }}>
          New to Procraft? <Link to="/register">Create an account</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
