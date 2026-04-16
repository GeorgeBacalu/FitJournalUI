import { JwtClaims } from '../models/api.models';

const normalizeBase64 = (value: string) => value.replace(/-/g, '+').replace(/_/g, '/');

export const decodeJwt = (token: string | null): JwtClaims | null => {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    const json = atob(normalizeBase64(payload));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
};

export const isJwtExpired = (token: string | null) => {
  const claims = decodeJwt(token);
  if (!claims?.exp) {
    return true;
  }

  return claims.exp * 1000 <= Date.now();
};
