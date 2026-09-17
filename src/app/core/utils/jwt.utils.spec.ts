import { decodeJwt, isJwtExpired } from './jwt.utils';

const tokenFor = (claims: Record<string, unknown>) => {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${encode({ alg: 'none' })}.${encode(claims)}.signature`;
};

describe('JWT utilities', () => {
  it('decodes URL-safe JWT claims', () => {
    expect(decodeJwt(tokenFor({ userId: 'user-1', role: 'Admin', exp: 123 }))).toEqual({
      userId: 'user-1', role: 'Admin', exp: 123
    });
  });

  it.each([null, '', 'invalid', 'a.not-base64.c'])('returns null for malformed token %s', (token) => {
    expect(decodeJwt(token)).toBeNull();
  });

  it('recognizes valid, expired, and expiry-less tokens', () => {
    expect(isJwtExpired(tokenFor({ exp: Math.floor(Date.now() / 1000) + 60 }))).toBe(false);
    expect(isJwtExpired(tokenFor({ exp: Math.floor(Date.now() / 1000) - 60 }))).toBe(true);
    expect(isJwtExpired(tokenFor({ userId: 'user-1' }))).toBe(true);
  });
});
