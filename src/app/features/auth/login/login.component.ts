import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AuthErrorResponse } from '../../../core/models/auth.model';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of, Subscription, tap } from 'rxjs';

const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  SNACKBAR_DURATION: 3000,
  MESSAGES: {
    LOGIN_SUCCESS: 'Login successful!',
    LOGIN_FAILED: 'Login failed. Please try again.',
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Not a valid email',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  },
};

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  authForm!: FormGroup;
  isLogin: boolean = true;
  isLoading: boolean = false;
  hidePassword: boolean = true;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(VALIDATION.PASSWORD_MIN_LENGTH)]],
    });
  }

  onSubmit() {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched(); // Mark all fields as touched to trigger validations
      return;
    }

    this.isLoading = true;

    const { email, password } = this.authForm.value;

    const loginSubscription = this.authService
      .login(email, password)
      .pipe(
        tap((response) => {
          this.snackBar.open(VALIDATION.MESSAGES.LOGIN_SUCCESS, 'Close', {
            duration: VALIDATION.SNACKBAR_DURATION,
          });
          this.resetForm();
          this.router.navigate(['/admin']);
        }),
        catchError((error: AuthErrorResponse) => {
          const errorMessage = error?.error?.message || VALIDATION.MESSAGES.LOGIN_FAILED;
          this.snackBar.open(errorMessage, 'Close', {
            duration: VALIDATION.SNACKBAR_DURATION,
          });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe();

    this.subscriptions.add(loginSubscription);
  }

  resetForm() {
    this.authForm.reset();
    // Avoid validation errors showing up immediately after reset
    Object.keys(this.authForm.controls).forEach((key) => {
      this.authForm.get(key)?.setErrors(null);
    });
  }

  getEmailErrorMessage() {
    const email = this.authForm.get('email');
    if (email?.hasError('required')) {
      return VALIDATION.MESSAGES.EMAIL_REQUIRED;
    }
    return email?.hasError('email') ? VALIDATION.MESSAGES.EMAIL_INVALID : '';
  }

  getPasswordErrorMessage() {
    const password = this.authForm.get('password');
    if (password?.hasError('required')) {
      return VALIDATION.MESSAGES.PASSWORD_REQUIRED;
    }
    return password?.hasError('minlength') ? VALIDATION.MESSAGES.PASSWORD_TOO_SHORT : '';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
