import { useState } from 'react';
import { Button, Form, Input, Space, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@procraft/hooks';
import { Logo } from '@procraft/ui';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFinish(values) {
    setError('');
    setIsSubmitting(true);
    try {
      await register(values);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Space direction="vertical" size={24} style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center' }}>
          <Logo size={42} />
          <Typography.Title level={3} style={{ marginTop: 24, marginBottom: 4 }}>
            Create account
          </Typography.Title>
          <Typography.Text type="secondary">Start building your Procraft workspace.</Typography.Text>
        </div>

        <Form layout="vertical" requiredMark={false} onFinish={handleFinish}>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Enter a valid email.' }]}>
            <Input autoComplete="email" size="large" />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: 'Choose a username.' },
              { min: 3, max: 30, message: 'Username must be 3-30 characters.' },
            ]}
          >
            <Input autoComplete="username" size="large" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Create a password.' },
              { min: 8, message: 'Password must be at least 8 characters.' },
            ]}
          >
            <Input.Password autoComplete="new-password" size="large" />
          </Form.Item>

          {error ? (
            <Typography.Paragraph type="danger" style={{ marginTop: -4 }}>
              {error}
            </Typography.Paragraph>
          ) : null}

          <Button type="primary" htmlType="submit" size="large" block loading={isSubmitting}>
            Create account
          </Button>
        </Form>

        <Typography.Text type="secondary" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </Typography.Text>
      </Space>
    </main>
  );
}
