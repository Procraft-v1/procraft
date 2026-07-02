"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  Modal,
  Space,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import { GithubOutlined, StarFilled } from "@ant-design/icons";
import { previewGithub, importGithub } from "@procraft/services";
import { getErrorMessage } from "@procraft/i18n";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/** A repo is a good default-checked candidate: it's not a fork, and has stars or a description. */
function isSuggested(project) {
  return !project.fork && (project.stars > 0 || !!project.description);
}

/**
 * GitHub import card. Lets a logged-in user pull their GitHub username into a
 * review modal — confirm/edit profile fields, then check off which repos
 * become projects — before anything is written to their profile.
 */
export default function GithubImport() {
  const [username, setUsername] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(null);
  const [profileDraft, setProfileDraft] = useState({ fullName: "", bio: "", location: "" });
  const [selectedRepos, setSelectedRepos] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  const autoRan = useRef(false);

  async function startImport(name) {
    const value = String(name || "").trim().replace(/^@/, "");
    if (!value) {
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const { data } = await previewGithub(value);
      setUsername(value);
      setPreview(data);
      setProfileDraft({
        fullName: data.profile.fullName ?? "",
        bio: data.profile.bio ?? "",
        location: data.profile.location ?? "",
      });
      setSelectedRepos(new Set(data.projects.filter(isSuggested).map((project) => project.name)));
      setImportError(null);
      setStep(0);
      setModalOpen(true);
    } catch (error) {
      setPreviewError(getErrorMessage(error));
    } finally {
      setPreviewLoading(false);
    }
  }

  function toggleRepo(name, checked) {
    setSelectedRepos((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(name);
      } else {
        next.delete(name);
      }
      return next;
    });
  }

  async function submitImport() {
    setImporting(true);
    setImportError(null);
    try {
      const { data } = await importGithub(username, {
        profile: profileDraft,
        selectedRepoNames: [...selectedRepos],
      });
      message.success(
        `GitHub'dan import qilindi: ${data.projectsAdded} loyiha, ${data.skillsAdded} ko'nikma, ${data.socialLinksAdded} havola.`,
      );
      window.location.replace("/profile");
    } catch (error) {
      setImportError(getErrorMessage(error));
      setImporting(false);
    }
  }

  function closeModal() {
    if (importing) {
      return;
    }
    setModalOpen(false);
  }

  // Auto-open the review modal when arriving from the landing "Save this profile" CTA.
  useEffect(() => {
    if (autoRan.current || typeof window === "undefined") {
      return;
    }
    const fromLanding = new URLSearchParams(window.location.search).get("github");
    if (fromLanding) {
      autoRan.current = true;
      setUsername(fromLanding);
      startImport(fromLanding);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="dashboard-form-card" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Title level={5} style={{ margin: 0 }}>
          <GithubOutlined /> GitHub&apos;dan import
        </Title>
        <Text type="secondary">
          GitHub username&apos;ingizni kiriting — avval ma&apos;lumotlarni ko&apos;rib chiqasiz, keyin
          qaysi loyihalarni qo&apos;shishni o&apos;zingiz tanlaysiz.
        </Text>
        <Input.Search
          placeholder="GitHub username"
          enterButton="Tekshirish"
          size="large"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onSearch={(value) => startImport(value)}
          loading={previewLoading}
          maxLength={39}
          allowClear
          style={{ maxWidth: 420 }}
        />
        {previewError && <Alert type="error" showIcon message={previewError} style={{ maxWidth: 420 }} />}
      </Space>

      <Modal
        open={modalOpen}
        onCancel={closeModal}
        maskClosable={!importing}
        closable={!importing}
        footer={null}
        width={640}
        destroyOnClose
      >
        {preview && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Steps
              size="small"
              current={step}
              items={[{ title: "Profil" }, { title: "Repozitoriyalar" }]}
            />

            {step === 0 && (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <Space align="center" size={12}>
                  <Avatar size={56} src={preview.profile.avatarUrl} icon={<GithubOutlined />} />
                  <Text type="secondary">@{preview.username}</Text>
                </Space>

                <div>
                  <Text strong>Ism</Text>
                  <Input
                    value={profileDraft.fullName}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, fullName: event.target.value }))
                    }
                    maxLength={160}
                    style={{ marginTop: 4 }}
                  />
                </div>

                <div>
                  <Text strong>Bio</Text>
                  <TextArea
                    value={profileDraft.bio}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, bio: event.target.value }))
                    }
                    maxLength={1000}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    style={{ marginTop: 4 }}
                  />
                </div>

                <div>
                  <Text strong>Joylashuv</Text>
                  <Input
                    value={profileDraft.location}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, location: event.target.value }))
                    }
                    maxLength={160}
                    style={{ marginTop: 4 }}
                  />
                </div>

                <Space style={{ justifyContent: "flex-end", width: "100%" }}>
                  <Button onClick={closeModal}>Bekor qilish</Button>
                  <Button type="primary" onClick={() => setStep(1)}>
                    Davom etish
                  </Button>
                </Space>
              </Space>
            )}

            {step === 1 && (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                {preview.projects.length === 0 ? (
                  <Empty description="Ochiq repozitoriyalar topilmadi" />
                ) : (
                  <>
                    <Text type="secondary">
                      Profilga qo&apos;shmoqchi bo&apos;lgan repolarni belgilang ({selectedRepos.size} ta
                      tanlandi).
                    </Text>
                    <div style={{ maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        {preview.projects.map((project) => (
                          <Card key={project.name} size="small" styles={{ body: { padding: 10 } }}>
                            <Checkbox
                              checked={selectedRepos.has(project.name)}
                              onChange={(event) => toggleRepo(project.name, event.target.checked)}
                            >
                              <Space direction="vertical" size={0} style={{ marginLeft: 4 }}>
                                <Space size={6} wrap>
                                  <Text strong>{project.name}</Text>
                                  {project.fork && <Tag>fork</Tag>}
                                  {project.language && <Tag color="blue">{project.language}</Tag>}
                                  {project.stars > 0 && (
                                    <Tag icon={<StarFilled />} color="gold">
                                      {project.stars}
                                    </Tag>
                                  )}
                                </Space>
                                {project.description && (
                                  <Paragraph type="secondary" style={{ margin: 0 }}>
                                    {project.description}
                                  </Paragraph>
                                )}
                              </Space>
                            </Checkbox>
                          </Card>
                        ))}
                      </Space>
                    </div>
                  </>
                )}

                {importError && <Alert type="error" showIcon message={importError} />}

                <Space style={{ justifyContent: "flex-end", width: "100%" }}>
                  <Button onClick={() => setStep(0)} disabled={importing}>
                    Orqaga
                  </Button>
                  <Button type="primary" onClick={submitImport} loading={importing}>
                    Import qilish
                  </Button>
                </Space>
              </Space>
            )}
          </Space>
        )}
      </Modal>
    </Card>
  );
}
