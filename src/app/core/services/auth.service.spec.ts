import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { API_BASE_URL } from '../constants/app.constants';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { UserService } from './user.service';

describe('AuthService session lifecycle', () => {
  const http = { post: vi.fn(), delete: vi.fn() };
  const router = { navigateByUrl: vi.fn() };
  const session = {
    getRefreshToken: vi.fn(), setTokens: vi.fn(), clearSession: vi.fn()
  };
  const users = { loadCurrentUser: vi.fn(), clear: vi.fn() };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(
      http as unknown as HttpClient,
      router as unknown as Router,
      session as unknown as SessionService,
      users as unknown as UserService
    );
  });

  it.each([
    ['forgotPassword', 'forgot-password', { email: 'user@test.dev' }],
    ['resetPassword', 'reset-password', { token: 'token', newPassword: 'Password2', confirmedPassword: 'Password2' }],
    ['changePassword', 'change-password', { currentPassword: 'Password1', newPassword: 'Password2', confirmedPassword: 'Password2' }]
  ] as const)('posts %s requests to the expected endpoint', (method, route, request) => {
    http.post.mockReturnValue(of({ message: 'ok' }));
    let result: unknown;
    service[method](request as never).subscribe((value) => result = value);
    expect(http.post).toHaveBeenCalledWith(`${API_BASE_URL}/auth/${route}`, request);
    expect(result).toEqual({ message: 'ok' });
  });

  it('fails refresh locally when no refresh token exists', () => {
    session.getRefreshToken.mockReturnValue(null);
    let error: Error | undefined;
    service.refreshSession().subscribe({ error: (value) => error = value });
    expect(error?.message).toBe('Missing refresh token.');
    expect(http.post).not.toHaveBeenCalled();
  });

  it('shares an in-flight refresh request and stores the returned tokens', () => {
    const refresh$ = new Subject<{ accessToken: string; refreshToken: string }>();
    session.getRefreshToken.mockReturnValue('old-refresh');
    http.post.mockReturnValue(refresh$);
    const results: unknown[] = [];

    service.refreshSession().subscribe((value) => results.push(value));
    service.refreshSession().subscribe((value) => results.push(value));
    refresh$.next({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    refresh$.complete();

    expect(http.post).toHaveBeenCalledTimes(1);
    expect(http.post).toHaveBeenCalledWith(`${API_BASE_URL}/auth/refresh`, { refreshToken: 'old-refresh' });
    expect(session.setTokens).toHaveBeenCalledOnce();
    expect(results).toHaveLength(2);
  });

  it('allows another refresh after the previous request finishes', () => {
    session.getRefreshToken.mockReturnValue('refresh');
    http.post.mockReturnValue(of({ accessToken: 'a', refreshToken: 'r' }));
    service.refreshSession().subscribe();
    service.refreshSession().subscribe();
    expect(http.post).toHaveBeenCalledTimes(2);
  });

  it('deactivates the account and clears state without redirecting', () => {
    http.delete.mockReturnValue(of({ message: 'deleted' }));
    service.deactivateAccount().subscribe();
    expect(http.delete).toHaveBeenCalledWith(`${API_BASE_URL}/auth`);
    expect(session.clearSession).toHaveBeenCalled();
    expect(users.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('clears state and redirects on logout', () => {
    service.logout();
    expect(session.clearSession).toHaveBeenCalled();
    expect(users.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('does not store tokens when refresh fails', () => {
    session.getRefreshToken.mockReturnValue('refresh');
    http.post.mockReturnValue(throwError(() => new Error('refresh failed')));
    service.refreshSession().subscribe({ error: () => undefined });
    expect(session.setTokens).not.toHaveBeenCalled();
  });
});
