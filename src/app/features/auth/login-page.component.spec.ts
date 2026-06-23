import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let authService: {
    login: ReturnType<typeof vi.fn>;
  };
  let notificationService: {
    success: ReturnType<typeof vi.fn>;
    fromHttpError: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  const createComponent = () =>
    TestBed.runInInjectionContext(
      () =>
        new LoginPageComponent(
          authService as unknown as AuthService,
          notificationService as unknown as NotificationService,
          router as unknown as Router
        )
    );

  beforeEach(() => {
    authService = {
      login: vi.fn()
    };
    notificationService = {
      success: vi.fn(),
      fromHttpError: vi.fn()
    };
    router = {
      navigateByUrl: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [FormBuilder]
    });
  });

  it('does not submit when the form is invalid', () => {
    const component = createComponent();

    component.submit();

    expect(component.submitted).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBe(true);
    expect(component.form.controls.password.touched).toBe(true);
  });

  it('logs in and redirects to dashboard when credentials are valid', () => {
    const component = createComponent();
    authService.login.mockReturnValue(of(void 0));
    component.form.setValue({
      email: 'user@fitjournal.test',
      password: 'Password1'
    });

    component.submit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@fitjournal.test',
      password: 'Password1'
    });
    expect(notificationService.success).toHaveBeenCalledWith(
      'Logged in',
      'Welcome back to FitJournal.'
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    expect(component.submitting).toBe(false);
  });

  it('shows an error when authentication fails', () => {
    const component = createComponent();
    const error = new Error('Invalid credentials');
    authService.login.mockReturnValue(throwError(() => error));
    component.form.setValue({
      email: 'user@fitjournal.test',
      password: 'Password1'
    });

    component.submit();

    expect(notificationService.fromHttpError).toHaveBeenCalledWith(error, 'Login failed');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.submitting).toBe(false);
  });
});
