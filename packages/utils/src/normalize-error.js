export function toUserMessage(error) {
  if (!error) return 'Something went wrong';

  const message =
    typeof error.message === 'string'
      ? error.message
      : typeof error.code === 'string'
        ? error.code
        : '';

  return message || 'Something went wrong';
}
