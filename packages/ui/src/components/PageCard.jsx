import { Card } from 'antd';

export function PageCard({ children, ...rest }) {
  return (
    <Card
      {...rest}
      style={{
        borderRadius: 12,
        boxShadow: '0 14px 30px rgb(13 27 42 / 6%)',
        ...rest.style,
      }}
    >
      {children}
    </Card>
  );
}
