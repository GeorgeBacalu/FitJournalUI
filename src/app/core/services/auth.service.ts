import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../constants/app.constants';
import {
  AuthTokens,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest
} from '../models/api.models';
import { SessionService } from './session.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly endpoint = `${API_BASE_URL}/auth`;
  private refreshRequest$: Observable<AuthTokens> | null = null;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly router: Router,
    private readonly sessionService: SessionService,
    private readonly userService: UserService
  ) {}

  login(request: LoginRequest) {
    return this.httpClient.post<AuthTokens>(`${this.endpoint}/login`, request).pipe(
      tap((tokens) => this.sessionService.setTokens(tokens)),
      switchMap(() => this.userService.loadCurrentUser()),
      map(() => void 0)
    );
  }

  exchangeExternalCode(code: string) {
    return this.httpClient.post<AuthTokens>(`${this.endpoint}/external/exchange`, { code }).pipe(
      tap((tokens) => this.sessionService.setTokens(tokens)),
      switchMap(() => this.userService.loadCurrentUser()),
      map(() => void 0)
    );
  }

  externalLoginUrl(provider: 'google' | 'microsoft') {
    return `${this.endpoint}/external/${provider}`;
  }

  register(request: RegisterRequest) {
    return this.httpClient.post<MessageResponse>(`${this.endpoint}/register`, request);
  }

  forgotPassword(request: ForgotPasswordRequest) {
    return this.httpClient.post<MessageResponse>(`${this.endpoint}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest) {
    return this.httpClient.post<MessageResponse>(`${this.endpoint}/reset-password`, request);
  }

  changePassword(request: ChangePasswordRequest) {
    return this.httpClient.post<MessageResponse>(`${this.endpoint}/change-password`, request);
  }

  refreshSession() {
    const refreshToken = this.sessionService.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('Missing refresh token.'));
    }

    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.httpClient
        .post<AuthTokens>(`${this.endpoint}/refresh`, { refreshToken })
        .pipe(
          tap((tokens) => this.sessionService.setTokens(tokens)),
          shareReplay(1),
          finalize(() => {
            this.refreshRequest$ = null;
          })
        );
    }

    return this.refreshRequest$;
  }

  deactivateAccount() {
    return this.httpClient.delete<MessageResponse>(this.endpoint).pipe(
      tap(() => this.logout(false))
    );
  }

  logout(redirect = true) {
    this.sessionService.clearSession();
    this.userService.clear();

    if (redirect) {
      void this.router.navigateByUrl('/login');
    }
  }
}
