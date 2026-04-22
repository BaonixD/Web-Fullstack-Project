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

interface JwtAuthResponse {
  access: string;
  refresh: string;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private currentUser = signal<UserInfo | null>(null);

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => !!this.token);

  constructor(private http: HttpClient, private router: Router) {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
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
    return this.http.post<JwtAuthResponse>('/api/login/', { username, password }).pipe(
      tap(res => {
        this.storeTokens(res);
        this.loadUser();
      })
    );
  }

  register(username: string, email: string, password: string, firstName: string, lastName: string) {
    return this.http.post<JwtAuthResponse>('/api/register/', {
      username, email, password, first_name: firstName, last_name: lastName
    }).pipe(
      tap(res => {
        this.storeTokens(res);
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
    if (this.token) {
      this.http.post('/api/logout/', {}).subscribe({ error: () => {} });
    }
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  private storeTokens(res: JwtAuthResponse) {
    sessionStorage.setItem(this.tokenKey, res.access);
    sessionStorage.setItem(this.refreshTokenKey, res.refresh);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }
}
