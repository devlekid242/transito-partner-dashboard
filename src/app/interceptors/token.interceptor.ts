import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpErrorResponse,
  HttpRequest,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private refreshPromise: Promise<string | null> | null = null;

  constructor(
    private authService: AuthService,
  ) {}

  private isPublicAuthRoute(url: string): boolean {
    return (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/forgot') ||
      url.includes('/auth/verify')
    );
  }

  private addAuthHeaders(req: HttpRequest<any>, token: string): HttpRequest<any> {
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${token}`,
    };

    if (!(req.body instanceof FormData) && !req.headers.has('Content-Type')) {
      headers['Content-Type'] = 'application/json';
    }

    return req.clone({ setHeaders: headers });
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const isApiRequest = req.url.startsWith('http://localhost:8000/api');
    const shouldAttachToken = isApiRequest && !this.isPublicAuthRoute(req.url);

    const token = this.authService.getToken();
    let authRequest = req;

    if (shouldAttachToken && token) {
      authRequest = this.addAuthHeaders(req, token);
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (
          error.status !== 401 ||
          !isApiRequest ||
          this.isPublicAuthRoute(req.url) ||
          !this.authService.getRefreshToken()
        ) {
          return throwError(() => error);
        }

        if (!this.refreshPromise) {
          this.refreshPromise = this.authService
            .refreshAccessToken()
            .finally(() => (this.refreshPromise = null));
        }

        return from(this.refreshPromise).pipe(
          switchMap((newToken) => {
            if (!newToken) {
              return throwError(() => error);
            }

            const retriedRequest = this.addAuthHeaders(req, newToken);
            return next.handle(retriedRequest);
          }),
        );
      }),
    );
  }
}