export const API_BASE_URL = 'https://localhost:5000/api/v1';

export const STORAGE_KEYS = {
  accessToken: 'fitjournal.access-token',
  refreshToken: 'fitjournal.refresh-token'
};

export const DEFAULT_PAGE_REQUEST = {
  page: 1,
  size: 100
};

export const AUTH_SKIP_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh'
];
