import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

let refreshPromise: Promise<string | null> | null = null;

function isPublicAuthRoute(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot') ||
    url.includes('/auth/verify')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isApiRequest = req.url.startsWith(environment.apiUrl) || req.url.startsWith(environment.baseApiUrl);
  const shouldAttachToken = isApiRequest && !isPublicAuthRoute(req.url);

  const token = authService.getToken();
  let headers: { [key: string]: string } = {};

  if (shouldAttachToken && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(req.body instanceof FormData) && !req.headers.has('Content-Type') && isApiRequest) {
    headers['Content-Type'] = 'application/json';
  }

  const authReq = Object.keys(headers).length > 0 ? req.clone({ setHeaders: headers }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        !isApiRequest ||
        isPublicAuthRoute(req.url) ||
        !authService.getRefreshToken()
      ) {
        return throwError(() => error);
      }

      if (!refreshPromise) {
        refreshPromise = authService.refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      return from(refreshPromise).pipe(
        switchMap((newToken) => {
          if (!newToken) {
            return throwError(() => error);
          }
          const retriedReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });
          return next(retriedReq);
        }),
      );
    }),
  );
};
