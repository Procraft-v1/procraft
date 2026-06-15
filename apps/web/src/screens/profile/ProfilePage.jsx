"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AutoComplete,
  Avatar,
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
  Upload,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { resolveAssetUrl } from "@procraft/config";
import { getErrorMessage } from "@procraft/i18n";
import {
  useCertificates,
  useEducations,
  useExperiences,
  useProfile,
  useProjects,
  useSkillCategories,
  useSkills,
  useSocialLinks,
  useAuth,
} from "@procraft/hooks";

const EXPERIENCE_TYPE_VALUES = ["work", "freelance", "project", "internship", "volunteer"];
const EDUCATION_TYPE_VALUES = ["formal", "course", "self", "mentor", "online"];

const skillCategoryOptions = [
  { label: "Frontend", value: "Frontend" },
  { label: "Backend", value: "Backend" },
  { label: "Dizayn", value: "Dizayn" },
  { label: "DevOps", value: "DevOps" },
  { label: "Til", value: "Til" },
  { label: "Soft skill", value: "Soft skill" },
];

function buildLevelOptions(t) {
  return [1, 2, 3, 4, 5].map((level) => ({
    label: `${level} - ${t(`sections.skills.levelLabel.${level}`)}`,
    value: level,
  }));
}

function buildExperienceTypeOptions(t) {
  return EXPERIENCE_TYPE_VALUES.map((value) => ({
    label: t(`sections.experiences.type.${value}`),
    value,
  }));
}

function buildEducationTypeOptions(t) {
  return EDUCATION_TYPE_VALUES.map((value) => ({
    label: t(`sections.educations.type.${value}`),
    value,
  }));
}

const CERTIFICATE_MAX_SIZE_MB = 10;
const CERTIFICATE_MAX_SIZE_BYTES = CERTIFICATE_MAX_SIZE_MB * 1024 * 1024;
const CERTIFICATE_ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const CERTIFICATE_ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function getFileExtension(fileName = "") {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function isAllowedCertificateFile(file) {
  const extension = getFileExtension(file.name);
  const hasAllowedExtension = CERTIFICATE_ALLOWED_EXTENSIONS.includes(extension);
  const hasAllowedType = !file.type || CERTIFICATE_ALLOWED_TYPES.includes(file.type.toLowerCase());
  return hasAllowedExtension && hasAllowedType;
}

function getProfileInitials(profile) {
  const source = profile?.fullName || profile?.username || "P";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function buildSkillFields(categoryOptions, t) {
  return [
    {
      name: "name",
      label: t("sections.skills.name"),
      placeholder: t("sections.skills.namePlaceholder"),
      rules: [{ required: true, message: t("sections.skills.nameRequired") }],
    },
    {
      name: "level",
      label: t("sections.skills.level"),
      type: "select",
      options: buildLevelOptions(t),
      placeholder: t("sections.skills.levelPlaceholder"),
    },
    {
      name: "category",
      label: t("sections.skills.category"),
      type: "autocomplete",
      options: categoryOptions,
      placeholder: t("sections.skills.categoryPlaceholder"),
    },
  ];
}

function buildSectionFields(t) {
  return {
    projects: [
      {
        name: "name",
        label: t("sections.projects.name"),
        rules: [{ required: true, message: t("sections.projects.nameRequired") }],
      },
      { name: "description", label: t("sections.projects.description"), type: "textarea" },
      { name: "githubUrl", label: t("sections.projects.github") },
      {
        name: "isRepositoryPrivate",
        label: t("sections.projects.privateRepo"),
        type: "checkbox",
        valuePropName: "checked",
        initialValue: false,
      },
      {
        name: "liveUrl",
        label: t("sections.projects.liveUrl"),
        placeholder: "https://your-project.vercel.app",
      },
    ],
    experiences: [
      {
        name: "experienceType",
        label: t("sections.experiences.type"),
        type: "select",
        options: buildExperienceTypeOptions(t),
        initialValue: "work",
        rules: [{ required: true, message: t("sections.experiences.typeRequired") }],
      },
      {
        name: "company",
        label: t("sections.experiences.company"),
        labelByField: {
          field: "experienceType",
          values: {
            work: t("sections.experiences.company"),
            freelance: t("sections.experiences.company.freelance"),
            project: t("sections.experiences.company.project"),
            internship: t("sections.experiences.company.internship"),
            volunteer: t("sections.experiences.company.volunteer"),
          },
        },
        rules: [{ required: true, message: t("sections.experiences.companyRequired") }],
      },
      {
        name: "position",
        label: t("sections.experiences.position"),
        rules: [{ required: true, message: t("sections.experiences.positionRequired") }],
      },
      {
        name: "startDate",
        label: t("sections.experiences.startDate"),
        type: "date",
        rules: [{ required: true, message: t("sections.experiences.startDateRequired") }],
      },
      { name: "endDate", label: t("sections.experiences.endDate"), type: "date" },
      {
        name: "isCurrent",
        label: t("sections.experiences.isCurrent"),
        type: "checkbox",
        valuePropName: "checked",
        initialValue: false,
      },
    ],
    educations: [
      {
        name: "educationType",
        label: t("sections.educations.type"),
        type: "select",
        options: buildEducationTypeOptions(t),
        initialValue: "formal",
        rules: [{ required: true, message: t("sections.educations.typeRequired") }],
      },
      {
        name: "institution",
        label: t("sections.educations.institution"),
        labelByField: {
          field: "educationType",
          values: {
            formal: t("sections.educations.institution"),
            course: t("sections.educations.institution.course"),
            self: t("sections.educations.institution.self"),
            mentor: t("sections.educations.institution.mentor"),
            online: t("sections.educations.institution.online"),
          },
        },
        rules: [{ required: true, message: t("sections.educations.institutionRequired") }],
      },
      {
        name: "degree",
        label: t("sections.educations.degree"),
        labelByField: {
          field: "educationType",
          values: {
            formal: t("sections.educations.degree"),
            course: t("sections.educations.degree.course"),
            self: t("sections.educations.degree.self"),
            mentor: t("sections.educations.degree.mentor"),
            online: t("sections.educations.degree.online"),
          },
        },
      },
      {
        name: "field",
        label: t("sections.educations.field"),
        visibleWhen: {
          field: "educationType",
          values: ["formal", "course", "online"],
        },
      },
    ],
    certificates: [
      {
        name: "name",
        label: t("sections.certificates.name"),
        rules: [{ required: true, message: t("sections.certificates.nameRequired") }],
      },
      { name: "issuer", label: t("sections.certificates.issuer") },
      {
        name: "url",
        label: t("sections.certificates.url"),
        placeholder: t("sections.certificates.urlPlaceholder"),
      },
      {
        name: "file",
        label: t("sections.certificates.file"),
        type: "certificateFile",
      },
    ],
    socialLinks: [
      {
        name: "platform",
        label: t("sections.socialLinks.platform"),
        rules: [{ required: true, message: t("sections.socialLinks.platformRequired") }],
      },
      {
        name: "url",
        label: t("sections.socialLinks.url"),
        rules: [{ required: true, message: t("sections.socialLinks.urlRequired") }],
      },
    ],
  };
}

function compact(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === "string" && value.trim() === "" ? null : value,
    ]),
  );
}

