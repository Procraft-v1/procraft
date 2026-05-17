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

const levelOptions = [1, 2, 3, 4, 5].map((level) => ({
  label: `${level} - ${["Boshlang'ich", "O'rtacha", "Yaxshi", "Kuchli", "Ekspert"][level - 1]}`,
  value: level,
}));

const skillCategoryOptions = [
  { label: "Frontend", value: "Frontend" },
  { label: "Backend", value: "Backend" },
  { label: "Dizayn", value: "Dizayn" },
  { label: "DevOps", value: "DevOps" },
  { label: "Til", value: "Til" },
  { label: "Soft skill", value: "Soft skill" },
];

const experienceTypeOptions = [
  { label: "Ish joyi", value: "work" },
  { label: "Freelance", value: "freelance" },
  { label: "Shaxsiy loyiha", value: "project" },
  { label: "Amaliyot", value: "internship" },
  { label: "Volunteer", value: "volunteer" },
];

const experienceTypeLabels = Object.fromEntries(
  experienceTypeOptions.map((option) => [option.value, option.label]),
);

const educationTypeOptions = [
  { label: "Universitet / kollej", value: "formal" },
  { label: "Kurs / bootcamp", value: "course" },
  { label: "Shaxsiy o'rganish", value: "self" },
  { label: "Mentor / ustoz", value: "mentor" },
  { label: "Onlayn kurs", value: "online" },
];

const educationTypeLabels = Object.fromEntries(
  educationTypeOptions.map((option) => [option.value, option.label]),
);

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

function buildSkillFields(categoryOptions) {
  return [
    {
      name: "name",
      label: "Ko'nikma nomi",
      placeholder: "React, SMM, Copywriting...",
      rules: [{ required: true, message: "Ko'nikma nomini kiriting" }],
    },
    {
      name: "level",
      label: "Daraja",
      type: "select",
      options: levelOptions,
      placeholder: "Darajani tanlang",
    },
    {
      name: "category",
      label: "Kategoriya",
      type: "autocomplete",
      options: categoryOptions,
      placeholder: "Yozing yoki tanlang",
    },
  ];
}

