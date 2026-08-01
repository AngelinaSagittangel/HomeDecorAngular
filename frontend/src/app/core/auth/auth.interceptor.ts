import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { ChangeDetectorRef, inject } from '@angular/core';
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth-service';
import { DefaultResponseType } from '../../../types/default-response.type';
import { LoginResponseType } from '../../../types/login-response.type';
import { Router } from '@angular/router';
import { LoaderService } from '../../shared/services/loader.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tokens = authService.getTokens();
  const loaderService = inject(LoaderService);

  if (!tokens || !tokens.accessToken) {
    return next(req);
  }
  loaderService.show();

  if (tokens && tokens.accessToken) {
    const authReq = req.clone({
      headers: req.headers.set('x-access-token', tokens.accessToken),
    });

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (
          error.status === 401 &&
          !authReq.url.includes('/login') &&
          !authReq.url.includes('/refresh')
        ) {
          return handle401Error(authReq, next, authService, router);
        }
        return throwError(() => error);
      }),
      finalize(() => loaderService.close()),
    );
  }

  return next(req);
};

const handle401Error = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  auth: AuthService,
  rtr: Router,
) => {
  return auth.refresh().pipe(
    switchMap((result) => {
      const isErrorResponse = (result as DefaultResponseType).error !== undefined;

      if (isErrorResponse) {
        const msg = (result as DefaultResponseType).message || 'Ошибка авторизации';
        return throwError(() => new Error(msg));
      }

      const refreshResult = result as LoginResponseType;

      if (!refreshResult.accessToken || !refreshResult.refreshToken) {
        return throwError(() => new Error('Не удалось обновить токены'));
      }

      auth.setTokens(refreshResult.accessToken, refreshResult.refreshToken);

      const newAuthReq = req.clone({
        headers: req.headers.set('x-access-token', refreshResult.accessToken),
      });

      return next(newAuthReq);
    }),
    catchError((error) => {
      auth.removeTokens();
      rtr.navigate(['/']);
      return throwError(() => error);
    }),
  );
};
