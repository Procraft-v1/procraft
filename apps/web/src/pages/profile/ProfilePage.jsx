import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import {
  useCertificates,
  useEducations,
  useExperiences,
  useProfile,
  useProjects,
  useSkills,
  useSocialLinks,
} from "@procraft/hooks";

const levelOptions = [1, 2, 3, 4, 5].map((level) => ({
  label: level,
  value: level,
}));

const sectionFields = {
  skills: [
    {
      name: "name",
      label: "Name",
      rules: [{ required: true, message: "Enter a skill name" }],
    },
    { name: "level", label: "Level", type: "select", options: levelOptions },
    { name: "category", label: "Category" },
  ],
  projects: [
    {
      name: "name",
      label: "Name",
      rules: [{ required: true, message: "Enter a project name" }],
    },
    { name: "description", label: "Description", type: "textarea" },
    { name: "githubUrl", label: "GitHub URL" },
    { name: "liveUrl", label: "Live URL" },
  ],
  experiences: [
    {
      name: "company",
      label: "Company",
      rules: [{ required: true, message: "Enter a company" }],
    },
    {
      name: "position",
      label: "Position",
      rules: [{ required: true, message: "Enter a position" }],
    },
    {
      name: "startDate",
      label: "Start date",
      type: "date",
      rules: [{ required: true, message: "Enter a start date" }],
    },
    { name: "endDate", label: "End date", type: "date" },
    {
      name: "isCurrent",
      label: "Current role",
      type: "checkbox",
      valuePropName: "checked",
      initialValue: false,
    },
  ],
  educations: [
    {
      name: "institution",
      label: "Institution",
      rules: [{ required: true, message: "Enter an institution" }],
    },
    { name: "degree", label: "Degree" },
    { name: "field", label: "Field" },
  ],
  certificates: [
    {
      name: "name",
      label: "Name",
      rules: [{ required: true, message: "Enter a certificate name" }],
    },
    { name: "issuer", label: "Issuer" },
    { name: "url", label: "URL" },
  ],
  socialLinks: [
    {
      name: "platform",
      label: "Platform",
      rules: [{ required: true, message: "Enter a platform" }],
    },
    {
      name: "url",
      label: "URL",
      rules: [{ required: true, message: "Enter a URL" }],
    },
  ],
};

function compact(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? null : value,
    ]),
  );
}

function renderField(field) {
  if (field.type === "select") {
    return <Select options={field.options} allowClear />;
  }

  if (field.type === "textarea") {
    return <Input.TextArea rows={4} maxLength={1000} showCount />;
  }

  if (field.type === "checkbox") {
    return <Checkbox>{field.label}</Checkbox>;
  }

  if (field.type === "date") {
    return <Input type="date" />;
  }

  return <Input />;
}

