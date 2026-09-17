import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ResetPasswordPageComponent } from './reset-password-page.component';

describe('ResetPasswordPageComponent', () => {
  let auth: { resetPassword: ReturnType<typeof vi.fn> };
  let notifications: { success: ReturnType<typeof vi.fn>; fromHttpError: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };
  const route = { snapshot: { queryParamMap: convertToParamMap({ token: 'reset-token' }) } };
  const createComponent = () => TestBed.runInInjectionContext(() => new ResetPasswordPageComponent(
    route as unknown as ActivatedRoute,
    auth as unknown as AuthService,
    notifications as unknown as NotificationService,
    router as unknown as Router));

  beforeEach(() => {
    auth = { resetPassword: vi.fn() };
    notifications = { success: vi.fn(), fromHttpError: vi.fn() };
    router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({ providers: [FormBuilder] });
  });

  it('prefills the token and rejects mismatched passwords', () => {
    const component = createComponent();
    component.form.patchValue({ newPassword: 'Password1', confirmedPassword: 'Password2' });
    component.submit();
    expect(component.form.controls.token.value).toBe('reset-token');
    expect(component.form.controls.confirmedPassword.hasError('mismatch')).toBe(true);
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('resets the password and redirects to login', () => {
    const component = createComponent();
    auth.resetPassword.mockReturnValue(of({ message: 'Password changed.' }));
    component.form.patchValue({ newPassword: 'Password1', confirmedPassword: 'Password1' });
    component.submit();
    expect(auth.resetPassword).toHaveBeenCalledWith({ token: 'reset-token', newPassword: 'Password1', confirmedPassword: 'Password1' });
    expect(notifications.success).toHaveBeenCalledWith('Password updated', 'Password changed.');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(component.submitting).toBe(false);
  });

  it('reports reset failures without redirecting', () => {
    const component = createComponent();
    const error = new Error('expired');
    auth.resetPassword.mockReturnValue(throwError(() => error));
    component.form.patchValue({ newPassword: 'Password1', confirmedPassword: 'Password1' });
    component.submit();
    expect(notifications.fromHttpError).toHaveBeenCalledWith(error, 'Password reset failed');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.submitting).toBe(false);
  });
});
