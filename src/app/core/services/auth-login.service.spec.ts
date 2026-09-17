import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/app.constants';
import { User } from '../models/api.models';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { UserService } from './user.service';

describe('AuthService login integration', () => {
  let authService: AuthService;
  let http: HttpTestingController;
  let sessionService: SessionService;
  let userService: UserService;

  const userId = '11111111-1111-1111-1111-111111111111';

  const installLocalStorageMock = () => {
    const store = new Map<string, string>();

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        clear: vi.fn(() => store.clear()),
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        removeItem: vi.fn((key: string) => store.delete(key)),
        setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      },
    });
  };

  const jwtWithClaims = (claims: Record<string, unknown>) => {
    const encode = (value: unknown) =>
      btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(claims)}.signature`;
  };

  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        SessionService,
        UserService,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    userService = TestBed.inject(UserService);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('posts credentials, stores returned tokens and loads the current user', () => {
    const accessToken = jwtWithClaims({
      userId,
      role: 'User',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const refreshToken = 'refresh-token';
    const currentUser: User = {
      id: userId,
      name: 'Fit User',
      email: 'user@fitjournal.test',
      phone: '+40700111222',
      birthday: '2000-01-15',
      age: 26,
      height: 180,
      weight: 80,
      gender: 1,
      role: 0,
    };

    let completed = false;
    authService
      .login({
        email: 'user@fitjournal.test',
        password: 'Password1',
      })
      .subscribe(() => {
        completed = true;
      });

    const loginRequest = http.expectOne(`${API_BASE_URL}/auth/login`);
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.body).toEqual({
      email: 'user@fitjournal.test',
      password: 'Password1',
    });
    loginRequest.flush({ accessToken, refreshToken });

    const userRequest = http.expectOne(`${API_BASE_URL}/user/${userId}`);
    expect(userRequest.request.method).toBe('GET');
    userRequest.flush(currentUser);

    expect(completed).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.accessToken)).toBe(accessToken);
    expect(localStorage.getItem(STORAGE_KEYS.refreshToken)).toBe(refreshToken);
    expect(sessionService.getCurrentUserId()).toBe(userId);
    expect(sessionService.getCurrentRole()).toBe('User');
    expect(userService.getCurrentUserSnapshot()).toEqual(currentUser);
  });
});
