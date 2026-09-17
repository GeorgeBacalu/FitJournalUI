import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

describe('authInterceptor', () => {
  const auth = { refreshSession: vi.fn(), logout: vi.fn() };
  const session = { getAccessToken: vi.fn(), getRefreshToken: vi.fn() };
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.clearAllMocks();
    session.getAccessToken.mockReturnValue('access-token');
    session.getRefreshToken.mockReturnValue('refresh-token');
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: auth },
      { provide: SessionService, useValue: session }
    ] });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('adds the bearer token to outgoing requests', () => {
    client.get('/api/resource').subscribe();
    const request = http.expectOne('/api/resource');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush({});
  });

  it('does not add a header when the session has no access token', () => {
    session.getAccessToken.mockReturnValue(null);
    client.get('/api/resource').subscribe();
    const request = http.expectOne('/api/resource');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('refreshes after a 401 and retries with the new token', () => {
    auth.refreshSession.mockImplementation(() => {
      session.getAccessToken.mockReturnValue('new-token');
      return of({ accessToken: 'new-token', refreshToken: 'new-refresh' });
    });
    client.get('/api/resource').subscribe();
    http.expectOne('/api/resource').flush({}, { status: 401, statusText: 'Unauthorized' });
    const retry = http.expectOne('/api/resource');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({});
    expect(auth.refreshSession).toHaveBeenCalledOnce();
  });

  it('logs out when no refresh token is available', () => {
    session.getRefreshToken.mockReturnValue(null);
    client.get('/api/resource').subscribe({ error: () => undefined });
    http.expectOne('/api/resource').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(auth.refreshSession).not.toHaveBeenCalled();
  });

  it('logs out when refresh fails', () => {
    auth.refreshSession.mockReturnValue(throwError(() => new Error('refresh failed')));
    client.get('/api/resource').subscribe({ error: () => undefined });
    http.expectOne('/api/resource').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('does not attempt refresh for authentication endpoints', () => {
    client.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