function SectionCard({
  title,
  items,
  fields,
  renderItem,
  create,
  update,
  remove,
  isLoading,
  disabled,
}) {
  const [form] = Form.useForm();
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = compact(await form.validateFields());
    setIsSaving(true);

    try {
      await create(values);
      message.success(`${title} saved`);
      setIsModalOpen(false);
    } catch {
      message.error(`Failed to save ${title.toLowerCase()}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    setDeletingId(item.id);

    try {
      await remove(item.id);
      message.success(`${title} deleted`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card
      title={title}
      extra={
        <Button type="primary" onClick={openCreate} disabled={disabled}>
          Add
        </Button>
      }
    >
      <List
        loading={isLoading}
        dataSource={items}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={`No ${title.toLowerCase()} yet`}
            />
          ),
        }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                type="link"
                disabled={disabled}
                onClick={() => openEdit(item)}
              >
                Edit
              </Button>,
              <Button
                key="delete"
                danger
                type="link"
                disabled={disabled}
                loading={deletingId === item.id}
                onClick={() => handleDelete(item)}
              >
                Delete
              </Button>,
            ]}
          >
            {renderItem(item)}
          </List.Item>
        )}
      />

      <Modal
        title={`${editingItem ? "Edit" : "Add"} ${title}`}
        open={isModalOpen}
        okText="Save"
        confirmLoading={isSaving}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          {fields.map((field) => (
            <Form.Item
              key={field.name}
              label={field.type === "checkbox" ? null : field.label}
              name={field.name}
              rules={field.rules}
              valuePropName={field.valuePropName}
              initialValue={field.initialValue}
            >
              {renderField(field)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
      {disabled ? (
        <Typography.Text type="secondary">
          Save the main profile details before adding sections.
        </Typography.Text>
      ) : null}
    </Card>
  );
}

export default function ProfilePage() {
  const [form] = Form.useForm();
  const { profile, isLoading, updateProfile } = useProfile();
  const sectionQueryOptions = { query: { enabled: Boolean(profile) } };
  const skills = useSkills(sectionQueryOptions);
  const projects = useProjects(sectionQueryOptions);
  const experiences = useExperiences(sectionQueryOptions);
  const educations = useEducations(sectionQueryOptions);
  const certificates = useCertificates(sectionQueryOptions);
  const socialLinks = useSocialLinks(sectionQueryOptions);

  const sections = useMemo(
    () => [
      {
        key: "skills",
        title: "Skills",
        hook: skills,
        items: skills.skills,
        fields: sectionFields.skills,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.name}
            description={
              <Space wrap>
                {item.level ? (
                  <Typography.Text>Level {item.level}/5</Typography.Text>
                ) : null}
                {item.category ? (
                  <Typography.Text type="secondary">
                    {item.category}
                  </Typography.Text>
                ) : null}
              </Space>
            }
          />
        ),
      },
      {
        key: "projects",
        title: "Projects",
        hook: projects,
        items: projects.projects,
        fields: sectionFields.projects,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.name}
            description={
              <Space direction="vertical" size={2}>
                {item.description ? (
                  <Typography.Text type="secondary">
                    {item.description}
                  </Typography.Text>
                ) : null}
                <Space wrap>
                  {item.githubUrl ? (
                    <Typography.Link href={item.githubUrl}>
                      GitHub
                    </Typography.Link>
                  ) : null}
                  {item.liveUrl ? (
                    <Typography.Link href={item.liveUrl}>Live</Typography.Link>
                  ) : null}
                </Space>
              </Space>
            }
          />
        ),
      },
      {
        key: "experiences",
        title: "Experiences",
        hook: experiences,
        items: experiences.experiences,
        fields: sectionFields.experiences,
        renderItem: (item) => (
          <List.Item.Meta
            title={`${item.position} at ${item.company}`}
            description={`${item.startDate || "Start"} - ${item.isCurrent ? "Present" : item.endDate || "End"}`}
          />
        ),
      },
      {
        key: "educations",
        title: "Educations",
        hook: educations,
        items: educations.educations,
        fields: sectionFields.educations,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.institution}
            description={[item.degree, item.field].filter(Boolean).join(" - ")}
          />
        ),
      },
      {
        key: "certificates",
        title: "Certificates",
        hook: certificates,
        items: certificates.certificates,
        fields: sectionFields.certificates,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.name}
            description={
              <Space direction="vertical" size={2}>
                {item.issuer ? (
                  <Typography.Text type="secondary">
                    {item.issuer}
                  </Typography.Text>
                ) : null}
                {item.url ? (
                  <Typography.Link href={item.url}>{item.url}</Typography.Link>
                ) : null}
              </Space>
            }
          />
        ),
      },
      {
        key: "socialLinks",
        title: "Social Links",
        hook: socialLinks,
        items: socialLinks.socialLinks,
        fields: sectionFields.socialLinks,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.platform}
            description={
              item.url ? (
                <Typography.Link href={item.url}>{item.url}</Typography.Link>
              ) : null
            }
          />
        ),
      },
    ],
    [certificates, educations, experiences, projects, skills, socialLinks],
  );

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
    try {
      await updateProfile(values);
      message.success("Profile saved");
    } catch {
      message.error("Failed to save profile. Please try again.");
    }
  };

  if (isLoading) {
    return <Spin />;
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>Profile details</Typography.Title>
        <Typography.Paragraph type="secondary">
          These fields power your public profile and every selected template.
        </Typography.Paragraph>
      </div>

      <Card className="dashboard-form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Full name"
                name="fullName"
                rules={[{ required: true, message: "Enter your full name" }]}
              >
                <Input
                  autoComplete="name"
                  size="large"
                  placeholder="Alex Morgan"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Title" name="title">
                <Input
                  maxLength={100}
                  size="large"
                  placeholder="Product Designer"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Bio" name="bio">
            <Input.TextArea
              rows={6}
              maxLength={1000}
              showCount
              placeholder="A short, credible summary of your work."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Location" name="location">
                <Input
                  autoComplete="address-level2"
                  size="large"
                  placeholder="Tashkent, Uzbekistan"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Website" name="website">
                <Input
                  autoComplete="url"
                  size="large"
                  placeholder="https://example.com"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="dashboard-form-actions">
            <Button type="primary" htmlType="submit" size="large">
              Save profile
            </Button>
          </div>
        </Form>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Typography.Title level={3}>Profile sections</Typography.Title>
        <Typography.Paragraph type="secondary">
          Add the supporting details that make your public profile feel
          complete.
        </Typography.Paragraph>
        <Row gutter={[18, 18]}>
          {sections.map((section) => (
            <Col key={section.key} xs={24} xl={12}>
              <SectionCard
                title={section.title}
                items={section.items}
                fields={section.fields}
                renderItem={section.renderItem}
                create={section.hook.create}
                update={section.hook.update}
                remove={section.hook.remove}
                isLoading={section.hook.isLoading}
                disabled={!profile}
              />
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
