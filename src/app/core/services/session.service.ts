import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { STORAGE_KEYS } from '../constants/app.constants';
import { AuthTokens, JwtClaims } from '../models/api.models';
import { decodeJwt, isJwtExpired } from '../utils/jwt.utils';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly accessTokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem(STORAGE_KEYS.accessToken)
  );
  private readonly refreshTokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem(STORAGE_KEYS.refreshToken)
  );
  private readonly claimsSubject = new BehaviorSubject<JwtClaims | null>(
    decodeJwt(localStorage.getItem(STORAGE_KEYS.accessToken))
  );

  readonly claims$ = this.claimsSubject.asObservable();

  getAccessToken() {
    return this.accessTokenSubject.value;
  }

  getRefreshToken() {
    return this.refreshTokenSubject.value;
  }

  getCurrentUserId() {
    return this.claimsSubject.value?.userId ?? null;
  }

  getCurrentRole() {
    return this.claimsSubject.value?.role ?? null;
  }

  isAuthenticated() {
    return !!this.getAccessToken() && !isJwtExpired(this.getAccessToken());
  }

  setTokens(tokens: AuthTokens) {
    localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);

    this.accessTokenSubject.next(tokens.accessToken);
    this.refreshTokenSubject.next(tokens.refreshToken);
    this.claimsSubject.next(decodeJwt(tokens.accessToken));
  }

  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);

    this.accessTokenSubject.next(null);
    this.refreshTokenSubject.next(null);
    this.claimsSubject.next(null);
  }
}
