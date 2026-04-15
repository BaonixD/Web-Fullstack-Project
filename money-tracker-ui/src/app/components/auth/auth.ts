import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [RouterLink, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth implements OnInit {
  activeTab: 'login' | 'register' = 'login';
  error = '';

  loginUsername = '';
  loginPassword = '';

  regFirstName = '';
  regLastName = '';
  regEmail = '';
  regUsername = '';
  regPassword = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'register') {
        this.activeTab = 'register';
      }
    });
  }

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    this.error = '';
  }

  login() {
    this.error = '';
    this.auth.login(this.loginUsername, this.loginPassword).subscribe({
      next: () => this.router.navigate(['/profile']),
      error: () => this.error = 'Неверный логин или пароль'
    });
  }

  register() {
    this.error = '';
    this.auth.register(this.regUsername, this.regEmail, this.regPassword, this.regFirstName, this.regLastName).subscribe({
      next: () => this.router.navigate(['/profile']),
      error: () => this.error = 'Ошибка регистрации'
    });
  }
}
