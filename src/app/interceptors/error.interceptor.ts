import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { extractApiErrorMessage } from '../utils/error.utils';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const apiMessage = extractApiErrorMessage(err);
      (err as any).apiMessage = apiMessage;
      console.error(`[API Error ${err.status}]`, apiMessage, err);
      return throwError(() => err);
    }),
  );

