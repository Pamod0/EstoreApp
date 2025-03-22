import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  private authService = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    this.authService.login(this.email, this.password).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
