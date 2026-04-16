import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AUTH_SKIP_ENDPOINTS } from '../constants/app.constants';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);

  const accessToken = sessionService.getAccessToken();
  const request = accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    : req;

  return next(request).pipe(
    catchError((error) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        AUTH_SKIP_ENDPOINTS.some((endpoint) => req.url.includes(endpoint))
      ) {
        return throwError(() => error);
      }

      if (!sessionService.getRefreshToken()) {
        authService.logout();
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap(() => {
          const refreshedAccessToken = sessionService.getAccessToken();
          return next(
            refreshedAccessToken
              ? req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${refreshedAccessToken}`
                  }
                })
              : req
          );
        }),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