function getInitialValues(fields) {
  return Object.fromEntries(
    fields
      .filter((field) => field.initialValue !== undefined)
      .map((field) => [field.name, field.initialValue]),
  );
}

function getFieldLabel(field, formValues) {
  const control = field.labelByField;
  if (!control) {
    return field.label;
  }

  const controllingValue = formValues?.[control.field];
  return control.values?.[controllingValue] ?? field.label;
}

function isFieldVisible(field, formValues) {
  const condition = field.visibleWhen;
  if (!condition) {
    return true;
  }

  return condition.values.includes(formValues?.[condition.field]);
}

function renderField(field, form) {
  if (field.type === "autocomplete") {
    return (
      <CategoryAutoComplete field={field} />
    );
  }

  if (field.type === "select") {
    return <Select options={field.options} allowClear placeholder={field.placeholder} />;
  }

  if (field.type === "textarea") {
    return <Input.TextArea rows={4} maxLength={1000} showCount placeholder={field.placeholder} />;
  }

  if (field.type === "checkbox") {
    return <Checkbox>{field.label}</Checkbox>;
  }

  if (field.type === "date") {
    return <Input type="date" />;
  }

  if (field.type === "certificateFile") {
    return <CertificateFileField />;
  }

  return <Input placeholder={field.placeholder} />;
}

