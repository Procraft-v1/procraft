"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Input, Space, Typography, message } from "antd";
import { GithubOutlined } from "@ant-design/icons";
import { importGithub } from "@procraft/services";
import { getErrorMessage } from "@procraft/i18n";

const { Text, Title } = Typography;

/**
 * GitHub import card. Lets a logged-in user fill their profile from a GitHub
 * username, and auto-runs when arriving from the landing magnet (?github=...).
 * On success it reloads /profile so the freshly populated sections render.
 */
export default function GithubImport() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const autoRan = useRef(false);

  async function runImport(name) {
    const value = String(name || "").trim().replace(/^@/, "");
    if (!value) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await importGithub(value);
      message.success(
        `GitHub'dan import qilindi: ${data.projectsAdded} loyiha, ${data.skillsAdded} ko'nikma, ${data.socialLinksAdded} havola.`,
      );
      // Reload the profile page so every section reflects the import and ?github is dropped.
      window.location.replace("/profile");
    } catch (error) {
      message.error(getErrorMessage(error));
      setLoading(false);
    }
  }

  // Auto-import when the user arrived from the landing "Save this profile" CTA.
  useEffect(() => {
    if (autoRan.current || typeof window === "undefined") {
      return;
    }
    const fromLanding = new URLSearchParams(window.location.search).get("github");
    if (fromLanding) {
      autoRan.current = true;
      setUsername(fromLanding);
      runImport(fromLanding);
    }
  }, []);

  return (
    <Card className="dashboard-form-card" style={{ marginBottom: 16 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Title level={5} style={{ margin: 0 }}>
          <GithubOutlined /> GitHub&apos;dan import
        </Title>
        <Text type="secondary">
          GitHub username&apos;ingizni kiriting — loyihalar, ko&apos;nikmalar va profil
          ma&apos;lumotlari avtomatik to&apos;ldiriladi.
        </Text>
        <Input.Search
          placeholder="GitHub username"
          enterButton="Import qilish"
          size="large"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onSearch={(value) => runImport(value)}
          loading={loading}
          maxLength={39}
          allowClear
          style={{ maxWidth: 420 }}
        />
      </Space>
    </Card>
  );
}
