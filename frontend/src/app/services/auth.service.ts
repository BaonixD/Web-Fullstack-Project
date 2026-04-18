import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  avatar_url?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private currentUser = signal<UserInfo | null>(null);

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => !!this.token);

  constructor(private http: HttpClient, private router: Router) {
    const legacyToken = localStorage.getItem(this.tokenKey);
    if (!sessionStorage.getItem(this.tokenKey) && legacyToken) {
      sessionStorage.setItem(this.tokenKey, legacyToken);
      localStorage.removeItem(this.tokenKey);
    }
    if (this.token) {
      this.loadUser();
    }
  }

  get token(): string | null {
    return sessionStorage.getItem(this.tokenKey) || localStorage.getItem(this.tokenKey);
  }

  get initials(): string {
    const u = this.currentUser();
    if (!u) return 'U';
    if (u.first_name && u.last_name) {
      return (u.first_name[0] + u.last_name[0]).toUpperCase();
    }
    return u.username.substring(0, 2).toUpperCase();
  }

  get displayName(): string {
    const u = this.currentUser();
    if (!u) return 'Пользователь';
    if (u.first_name && u.last_name) {
      return `${u.first_name} ${u.last_name}`;
    }
    return u.username;
  }

  get roleName(): string {
    const u = this.currentUser();
    if (!u) return 'Гость';
    const roles: Record<string, string> = {
      'guest': 'Гость',
      'member': 'Мембер',
      'methodist': 'Методист',
    };
    return roles[u.role] || u.role;
  }

  login(username: string, password: string) {
    return this.http.post<{ token: string }>('/api/login/', { username, password }).pipe(
      tap(res => {
        sessionStorage.setItem(this.tokenKey, res.token);
        localStorage.removeItem(this.tokenKey);
        this.loadUser();
      })
    );
  }

  register(username: string, email: string, password: string, firstName: string, lastName: string) {
    return this.http.post<{ token: string }>('/api/register/', {
      username, email, password, first_name: firstName, last_name: lastName
    }).pipe(
      tap(res => {
        sessionStorage.setItem(this.tokenKey, res.token);
        localStorage.removeItem(this.tokenKey);
        this.loadUser();
      })
    );
  }

  loadUser() {
    this.http.get<UserInfo>('/api/me/').subscribe({
      next: user => this.currentUser.set(user),
      error: () => this.logout()
    });
  }

  setUser(user: UserInfo) {
    this.currentUser.set(user);
  }

  logout() {
    sessionStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }
}
