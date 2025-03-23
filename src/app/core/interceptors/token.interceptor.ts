import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

const AUTH_CONSTANTS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  EXCLUDED_URLS: ['/login', '/register', '/refresh'],
};

/**
 * Intercepts HTTP requests to attach authentication tokens and handle token refreshing
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip adding token for auth-related endpoints
  if (shouldSkipInterception(req.url)) {
    return next(req);
  }

  // Clone request and add token if available
  const token = authService.getToken();
  if (token) {
    const clonedRequest = addTokenToRequest(req, token);

    // Handle the request with error handling for auth errors
    return next(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors - token may be expired
        if (error.status === AUTH_CONSTANTS.UNAUTHORIZED) {
          return handleUnauthorizedError(req, next, authService, router);
        }

        // Handle 403 Forbidden errors - insufficient permissions
        if (error.status === AUTH_CONSTANTS.FORBIDDEN) {
          // Optional: Redirect to access denied page or handle differently
          // router.navigate(['/access-denied']);
        }

        return throwError(() => error);
      }),
    );
  }

  return next(req);
};

/**
 * Check if the request URL should skip token interception
 */
function shouldSkipInterception(url: string): boolean {
  return AUTH_CONSTANTS.EXCLUDED_URLS.some((excludedUrl) => url.includes(excludedUrl));
}

/**
 * Add token to request headers
 */
function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Handle unauthorized error by attempting to refresh the token
 */
function handleUnauthorizedError(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
) {
  // Attempt to refresh the token
  return authService.refreshToken().pipe(
    switchMap((tokenResponse) => {
      // If token refresh succeeds, retry the original request with new token
      const newToken = tokenResponse.accessToken;
      const clonedRequest = addTokenToRequest(req, newToken);
      return next(clonedRequest);
    }),
    catchError((refreshError) => {
      // If refresh fails, log out the user and redirect to login
      authService.logout();
      router.navigate(['/login'], {
        queryParams: {
          returnUrl: router.url,
          sessionExpired: 'true',
        },
      });
      return throwError(() => refreshError);
    }),
  );
}
