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
