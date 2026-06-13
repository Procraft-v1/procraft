'use client';

import { Alert } from 'antd';

/**
 * Client boundary for antd Alert — importing antd named exports directly in
 * server components trips Next 14's barrel-optimize RSC manifest bug.
 */
export default function ProfileAlert({ type, message }) {
  return <Alert type={type} message={message} />;
}
