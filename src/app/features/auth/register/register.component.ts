import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of, Subscription, tap } from 'rxjs';
import { AuthService, RegisterRequest } from '../../../core/services/auth.service';
import { AuthErrorResponse } from '../../../core/models/auth.model';

const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  SNACKBAR_DURATION: 5000,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
  MESSAGES: {
    REGISTER_SUCCESS: 'Registration successful! You can now log in.',
    REGISTER_FAILED: 'Registration failed. Please check the form and try again.',
    NAME_REQUIRED: 'Full name is required',
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Not a valid email',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
    PASSWORD_PATTERN:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
    CONFIRM_PASSWORD_REQUIRED: 'Please confirm your password',
    PASSWORDS_MISMATCH: 'Passwords do not match',
  },
};

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  registerForm!: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  serverErrors: string[] = [];

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.registerForm = this.fb.group(
      {
        // fullName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(VALIDATION.PASSWORD_MIN_LENGTH),
            Validators.pattern(VALIDATION.PASSWORD_PATTERN),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit() {
    this.serverErrors = [];

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const registerData: RegisterRequest = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      // confirmPassword: this.registerForm.value.confirmPassword,
      // fullName: this.registerForm.value.fullName,
    };

    const registerSubscription = this.authService
      .register(registerData)
      .pipe(
        tap((response) => {
          this.snackBar.open(VALIDATION.MESSAGES.REGISTER_SUCCESS, 'Close', {
            duration: VALIDATION.SNACKBAR_DURATION,
            panelClass: ['success-snackbar'],
          });
          this.resetForm();
          this.router.navigate(['/login']);
        }),
        catchError((error: AuthErrorResponse) => {
          if (error.message) {
            this.serverErrors = Array.isArray(error.message) ? error.message : [error.message];
          }
          this.snackBar.open(VALIDATION.MESSAGES.REGISTER_FAILED, 'Close', {
            duration: VALIDATION.SNACKBAR_DURATION,
            panelClass: ['error-snackbar'],
          });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe();

    this.subscriptions.add(registerSubscription);
  }

  resetForm() {
    this.registerForm.reset();
    // Avoid validation errors showing up immediately after reset
    Object.keys(this.registerForm.controls).forEach((key) => {
      this.registerForm.get(key)?.setErrors(null);
    });
    this.serverErrors = [];
  }

  getNameErrorMessage() {
    const fullName = this.registerForm.get('fullName');
    if (fullName?.hasError('required')) {
      return VALIDATION.MESSAGES.NAME_REQUIRED;
    }
    return '';
  }

  getEmailErrorMessage() {
    const email = this.registerForm.get('email');
    if (email?.hasError('required')) {
      return VALIDATION.MESSAGES.EMAIL_REQUIRED;
    }
    return email?.hasError('email') ? VALIDATION.MESSAGES.EMAIL_INVALID : '';
  }

  getPasswordErrorMessage() {
    const password = this.registerForm.get('password');
    if (password?.hasError('required')) {
      return VALIDATION.MESSAGES.PASSWORD_REQUIRED;
    }
    if (password?.hasError('minlength')) {
      return VALIDATION.MESSAGES.PASSWORD_TOO_SHORT;
    }
    if (password?.hasError('pattern')) {
      return VALIDATION.MESSAGES.PASSWORD_PATTERN;
    }
    return '';
  }

  getConfirmPasswordErrorMessage() {
    const confirmPassword = this.registerForm.get('confirmPassword');
    if (confirmPassword?.hasError('required')) {
      return VALIDATION.MESSAGES.CONFIRM_PASSWORD_REQUIRED;
    }
    return confirmPassword?.hasError('passwordMismatch')
      ? VALIDATION.MESSAGES.PASSWORDS_MISMATCH
      : '';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
