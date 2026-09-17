import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

export const STORAGE_KEYS = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

export const DEFAULT_PAGE_REQUEST = {
  page: 1,
  size: 25,
};

export const AUTH_SKIP_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
  '/auth/external',
];
