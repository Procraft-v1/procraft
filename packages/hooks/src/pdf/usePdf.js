import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { downloadResume } from '@procraft/services';

const fileName = 'procraft-resume.pdf';

function saveBlob(blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useDownloadResume(options) {
  return useMutation({
    ...options,
    mutationFn: () => downloadResume().then((res) => res.data),
    onSuccess: (blob, ...args) => {
      saveBlob(blob);
      options?.onSuccess?.(blob, ...args);
    },
    meta: { domain: 'pdf', action: 'download' },
  });
}

export function usePreviewResume(options) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const closePreview = () => {
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return '';
    });
  };

  const mutation = useMutation({
    ...options,
    mutationFn: () => downloadResume().then((res) => res.data),
    onSuccess: (blob, ...args) => {
      const url = URL.createObjectURL(blob);
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return url;
      });
      options?.onSuccess?.(blob, ...args);
    },
    meta: { domain: 'pdf', action: 'preview' },
  });

  return {
    ...mutation,
    previewUrl,
    closePreview,
  };
}
