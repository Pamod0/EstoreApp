import { Component } from '@angular/core';
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
import { finalize } from 'rxjs';
import { AuthService, RegisterRequest } from '../../../core/services/auth.service';

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
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  serverErrors: string[] = [];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService,
  ) {
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
            ),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    // Component initialization logic
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

    if (this.registerForm.valid) {
      this.isLoading = true;

      const registerData: RegisterRequest = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        fullName: this.registerForm.value.fullName,
      };

      this.authService
        .register(registerData)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (response) => {
            this.snackBar.open('Registration successful! You can now log in.', 'Close', {
              duration: 5000,
              panelClass: ['success-snackbar'],
            });
            this.router.navigate(['/login']);
          },
          error: (error) => {
            if (error.message) {
              this.serverErrors = Array.isArray(error.message) ? error.message : [error.message];
              this.snackBar.open(
                'Registration failed. Please check the form and try again.',
                'Close',
                {
                  duration: 5000,
                  panelClass: ['error-snackbar'],
                },
              );
            }
          },
        });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  getNameErrorMessage() {
    const fullName = this.registerForm.get('fullName');
    if (fullName?.hasError('required')) {
      return 'Full name is required';
    }
    return '';
  }

  getEmailErrorMessage() {
    const email = this.registerForm.get('email');
    if (email?.hasError('required')) {
      return 'Email is required';
    }
    return email?.hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage() {
    const password = this.registerForm.get('password');
    if (password?.hasError('required')) {
      return 'Password is required';
    }
    if (password?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    if (password?.hasError('pattern')) {
      return 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character';
    }
    return '';
  }

  getConfirmPasswordErrorMessage() {
    const confirmPassword = this.registerForm.get('confirmPassword');
    if (confirmPassword?.hasError('required')) {
      return 'Please confirm your password';
    }
    return confirmPassword?.hasError('passwordMismatch') ? 'Passwords do not match' : '';
  }
}
