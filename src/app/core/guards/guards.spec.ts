import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { SessionService } from '../services/session.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

describe('route guards', () => {
  const session = { isAuthenticated: vi.fn() };
  const router = { createUrlTree: vi.fn((commands: string[]) => ({ commands }) as unknown as UrlTree) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [
      { provide: SessionService, useValue: session },
      { provide: Router, useValue: router }
    ] });
  });

  it('allows authenticated users through the auth guard', () => {
    session.isAuthenticated.mockReturnValue(true);
    expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toBe(true);
  });

  it('redirects anonymous users to login', () => {
    session.isAuthenticated.mockReturnValue(false);
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('redirects authenticated guests and allows anonymous guests', () => {
    session.isAuthenticated.mockReturnValue(true);
    TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    session.isAuthenticated.mockReturnValue(false);
    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBe(true);
  });
});
