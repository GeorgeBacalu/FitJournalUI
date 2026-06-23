import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RegisterPageComponent } from './register-page.component';

describe('RegisterPageComponent', () => {
  let authService: {
    register: ReturnType<typeof vi.fn>;
  };
  let notificationService: {
    success: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  const createComponent = () =>
    TestBed.runInInjectionContext(
      () =>
        new RegisterPageComponent(
          authService as unknown as AuthService,
          notificationService as unknown as NotificationService,
          router as unknown as Router
        )
    );

  beforeEach(() => {
    authService = {
      register: vi.fn()
    };
    notificationService = {
      success: vi.fn()
    };
    router = {
      navigateByUrl: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [FormBuilder]
    });
  });

  it('does not submit when passwords do not match', () => {
    const component = createComponent();
    component.form.setValue({
      name: 'Fit User',
      email: 'user@fitjournal.test',
      password: 'Password1',
      confirmedPassword: 'Password2',
      phone: '+40700111222',
      birthday: new Date(2000, 0, 15),
      height: 180,
      weight: 80,
      gender: 1
    });

    component.submit();

    expect(component.submitted).toBe(true);
    expect(component.form.controls.confirmedPassword.errors).toEqual({ mismatch: true });
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('registers a valid user and redirects to login', () => {
    const component = createComponent();
    authService.register.mockReturnValue(of({ message: 'User registered successfully' }));
    component.form.setValue({
      name: 'Fit User',
      email: 'user@fitjournal.test',
      password: 'Password1',
      confirmedPassword: 'Password1',
      phone: '+40700111222',
      birthday: new Date(2000, 0, 15),
      height: 180,
      weight: 80,
      gender: 1
    });

    component.submit();

    expect(authService.register).toHaveBeenCalledWith({
      name: 'Fit User',
      email: 'user@fitjournal.test',
      password: 'Password1',
      confirmedPassword: 'Password1',
      phone: '+40700111222',
      birthday: '2000-01-15',
      height: 180,
      weight: 80,
      gender: 1
    });
    expect(notificationService.success).toHaveBeenCalledWith(
      'Account created',
      'User registered successfully'
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(component.submitting).toBe(false);
  });
});
