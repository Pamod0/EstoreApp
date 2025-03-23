import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Authentication guard to protect routes from unauthorized access
 * Uses the modern functional approach for route guards
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is authenticated, allow access
  if (authService.isAuthenticated()) {
    return true;
  }

  // Otherwise, redirect to login with return URL
  router.navigate(['/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });

  return false;
};

/**
 * Guard that prevents authenticated users from accessing certain routes
 * Useful for pages like login/register that shouldn't be visible when logged in
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is not authenticated, allow access
  if (!authService.isAuthenticated()) {
    return true;
  }

  // Otherwise, redirect to dashboard/home
  router.navigate(['/admin']);

  return false;
};
