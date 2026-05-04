import { Typography } from 'antd';
import { ProcraftLogoWordmark } from '../logo/ProcraftLogoWordmark.jsx';

/**
 * Skeleton header — dashboards extend with menus / user slot via children.
 */
export function AppShellHeader({ title, subtitle, aside }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '20px 24px',
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <ProcraftLogoWordmark compact />
        <div>
          {title ? <Typography.Title level={4}>{title}</Typography.Title> : null}
          {subtitle ? (
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              {subtitle}
            </Typography.Text>
          ) : null}
        </div>
      </div>
      {aside}
    </div>
  );
}
