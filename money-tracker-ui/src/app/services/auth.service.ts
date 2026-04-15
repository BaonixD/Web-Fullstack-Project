import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface UserInfo {
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private currentUser = signal<UserInfo | null>(null);

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => !!this.token);

  constructor(private http: HttpClient, private router: Router) {
    if (this.token) {
      this.loadUser();
    }
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(username: string, password: string) {
    return this.http.post<{ token: string }>('/api/login/', { username, password }).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.token);
        this.loadUser();
      })
    );
  }

  register(username: string, email: string, password: string, firstName: string, lastName: string) {
    return this.http.post<{ token: string }>('/api/register/', {
      username, email, password, first_name: firstName, last_name: lastName
    }).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.loadUser();
        }
      })
    );
  }

  loadUser() {
    this.http.get<UserInfo>('/api/me/').subscribe({
      next: user => this.currentUser.set(user),
      error: () => this.logout()
    });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }
}
