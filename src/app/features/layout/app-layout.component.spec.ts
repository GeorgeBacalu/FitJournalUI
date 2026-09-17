import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AppLayoutComponent } from './app-layout.component';

describe('AppLayoutComponent', () => {
  let auth: { logout: ReturnType<typeof vi.fn> };
  let router: { url: string; navigateByUrl: ReturnType<typeof vi.fn> };
  let users: { currentUser$: BehaviorSubject<null>; loadCurrentUser: ReturnType<typeof vi.fn> };

  const createComponent = () => TestBed.runInInjectionContext(() =>
    new AppLayoutComponent(auth as unknown as AuthService, router as unknown as Router));

  beforeEach(() => {
    auth = { logout: vi.fn() };
    router = { url: '/dashboard', navigateByUrl: vi.fn() };
    users = { currentUser$: new BehaviorSubject(null), loadCurrentUser: vi.fn().mockReturnValue(of(null)) };
    TestBed.configureTestingModule({ providers: [{ provide: UserService, useValue: users }] });
  });

  it('loads the current user and tolerates load failures', () => {
    const component = createComponent();
    users.loadCurrentUser.mockReturnValue(throwError(() => new Error('offline')));
    expect(() => component.ngOnInit()).not.toThrow();
    expect(users.loadCurrentUser).toHaveBeenCalledOnce();
  });

  it('navigates, detects active routes, and logs out', () => {
    const component = createComponent();
    component.go('/profile');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
    expect(component.isActive('/dashboard')).toBe(true);
    expect(component.isActive('/profile')).toBe(false);
    component.logout();
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('formats at most two initials and falls back for blank names', () => {
    const component = createComponent();
    expect(component.initials('alex maria pop')).toBe('AM');
    expect(component.initials('')).toBe('FJ');
    expect(component.initials(null)).toBe('FJ');
  });
});
