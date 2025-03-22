import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  userId: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://localhost:44369';
  private tokenKey = 'auth-token';
  private refreshKey = 'refresh-token';

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  register(registerData: RegisterRequest): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/register`, registerData)
      .pipe(catchError(this.handleError));
  }

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
          const errorMessages = [];

          for (const key in validationErrors) {
            if (validationErrors.hasOwnProperty(key)) {
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

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        localStorage.setItem(this.tokenKey, response.accessToken);
        localStorage.setItem(this.refreshKey, response.refreshToken);
        this.isLoggedInSubject.next(true);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem(this.refreshKey);
    return this.http.post(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response: any) => {
        localStorage.setItem(this.tokenKey, response.accessToken);
      }),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