function CertificateFileField({ value, onChange }) {
  const { t } = useTranslation();

  const beforeUpload = async (file) => {
    if (!isAllowedCertificateFile(file)) {
      message.error(t("sections.certificates.fileTypeError"));
      return Upload.LIST_IGNORE;
    }

    if (file.size > CERTIFICATE_MAX_SIZE_BYTES) {
      message.error(t("sections.certificates.fileSizeError", { size: CERTIFICATE_MAX_SIZE_MB }));
      return Upload.LIST_IGNORE;
    }

    onChange?.(file);
    return false;
  };

  return (
    <Space direction="vertical" size={6} style={{ width: "100%" }}>
      <Upload
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        beforeUpload={beforeUpload}
        fileList={value ? [{ uid: "selected", name: value.name, status: "done" }] : []}
        maxCount={1}
        onRemove={() => {
          onChange?.(undefined);
          return true;
        }}
      >
        <Button icon={<UploadOutlined />}>{t("sections.certificates.fileSelect")}</Button>
      </Upload>
      <Typography.Text type="secondary">
        {t("sections.certificates.fileHint", { size: CERTIFICATE_MAX_SIZE_MB })}
      </Typography.Text>
    </Space>
  );
}

function AvatarCard({ profile, uploadAvatar, deleteAvatar }) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDisabled = !profile;

  const beforeUpload = async (file) => {
    if (isDisabled) {
      message.warning(t("profile.avatar.saveFirst"));
      return Upload.LIST_IGNORE;
    }

    setIsUploading(true);

    try {
      await uploadAvatar(file);
      message.success(t("profile.avatar.uploaded"));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteAvatar();
      message.success(t("profile.avatar.deleted"));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="dashboard-avatar-card">
      <Space size={18} align="center" wrap>
        <Avatar
          size={96}
          src={resolveAssetUrl(profile?.avatarUrl)}
          style={{ background: "#2563EB", fontSize: 30, fontWeight: 800 }}
        >
          {getProfileInitials(profile)}
        </Avatar>

        <div className="dashboard-avatar-card__body">
          <Typography.Title level={4}>{t("profile.avatar.title")}</Typography.Title>
          <Typography.Paragraph type="secondary">
            {isDisabled
              ? t("profile.avatar.subtitleDisabled")
              : t("profile.avatar.subtitle")}
          </Typography.Paragraph>
          <Space wrap>
            <Upload
              accept=".jpg,.jpeg,.png,.webp"
              beforeUpload={beforeUpload}
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={isUploading} disabled={isDisabled}>
                {t("profile.avatar.upload")}
              </Button>
            </Upload>
            {profile?.avatarUrl ? (
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
                onClick={handleDelete}
              >
                {t("profile.avatar.delete")}
              </Button>
            ) : null}
          </Space>
        </div>
      </Space>
    </Card>
  );
}