const sectionFields = {
  projects: [
    {
      name: "name",
      label: "Loyiha nomi",
      rules: [{ required: true, message: "Loyiha nomini kiriting" }],
    },
    { name: "description", label: "Tavsif", type: "textarea" },
    { name: "githubUrl", label: "GitHub havolasi" },
    {
      name: "isRepositoryPrivate",
      label: "GitHub repository yopiq",
      type: "checkbox",
      valuePropName: "checked",
      initialValue: false,
    },
    {
      name: "liveUrl",
      label: "Live link (Vercel/Netlify/site)",
      placeholder: "https://your-project.vercel.app",
    },
  ],
  experiences: [
    {
      name: "experienceType",
      label: "Tajriba turi",
      type: "select",
      options: experienceTypeOptions,
      initialValue: "work",
      rules: [{ required: true, message: "Tajriba turini tanlang" }],
    },
    {
      name: "company",
      label: "Kompaniya",
      labelByField: {
        field: "experienceType",
        values: {
          work: "Kompaniya",
          freelance: "Mijoz yoki kompaniya",
          project: "Loyiha nomi",
          internship: "Kompaniya yoki o'quv markazi",
          volunteer: "Tashkilot",
        },
      },
      rules: [{ required: true, message: "Kompaniya nomini kiriting" }],
    },
    {
      name: "position",
      label: "Rol yoki lavozim",
      rules: [{ required: true, message: "Rol yoki lavozimni kiriting" }],
    },
    {
      name: "startDate",
      label: "Boshlanish sanasi",
      type: "date",
      rules: [{ required: true, message: "Boshlanish sanasini kiriting" }],
    },
    { name: "endDate", label: "Tugash sanasi", type: "date" },
    {
      name: "isCurrent",
      label: "Hozir ham shu yerda ishlayman",
      type: "checkbox",
      valuePropName: "checked",
      initialValue: false,
    },
  ],
  educations: [
    {
      name: "educationType",
      label: "Ta'lim turi",
      type: "select",
      options: educationTypeOptions,
      initialValue: "formal",
      rules: [{ required: true, message: "Ta'lim turini tanlang" }],
    },
    {
      name: "institution",
      label: "Ta'lim muassasasi",
      labelByField: {
        field: "educationType",
        values: {
          formal: "Ta'lim muassasasi",
          course: "Kurs nomi yoki markaz",
          self: "Nimani o'rgandingiz?",
          mentor: "Ustoz yoki mentor ismi",
          online: "Platforma yoki kurs nomi",
        },
      },
      rules: [{ required: true, message: "Ta'lim muassasasini kiriting" }],
    },
    {
      name: "degree",
      label: "Daraja / sertifikat",
      labelByField: {
        field: "educationType",
        values: {
          formal: "Daraja",
          course: "Natija / daraja",
          self: "Natija yoki daraja",
          mentor: "Shogirdlik yo'nalishi",
          online: "Natija / daraja",
        },
      },
    },
    {
      name: "field",
      label: "Yo'nalish",
      visibleWhen: {
        field: "educationType",
        values: ["formal", "course", "online"],
      },
    },
  ],
  certificates: [
    {
      name: "name",
      label: "Sertifikat nomi",
      rules: [{ required: true, message: "Sertifikat nomini kiriting" }],
    },
    { name: "issuer", label: "Beruvchi tashkilot" },
    {
      name: "url",
      label: "Sertifikat linki",
      placeholder: "https://coursera.org/... yoki serverdagi fayl linki",
    },
    {
      name: "file",
      label: "Sertifikat fayli",
      type: "certificateFile",
    },
  ],
  socialLinks: [
    {
      name: "platform",
      label: "Platforma",
      rules: [{ required: true, message: "Platformani kiriting" }],
    },
    {
      name: "url",
      label: "Havola",
      rules: [{ required: true, message: "Havolani kiriting" }],
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
  const beforeUpload = async (file) => {
    if (!isAllowedCertificateFile(file)) {
      message.error("Sertifikat fayli PDF, JPG, JPEG, PNG yoki WEBP formatida bo'lishi kerak");
      return Upload.LIST_IGNORE;
    }

    if (file.size > CERTIFICATE_MAX_SIZE_BYTES) {
      message.error(`Sertifikat fayli ${CERTIFICATE_MAX_SIZE_MB}MB dan kichik bo'lishi kerak`);
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
        <Button icon={<UploadOutlined />}>Fayl tanlash</Button>
      </Upload>
      <Typography.Text type="secondary">
        Fayl Saqlash bosilganda sertifikat ma'lumotlari bilan birga yuklanadi. PDF, JPG, JPEG, PNG yoki WEBP. Maksimal hajm: {CERTIFICATE_MAX_SIZE_MB}MB.
      </Typography.Text>
    </Space>
  );
}

function AvatarCard({ profile, uploadAvatar, deleteAvatar }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDisabled = !profile;

  const beforeUpload = async (file) => {
    if (isDisabled) {
      message.warning("Avval asosiy profil ma'lumotlarini saqlang");
      return Upload.LIST_IGNORE;
    }

    setIsUploading(true);

    try {
      await uploadAvatar(file);
      message.success("Profil rasmi yuklandi");
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
      message.success("Profil rasmi o'chirildi");
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
          <Typography.Title level={4}>Profil rasmi</Typography.Title>
          <Typography.Paragraph type="secondary">
            {isDisabled
              ? "Rasm yuklashdan oldin asosiy profil ma'lumotlarini saqlang."
              : "Public portfolio shablonlarida ko'rinadigan rasm."}
          </Typography.Paragraph>
          <Space wrap>
            <Upload
              accept=".jpg,.jpeg,.png,.webp"
              beforeUpload={beforeUpload}
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={isUploading} disabled={isDisabled}>
                Rasm yuklash
              </Button>
            </Upload>
            {profile?.avatarUrl ? (
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
                onClick={handleDelete}
              >
                O'chirish
              </Button>
            ) : null}
          </Space>
        </div>
      </Space>
    </Card>
  );
}

function CategoryAutoComplete({ field, value, onChange }) {
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
            <span>Yangi kategoriya: {input}</span>
          </Space>
        ),
      },
    ];
  }, [baseOptions, input, isNewCategory]);

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
          Yangi kategoriya sifatida saqlanadi.
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
      message.success(`${title} saqlandi`);
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
      message.success(`${title} o'chirildi`);
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
          Qo'shish
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
              description={`${title} hali qo'shilmagan`}
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
                Tahrirlash
              </Button>,
              <Button
                key="delete"
                danger
                type="link"
                disabled={disabled}
                loading={deletingId === item.id}
                onClick={() => handleDelete(item)}
              >
                O'chirish
              </Button>,
            ]}
          >
            {renderItem(item)}
          </List.Item>
        )}
      />

      <Modal
        title={`${editingItem ? "Tahrirlash" : "Qo'shish"}: ${title}`}
        open={isModalOpen}
        okText="Saqlash"
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
          Bo'lim qo'shishdan oldin asosiy profil ma'lumotlarini saqlang.
        </Typography.Text>
      ) : null}
    </Card>
  );
}

