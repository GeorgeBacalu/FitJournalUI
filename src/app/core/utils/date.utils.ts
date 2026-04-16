const pad = (value: number) => `${value}`.padStart(2, '0');

export const toDateOnlyString = (value: Date | string | null | undefined) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toDateTimeString = (value: Date | string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
};

export const toDateValue = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
};
