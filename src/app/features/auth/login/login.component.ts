import { Component, inject } from '@angular/core';
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

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of, Subscription, tap } from 'rxjs';

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
export class LoginComponent {
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
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.authForm.invalid) return;

    this.isLoading = true;

    const { email, password } = this.authForm.value;

    const loginSubscription = this.authService
      .login(email, password)
      .pipe(
        tap((response) => {
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
          this.router.navigate(['/admin']);
        }),
        catchError((error) => {
          const errorMessage = error?.error?.message || 'Login failed. Please try again.';
          this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe();

    this.subscriptions.add(loginSubscription);
  }

  getEmailErrorMessage() {
    const email = this.authForm.get('email');
    if (email?.hasError('required')) {
      return 'Email is required';
    }
    return email?.hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage() {
    const password = this.authForm.get('password');
    if (password?.hasError('required')) {
      return 'Password is required';
    }
    return password?.hasError('minlength') ? 'Password must be at least 6 characters' : '';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