export default function ProfilePage() {
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth();
  const { profile, isLoading, updateProfile, uploadAvatar, deleteAvatar } = useProfile({ enabled: isAuthenticated });
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
        title: "Ko'nikmalar",
        hook: skills,
        items: skills.skills,
        fields: buildSkillFields(skillCategoryFieldOptions),
        beforeSave: ensureSkillCategory,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.name}
            description={
              <Space wrap>
                {item.level ? (
                  <Typography.Text>Daraja {item.level}/5</Typography.Text>
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
        title: "Loyihalar",
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
                  {item.isRepositoryPrivate ? (
                    <Typography.Text type="secondary">
                      Yopiq repository
                    </Typography.Text>
                  ) : item.githubUrl ? (
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
        title: "Ish tajribasi",
        hook: experiences,
        items: experiences.experiences,
        fields: sectionFields.experiences,
        renderItem: (item) => (
          <List.Item.Meta
            title={`${item.position} - ${item.company}`}
            description={
              <Space direction="vertical" size={2}>
                <Typography.Text type="secondary">
                  {experienceTypeLabels[item.experienceType] ?? "Ish joyi"}
                </Typography.Text>
                <Typography.Text>
                  {`${item.startDate || "Boshlanish"} - ${item.isCurrent ? "Hozir" : item.endDate || "Tugash"}`}
                </Typography.Text>
              </Space>
            }
          />
        ),
      },
      {
        key: "educations",
        title: "Ta'lim",
        hook: educations,
        items: educations.educations,
        fields: sectionFields.educations,
        renderItem: (item) => (
          <List.Item.Meta
            title={item.institution}
            description={
              <Space direction="vertical" size={2}>
                <Typography.Text type="secondary">
                  {educationTypeLabels[item.educationType] ?? "Universitet / kollej"}
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
        title: "Sertifikatlar",
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
                  <Typography.Link href={resolveAssetUrl(item.url)}>{item.url}</Typography.Link>
                ) : null}
              </Space>
            }
          />
        ),
      },
      {
        key: "socialLinks",
        title: "Ijtimoiy havolalar",
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
    [certificates, educations, ensureSkillCategory, experiences, projects, skills, skillCategoryFieldOptions, socialLinks],
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
      message.success("Profil saqlandi");
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
        <Typography.Title level={2}>Profil ma'lumotlari</Typography.Title>
        <Typography.Paragraph type="secondary">
          Bu ma'lumotlar ommaviy profilingiz va tanlangan shablonlarda ko'rinadi.
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
                label="To'liq ism"
                name="fullName"
                rules={[{ required: true, message: "To'liq ismingizni kiriting" }]}
              >
                <Input
                  autoComplete="name"
                  size="large"
                  placeholder="Alex Morgan"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Lavozim" name="title">
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
              placeholder="Ish tajribangiz haqida qisqa va ishonchli ma'lumot."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Manzil" name="location">
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
              Profilni saqlash
            </Button>
          </div>
        </Form>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Typography.Title level={3}>Profil bo'limlari</Typography.Title>
        <Typography.Paragraph type="secondary">
          Ommaviy profilingizni to'ldiradigan qo'shimcha ma'lumotlarni kiriting.
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
