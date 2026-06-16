import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { downloadResume } from '@procraft/services';

const DEFAULT_FILE_NAME = 'procraft-resume.pdf';

/**
 * Builds a "ism-familya-rezume.pdf" file name from the user's full name.
 * Falls back to the generic name when there is nothing usable.
 */
export function buildResumeFileName(fullName) {
  const slug = String(fullName ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\\/:*?"<>|]+/g, '') // strip filesystem-illegal characters
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug ? `${slug}-rezume.pdf` : DEFAULT_FILE_NAME;
}

function saveBlob(blob, fileName = DEFAULT_FILE_NAME) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useDownloadResume(options = {}) {
  const { fileName, ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    mutationFn: () => downloadResume().then((res) => res.data),
    onSuccess: (blob, ...args) => {
      saveBlob(blob, fileName);
      mutationOptions.onSuccess?.(blob, ...args);
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
