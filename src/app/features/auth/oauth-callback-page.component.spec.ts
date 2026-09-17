import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { OAuthCallbackPageComponent } from './oauth-callback-page.component';

describe('OAuthCallbackPageComponent', () => {
  const create = (code: string | null, result = of(void 0)) => {
    const route = { snapshot: { queryParamMap: convertToParamMap(code ? { code } : {}) } };
    const auth = { exchangeExternalCode: vi.fn().mockReturnValue(result) };
    const notifications = { error: vi.fn() };
    const router = { navigateByUrl: vi.fn() };
    const component = new OAuthCallbackPageComponent(route as unknown as ActivatedRoute, auth as unknown as AuthService,
      notifications as unknown as NotificationService, router as unknown as Router);
    return { component, auth, notifications, router };
  };

  it('redirects to login when no external code exists', () => {
    const { component, auth, router } = create(null);
    component.ngOnInit();
    expect(auth.exchangeExternalCode).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('exchanges the code and redirects to the dashboard', () => {
    const { component, auth, router } = create('oauth-code');
    component.ngOnInit();
    expect(auth.exchangeExternalCode).toHaveBeenCalledWith('oauth-code');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('reports an invalid code and returns to login', () => {
    const { component, notifications, router } = create('bad-code', throwError(() => new Error('invalid')));
    component.ngOnInit();
    expect(notifications.error).toHaveBeenCalledWith('Sign-in failed', 'The external login code is invalid or expired.');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
