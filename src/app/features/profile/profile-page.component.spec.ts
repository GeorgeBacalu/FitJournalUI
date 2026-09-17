import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { User } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { ProfilePageComponent } from './profile-page.component';

describe('ProfilePageComponent', () => {
  const user: User = { id: 'user-1', name: 'Alex', email: 'alex@example.com', phone: '+40123456789', birthday: '1990-01-02', age: 36, height: 180, weight: 80, gender: 1 };
  let auth: { changePassword: ReturnType<typeof vi.fn>; deactivateAccount: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let confirmation: { confirm: ReturnType<typeof vi.fn> };
  let notifications: { success: ReturnType<typeof vi.fn>; fromHttpError: ReturnType<typeof vi.fn> };
  let users: { getCurrentUserSnapshot: ReturnType<typeof vi.fn>; loadCurrentUser: ReturnType<typeof vi.fn>; updateProfile: ReturnType<typeof vi.fn> };

  const createComponent = () => TestBed.runInInjectionContext(() => new ProfilePageComponent(
    auth as unknown as AuthService, router as unknown as Router, confirmation as unknown as ConfirmationService,
    notifications as unknown as NotificationService, users as unknown as UserService));

  beforeEach(() => {
    auth = { changePassword: vi.fn(), deactivateAccount: vi.fn() };
    router = { navigate: vi.fn() };
    confirmation = { confirm: vi.fn() };
    notifications = { success: vi.fn(), fromHttpError: vi.fn() };
    users = { getCurrentUserSnapshot: vi.fn().mockReturnValue(null), loadCurrentUser: vi.fn().mockReturnValue(of(user)), updateProfile: vi.fn() };
    TestBed.configureTestingModule({ providers: [FormBuilder] });
  });

  it('hydrates the profile from the server and clears loading flags', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.user).toEqual(user);
    expect(component.profileForm.controls.name.value).toBe('Alex');
    expect(component.profileForm.controls.birthday.value).toEqual(new Date(1990, 0, 2));
    expect(component.loading).toBe(false);
    expect(component.refreshing).toBe(false);
  });

  it('reports profile-load failures and retains cached data', () => {
    users.getCurrentUserSnapshot.mockReturnValue(user);
    const error = new Error('offline');
    users.loadCurrentUser.mockReturnValue(throwError(() => error));
    const component = createComponent();
    component.loadProfile();
    expect(component.user).toEqual(user);
    expect(notifications.fromHttpError).toHaveBeenCalledWith(error, 'Profile load failed');
    expect(component.loading).toBe(false);
  });

  it('rejects mismatched passwords without calling the service', () => {
    const component = createComponent();
    component.passwordForm.setValue({ currentPassword: 'Current1', newPassword: 'Password1', confirmedPassword: 'Password2' });
    component.savePassword();
    expect(component.passwordForm.controls.confirmedPassword.hasError('mismatch')).toBe(true);
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password and resets the form', () => {
    const component = createComponent();
    auth.changePassword.mockReturnValue(of({ message: 'Changed.' }));
    component.passwordForm.setValue({ currentPassword: 'Current1', newPassword: 'Password1', confirmedPassword: 'Password1' });
    component.savePassword();
    expect(auth.changePassword).toHaveBeenCalledOnce();
    expect(notifications.success).toHaveBeenCalledWith('Password changed', 'Changed.');
    expect(component.passwordForm.controls.currentPassword.value).toBe('');
    expect(component.passwordSubmitted).toBe(false);
    expect(component.savingPassword).toBe(false);
  });

  it('saves a valid profile using a date-only birthday', () => {
    const component = createComponent();
    users.updateProfile.mockReturnValue(of({ message: 'Saved.' }));
    users.loadCurrentUser.mockReturnValue(of(user));
    component.profileForm.setValue({ name: 'Alex', email: 'alex@example.com', phone: '+40123456789', birthday: new Date(1990, 0, 2), height: 180, weight: 79, gender: 1 });
    component.saveProfile();
    expect(users.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ birthday: '1990-01-02', weight: 79 }));
    expect(notifications.success).toHaveBeenCalledWith('Profile updated', 'Saved.');
    expect(users.loadCurrentUser).toHaveBeenCalled();
    expect(component.savingProfile).toBe(false);
  });

  it('deactivates only after confirmation and redirects on success', () => {
    const component = createComponent();
    auth.deactivateAccount.mockReturnValue(of({ message: 'Deactivated.' }));
    confirmation.confirm.mockImplementation((options: { accept?: () => void }) => options.accept?.());
    component.deactivateAccount();
    expect(auth.deactivateAccount).toHaveBeenCalledOnce();
    expect(notifications.success).toHaveBeenCalledWith('Account deactivated', 'Deactivated.');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
