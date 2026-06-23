import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../constants/app.constants';
import { RegisterRequest } from '../models/api.models';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { UserService } from './user.service';

describe('AuthService register integration', () => {
  let authService: AuthService;
  let http: HttpTestingController;

  const installLocalStorageMock = () => {
    const store = new Map<string, string>();

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        clear: vi.fn(() => store.clear()),
        getItem: vi.fn((key: string) => store.get(key) ?? null),
        removeItem: vi.fn((key: string) => store.delete(key)),
        setItem: vi.fn((key: string, value: string) => store.set(key, value))
      }
    });
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
        provideHttpClientTesting()
      ]
    });

    authService = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('posts register data and returns the API message', () => {
    const request: RegisterRequest = {
      name: 'Fit User',
      email: 'user@fitjournal.test',
      password: 'Password1',
      confirmedPassword: 'Password1',
      phone: '+40700111222',
      birthday: '2000-01-15',
      height: 180,
      weight: 80,
      gender: 1
    };

    let message = '';
    authService.register(request).subscribe((response) => {
      message = response.message;
    });

    const registerRequest = http.expectOne(`${API_BASE_URL}/auth/register`);
    expect(registerRequest.request.method).toBe('POST');
    expect(registerRequest.request.body).toEqual(request);
    registerRequest.flush({ message: 'User registered successfully' });

    expect(message).toBe('User registered successfully');
  });
});
