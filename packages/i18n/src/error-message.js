import i18next from 'i18next';

const backendMessageKeys = new Map([
  ['email is already taken', 'errors.emailTaken'],
  ['username is already taken', 'errors.usernameTaken'],
  ['username may only contain lowercase letters, digits, hyphen, or underscore', 'errors.usernameFormat'],
  ['invalid credentials', 'errors.invalidCredentials'],
  ['login verification code is invalid or expired', 'errors.loginCodeInvalid'],
  ['too many login verification attempts', 'errors.loginCodeTooManyAttempts'],
  ['register verification code is invalid or expired', 'errors.registerCodeInvalid'],
  ['too many register verification attempts', 'errors.registerCodeTooManyAttempts'],
  ['email is not confirmed', 'errors.emailNotConfirmed'],
  ['password reset code is invalid or expired', 'errors.passwordResetCodeInvalid'],
  ['too many password reset attempts', 'errors.passwordResetTooManyAttempts'],
  ['not authenticated', 'errors.notAuthenticated'],
  ['profile not found', 'errors.profileNotFound'],
  ['csrf validation failed', 'errors.csrf'],
  ['csrf token mismatch', 'errors.csrf'],
  ['an unexpected error occurred', 'errors.unexpected'],
]);

const statusKeys = new Map([
  [400, 'errors.validation'],
  [401, 'errors.notAuthenticated'],
  [403, 'errors.forbidden'],
  [404, 'errors.notFound'],
  [409, 'errors.conflict'],
  [413, 'errors.fileTooLarge'],
  [500, 'errors.server'],
]);

const backendFieldKeys = new Map([
  ['email', 'errors.emailTaken'],
  ['username', 'errors.usernameTaken'],
]);

function t(key, defaultValue) {
  return i18next.t(key, { defaultValue });
}

function cleanMessage(value) {
  return typeof value === 'string' ? value.trim().replace(/\.$/, '') : '';
}

function readBackendMessage(error) {
  const data = error?.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return error?.message ?? '';
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (typeof data.title === 'string') {
    return data.title;
  }

  if (typeof data.detail === 'string') {
    return data.detail;
  }

  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)
      .flat()
      .find((item) => typeof item === 'string');
    return first ?? '';
  }

  return '';
}

function readBackendErrors(error) {
  const data = error?.response?.data;
  return data && typeof data === 'object' && data.errors && typeof data.errors === 'object'
    ? data.errors
    : null;
}

function translateBackendError(field, message) {
  const rawMessage = cleanMessage(message);
  const messageKey = backendMessageKeys.get(rawMessage.toLowerCase());

  if (messageKey) {
    return t(messageKey, rawMessage);
  }

  const fieldKey = rawMessage ? null : backendFieldKeys.get(String(field).toLowerCase());

  if (fieldKey) {
    return t(fieldKey, rawMessage || "Bu ma'lumot allaqachon mavjud.");
  }

  return rawMessage || t('errors.validation', "Kiritilgan ma'lumotlarni tekshiring.");
}

export function getErrorFieldMessages(error) {
  const errors = readBackendErrors(error);

  if (!errors) {
    return [];
  }

  return Object.entries(errors).map(([name, messages]) => {
    const firstMessage = Array.isArray(messages)
      ? messages.find((item) => typeof item === 'string')
      : typeof messages === 'string'
        ? messages
        : '';

    return {
      name,
      errors: [translateBackendError(name, firstMessage)],
    };
  });
}

export function getErrorMessage(error, fallbackKey = 'errors.generic') {
  if (!error) {
    return t(fallbackKey, "Xatolik yuz berdi. Qayta urinib ko'ring.");
  }

  if (!error.response) {
    return t('errors.network', "Serverga ulanishda muammo bor. CORS yoki internet aloqasini tekshiring.");
  }

  const fieldMessages = getErrorFieldMessages(error);

  if (fieldMessages.length > 0) {
    return fieldMessages[0].errors[0];
  }

  const rawMessage = cleanMessage(readBackendMessage(error));
  const normalized = rawMessage.toLowerCase();
  const exactKey = backendMessageKeys.get(normalized);

  if (exactKey) {
    return t(exactKey, rawMessage);
  }

  const status = error.response.status;
  const statusKey = statusKeys.get(status);

  if (statusKey) {
    return t(statusKey, rawMessage || "Xatolik yuz berdi. Qayta urinib ko'ring.");
  }

  return rawMessage || t(fallbackKey, "Xatolik yuz berdi. Qayta urinib ko'ring.");
}
