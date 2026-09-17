import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ForgotPasswordPageComponent } from './forgot-password-page.component';

describe('ForgotPasswordPageComponent', () => {
  let auth: { forgotPassword: ReturnType<typeof vi.fn> };
  let notifications: { success: ReturnType<typeof vi.fn>; fromHttpError: ReturnType<typeof vi.fn> };

  const createComponent = () => TestBed.runInInjectionContext(() =>
    new ForgotPasswordPageComponent(auth as unknown as AuthService, notifications as unknown as NotificationService));

  beforeEach(() => {
    auth = { forgotPassword: vi.fn() };
    notifications = { success: vi.fn(), fromHttpError: vi.fn() };
    TestBed.configureTestingModule({ providers: [FormBuilder] });
  });

  it('marks the invalid form and does not request an email', () => {
    const component = createComponent();
    component.submit();
    expect(component.submitted).toBe(true);
    expect(component.form.controls.email.touched).toBe(true);
    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('requests a reset email and shows the server message', () => {
    const component = createComponent();
    auth.forgotPassword.mockReturnValue(of({ message: 'Check your inbox.' }));
    component.form.setValue({ email: 'alex@example.com' });
    component.submit();
    expect(auth.forgotPassword).toHaveBeenCalledWith({ email: 'alex@example.com' });
    expect(notifications.success).toHaveBeenCalledWith('Email requested', 'Check your inbox.');
    expect(component.submitting).toBe(false);
  });

  it('reports request failures and clears the submitting state', () => {
    const component = createComponent();
    const error = new Error('network');
    auth.forgotPassword.mockReturnValue(throwError(() => error));
    component.form.setValue({ email: 'alex@example.com' });
    component.submit();
    expect(notifications.fromHttpError).toHaveBeenCalledWith(error, 'Password reset request failed');
    expect(component.submitting).toBe(false);
  });
});
