import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces moved to separate model file and imported back
export interface RegisterRequest {
  email: string;
  password: string;
  // confirmPassword: string;
  // fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiration: string;
  userId: string;
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

// Constants for the service
const AUTH_CONSTANTS = {
  STORAGE_KEYS: {
    TOKEN: 'auth-token',
    REFRESH_TOKEN: 'refresh-token',
    USER_DATA: 'user-data',
  },
  API_ENDPOINTS: {
    LOGIN: '/login',
    REGISTER: '/register',
    REFRESH: '/refresh',
    LOGOUT: '/logout',
  },
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'https://localhost:44369';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // Modern dependency injection
  private http = inject(HttpClient);
  private router = inject(Router);

  /**
   * Checks if the user has a valid token stored
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
  }

  /**
   * Register a new user
   * @param registerData User registration data
   * @returns Observable with registration response
   */
  register(registerData: RegisterRequest): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}${AUTH_CONSTANTS.API_ENDPOINTS.REGISTER}`, registerData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   * @param error HttpErrorResponse object
   * @returns Observable that throws an error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && typeof error.error === 'object') {
        if (error.error.errors) {
          // Handle validation errors from ASP.NET Core Identity
          const validationErrors = error.error.errors;
          const errorMessages: string[] = [];

          for (const key in validationErrors) {
            if (Object.prototype.hasOwnProperty.call(validationErrors, key)) {
              errorMessages.push(...validationErrors[key]);
            }
          }

          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(' ');
          }
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Authenticate user with email and password
   * @param email User email
   * @param password User password
   * @returns Observable with login response
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const loginRequest: LoginRequest = { email, password };

    return this.http
      .post<AuthResponse>(`${this.apiUrl}${AUTH_CONSTANTS.API_ENDPOINTS.LOGIN}`, loginRequest)
      .pipe(
        tap((response: AuthResponse) => {
          this.storeAuthData(response);
          this.isLoggedInSubject.next(true);
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Store authentication data in localStorage
   * @param response Auth response containing tokens
   */
  private storeAuthData(response: AuthResponse): void {
    localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, response.accessToken);
    localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);

    // Optionally store user data in a secure way
    const userData = {
      userId: response.userId,
      email: response.email,
      expiration: response.expiration,
    };
    localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }

  /**
   * Log the user out and clear stored auth data
   */
  logout(): void {
    // Optionally call logout endpoint if server needs to invalidate tokens
    // this.http.post(`${this.apiUrl}${AUTH_CONSTANTS.API_ENDPOINTS.LOGOUT}`, {}).subscribe();

    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Refresh the access token using the stored refresh token
   * @returns Observable with new tokens
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
    const refreshRequest: RefreshTokenRequest = { refreshToken: refreshToken || '' };

    return this.http
      .post<TokenResponse>(`${this.apiUrl}${AUTH_CONSTANTS.API_ENDPOINTS.REFRESH}`, refreshRequest)
      .pipe(
        tap((response: TokenResponse) => {
          localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN, response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem(AUTH_CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
          }
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Get the current auth token
   * @returns The stored token or null if not authenticated
   */
  getToken(): string | null {
    return localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.TOKEN);
  }

  /**
   * Check if the user is authenticated
   * @returns Boolean indicating authentication status
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Get user data from local storage
   * @returns User data object or null if not available
   */
  getUserData(): { userId: string; email: string; expiration: string } | null {
    const userData = localStorage.getItem(AUTH_CONSTANTS.STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }
}
