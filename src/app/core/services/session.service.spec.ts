import { STORAGE_KEYS } from '../constants/app.constants';
import { SessionService } from './session.service';

const tokenFor = (claims: Record<string, unknown>) => {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=+$/g, '');
  return `${encode({ alg: 'none' })}.${encode(claims)}.signature`;
};

describe('SessionService', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => store.set(key, value)),
        removeItem: vi.fn((key: string) => store.delete(key))
      }
    });
  });

  it('stores tokens, exposes claims, and authenticates a live session', () => {
    const service = new SessionService();
    const accessToken = tokenFor({ userId: 'u1', role: 'Admin', exp: Math.floor(Date.now() / 1000) + 60 });

    service.setTokens({ accessToken, refreshToken: 'refresh' });

    expect(store.get(STORAGE_KEYS.accessToken)).toBe(accessToken);
    expect(store.get(STORAGE_KEYS.refreshToken)).toBe('refresh');
    expect(service.getCurrentUserId()).toBe('u1');
    expect(service.getCurrentRole()).toBe('Admin');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('rejects expired tokens and clears all session state', () => {
    const service = new SessionService();
    service.setTokens({ accessToken: tokenFor({ exp: 1 }), refreshToken: 'refresh' });
    expect(service.isAuthenticated()).toBe(false);

    service.clearSession();
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.getCurrentUserId()).toBeNull();
    expect(store.size).toBe(0);
  });
});
