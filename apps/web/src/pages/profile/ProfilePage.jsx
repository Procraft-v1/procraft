import { useEffect } from 'react';
import { Button, Form, Input, Spin, Typography, message } from 'antd';
import { useProfile } from '@procraft/hooks';

export default function ProfilePage() {
  const [form] = Form.useForm();
  const { profile, isLoading, updateProfile } = useProfile();

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        fullName: profile.fullName,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
      });
    }
  }, [form, profile]);

  const handleFinish = async (values) => {
    await updateProfile(values);
    message.success('Profile saved');
  };

  if (isLoading) {
    return <Spin />;
  }

  return (
    <section style={{ maxWidth: 720 }}>
      <Typography.Title level={3}>Profile</Typography.Title>
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item
          label="Full name"
          name="fullName"
          rules={[{ required: true, message: 'Enter your full name' }]}
        >
          <Input autoComplete="name" />
        </Form.Item>

        <Form.Item label="Title" name="title">
          <Input maxLength={100} />
        </Form.Item>

        <Form.Item label="Bio" name="bio">
          <Input.TextArea rows={5} maxLength={1000} showCount />
        </Form.Item>

        <Form.Item label="Location" name="location">
          <Input autoComplete="address-level2" />
        </Form.Item>

        <Form.Item label="Website" name="website">
          <Input autoComplete="url" />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Save profile
        </Button>
      </Form>
    </section>
  );
}
