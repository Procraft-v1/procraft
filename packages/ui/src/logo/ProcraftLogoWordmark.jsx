import { Space, Typography } from 'antd';

export function ProcraftLogoWordmark({ compact = false }) {
  const label = compact ? 'PC' : 'Procraft';
  return (
    <Space size={compact ? 4 : 8} align="center">
      <div
        style={{
          background: '#0D1B2A',
          color: '#fff',
          padding: compact ? '4px 8px' : '6px 10px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: compact ? 12 : 13,
          letterSpacing: 0.3,
          boxShadow: '0 6px 24px rgb(37 99 235 / 20%)',
        }}
      >
        {label.slice(0, 2)}
      </div>
      {!compact ? <Typography.Text strong>Procraft</Typography.Text> : null}
    </Space>
  );
}
