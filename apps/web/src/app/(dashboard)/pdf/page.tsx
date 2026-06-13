import type { Metadata } from 'next';

import PdfPage from '../../../screens/pdf/PdfPage';

export const metadata: Metadata = {
  title: 'PDF eksport',
};

export default function Page() {
  return <PdfPage />;
}