function CategoryAutoComplete({ field, value, onChange }) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState(value ?? "");
  const input = searchValue.trim();
  const baseOptions = field.options ?? [];
  const hasExact = baseOptions.some(
    (option) => option.value.toLowerCase() === input.toLowerCase(),
  );
  const isNewCategory = Boolean(input && !hasExact);

  const options = useMemo(() => {
    if (!input || !isNewCategory) {
      return baseOptions;
    }

    return [
      ...baseOptions,
      {
        value: input,
        label: (
          <Space size={8}>
            <PlusOutlined />
            <span>{t("profile.newCategoryLabel", { name: input })}</span>
          </Space>
        ),
      },
    ];
  }, [baseOptions, input, isNewCategory, t]);

  useEffect(() => {
    setSearchValue(value ?? "");
  }, [value]);

  const handleChange = (nextValue) => {
    setSearchValue(nextValue);
    onChange?.(nextValue);
  };

  return (
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      <AutoComplete
        value={value}
        options={options}
        placeholder={field.placeholder}
        onChange={handleChange}
        onSearch={setSearchValue}
        filterOption={(inputValue, option) =>
          option?.value?.toLowerCase().includes(inputValue.toLowerCase())
        }
      />
      {isNewCategory ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t("profile.newCategory")}
        </Typography.Text>
      ) : null}
    </Space>
  );
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
  beforeSave,
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [editingItem, setEditingItem] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const openCreate = () => {
    const initialValues = getInitialValues(fields);
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setFormValues(initialValues);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    const values = { ...getInitialValues(fields), ...item };
    setEditingItem(item);
    form.setFieldsValue(values);
    setFormValues(values);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    let values = compact(await form.validateFields());
    const nextFormValues = { ...form.getFieldsValue(), ...values };
    const visibleFieldNames = new Set(
      fields
        .filter((field) => isFieldVisible(field, nextFormValues))
        .map((field) => field.name),
    );
    values = Object.fromEntries(
      Object.entries(values).filter(([key]) => visibleFieldNames.has(key)),
    );
    setIsSaving(true);

    try {
      if (beforeSave) {
        values = await beforeSave(values);
      }

      if (editingItem) {
        await update(editingItem.id, values);
      } else {
        await create(values);
      }
      message.success(t("profile.section.saved", { title }));
      setIsModalOpen(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    setDeletingId(item.id);

    try {
      await remove(item.id);
      message.success(t("profile.section.deleted", { title }));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card
      title={title}
      extra={
        <Button type="primary" onClick={openCreate} disabled={disabled}>
          {t("common.add")}
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
              description={t("profile.section.empty", { title })}
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
                {t("common.edit")}
              </Button>,
              <Button
                key="delete"
                danger
                type="link"
                disabled={disabled}
                loading={deletingId === item.id}
                onClick={() => handleDelete(item)}
              >
                {t("common.delete")}
              </Button>,
            ]}
          >
            {renderItem(item)}
          </List.Item>
        )}
      />

      <Modal
        title={editingItem
          ? t("profile.section.editModal", { title })
          : t("profile.section.addModal", { title })}
        open={isModalOpen}
        okText={t("common.save")}
        confirmLoading={isSaving}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onValuesChange={(_, values) => setFormValues(values)}
        >
          {fields.filter((field) => isFieldVisible(field, formValues)).map((field) => (
            <Form.Item
              key={field.name}
              label={field.type === "checkbox" ? null : getFieldLabel(field, formValues)}
              name={field.name}
              rules={field.rules}
              help={field.help}
              valuePropName={field.valuePropName}
              initialValue={field.initialValue}
              preserve={false}
            >
              {renderField(field, form)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
      {disabled ? (
        <Typography.Text type="secondary">
          {t("profile.section.saveFirst")}
        </Typography.Text>
      ) : null}
    </Card>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth();
  const { profile, isLoading, updateProfile, uploadAvatar, deleteAvatar } = useProfile({ enabled: isAuthenticated });
  const sectionFields = useMemo(() => buildSectionFields(t), [t]);
  const experienceTypeLabels = useMemo(
    () => Object.fromEntries(buildExperienceTypeOptions(t).map((o) => [o.value, o.label])),
    [t],
  );
  const educationTypeLabels = useMemo(
    () => Object.fromEntries(buildEducationTypeOptions(t).map((o) => [o.value, o.label])),
    [t],
  );
  const sectionQueryOptions = { query: { enabled: Boolean(profile) } };
  const skills = useSkills(sectionQueryOptions);
  const skillCategories = useSkillCategories(sectionQueryOptions);
  const projects = useProjects(sectionQueryOptions);
  const experiences = useExperiences(sectionQueryOptions);
  const educations = useEducations(sectionQueryOptions);
  const certificates = useCertificates(sectionQueryOptions);
  const socialLinks = useSocialLinks(sectionQueryOptions);

  const skillCategoryFieldOptions = useMemo(() => {
    const values = new Set(skillCategoryOptions.map((option) => option.value));

    for (const category of skillCategories.skillCategories ?? []) {
      const name = typeof category.name === "string" ? category.name.trim() : "";
      if (name) {
        values.add(name);
      }
    }

    for (const skill of skills.skills ?? []) {
      const category = typeof skill.category === "string" ? skill.category.trim() : "";
      if (category) {
        values.add(category);
      }
    }

    return Array.from(values)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }));
  }, [skillCategories.skillCategories, skills.skills]);

  const ensureSkillCategory = useCallback(async (values) => {
    const category = typeof values.category === "string" ? values.category.trim() : "";
    if (!category) {
      return values;
    }

    const exists = (skillCategories.skillCategories ?? []).some(
      (item) => item.name?.trim().toLowerCase() === category.toLowerCase(),
    );

    if (!exists) {
      await skillCategories.create({ name: category });
    }

    return { ...values, category };
  }, [skillCategories]);

  const sections = useMemo(
    () => [
      {
        key: "skills",
        title: t("sections.skills.title"),
        hook: skills,
        items: skills.skills,
        fields: buildSkillFields(skillCategoryFieldOptions, t),
        beforeSave: ensureSkillCategory,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.name}
            description={
              <Space wrap>
                {item.level ? (
                  <Typography.Text>{t("sections.skills.level")} {item.level}/5</Typography.Text>
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
        title: t("sections.projects.title"),
        hook: projects,
        items: projects.projects,
        fields: sectionFields.projects,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.name}
            description={
              <Space direction="vertical" size={2}>
                {item.description ? (
                  <Typography.Text
                    type="secondary"
                    className="profile-project-description"
                    title={item.description}
                  >
                    {item.description}
                  </Typography.Text>
                ) : null}
                <Space wrap>
                  {item.isRepositoryPrivate ? (
                    <Typography.Text type="secondary">
                      {t("sections.projects.privateRepo")}
                    </Typography.Text>
                  ) : item.githubUrl ? (
                    <Typography.Link href={item.githubUrl} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </Typography.Link>
                  ) : null}
                  {item.liveUrl ? (
                    <Typography.Link href={item.liveUrl} target="_blank" rel="noopener noreferrer">
                      Live
                    </Typography.Link>
                  ) : null}
                </Space>
              </Space>
            }
          />
        ),
      },
      {
        key: "experiences",
        title: t("sections.experiences.title"),
        hook: experiences,
        items: experiences.experiences,
        fields: sectionFields.experiences,
        renderItem: (item) => (
          <List.Item.Meta
            title={`${item.position} - ${item.company}`}
            description={
              <Space direction="vertical" size={2}>
                <Typography.Text type="secondary">
                  {experienceTypeLabels[item.experienceType] ?? t("sections.experiences.type.work")}
                </Typography.Text>
                <Typography.Text>
                  {`${item.startDate || t("sections.experiences.startDate")} - ${item.isCurrent ? t("sections.experiences.now") : item.endDate || t("sections.experiences.endDate")}`}
                </Typography.Text>
              </Space>
            }
          />
        ),
      },
      {
        key: "educations",
        title: t("sections.educations.title"),
        hook: educations,
        items: educations.educations,
        fields: sectionFields.educations,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.institution}
            description={
              <Space direction="vertical" size={2}>
                <Typography.Text type="secondary">
                  {educationTypeLabels[item.educationType] ?? t("sections.educations.type.formal")}
                </Typography.Text>
                <Typography.Text>
                  {[item.degree, item.field].filter(Boolean).join(" - ")}
                </Typography.Text>
              </Space>
            }
          />
        ),
      },
      {
        key: "certificates",
        title: t("sections.certificates.title"),
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
                  <Typography.Link href={resolveAssetUrl(item.url)} target="_blank" rel="noopener noreferrer">
                    {item.url}
                  </Typography.Link>
                ) : null}
              </Space>
            }
          />
        ),
      },
      {
        key: "socialLinks",
        title: t("sections.socialLinks.title"),
        hook: socialLinks,
        items: socialLinks.socialLinks,
        fields: sectionFields.socialLinks,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.platform}
            description={
              item.url ? (
                <Typography.Link href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.url}
                </Typography.Link>
              ) : null
            }
          />
        ),
      },
    ],
    [certificates, educations, ensureSkillCategory, experiences, projects, skills, skillCategoryFieldOptions, socialLinks, sectionFields, experienceTypeLabels, educationTypeLabels, t],
  );

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        fullName: profile.fullName,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
      });
    }
  }, [form, profile]);

  const handleFinish = async (values) => {
    if (!isAuthenticated) {
      window.__procraftRequireAuth?.(`${window.location.pathname}${window.location.search}`);
      return;
    }

    try {
      await updateProfile(values);
      message.success(t("profile.saved"));
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return <Spin />;
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <Typography.Title level={2}>{t("profile.title")}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {t("profile.subtitle")}
        </Typography.Paragraph>
      </div>

      <AvatarCard
        profile={profile}
        uploadAvatar={uploadAvatar}
        deleteAvatar={deleteAvatar}
      />

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
                label={t("profile.fullName")}
                name="fullName"
                rules={[{ required: true, message: t("profile.fullNameRequired") }]}
              >
                <Input
                  autoComplete="name"
                  size="large"
                  placeholder="Alex Morgan"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t("profile.jobTitle")} name="title">
                <Input
                  maxLength={100}
                  size="large"
                  placeholder="Product Designer"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={t("profile.bio")} name="bio">
            <Input.TextArea
              rows={6}
              maxLength={1000}
              showCount
              placeholder={t("profile.bioPlaceholder")}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label={t("profile.location")} name="location">
                <Input
                  autoComplete="address-level2"
                  size="large"
                  placeholder="Tashkent, Uzbekistan"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="dashboard-form-actions">
            <Button type="primary" htmlType="submit" size="large">
              {t("profile.save")}
            </Button>
          </div>
        </Form>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Typography.Title level={3}>{t("profile.sectionsTitle")}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {t("profile.sectionsSubtitle")}
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
                beforeSave={section.beforeSave}
              />
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
