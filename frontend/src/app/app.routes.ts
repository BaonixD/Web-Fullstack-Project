import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/landing/landing').then(m => m.Landing) },
  { path: 'auth', loadComponent: () => import('./components/auth/auth').then(m => m.Auth) },
  { path: 'profile', loadComponent: () => import('./components/profile/profile').then(m => m.Profile) },
  { path: 'order-create', loadComponent: () => import('./components/order-create/order-create').then(m => m.OrderCreate) },
  { path: 'order-detail/:id', loadComponent: () => import('./components/order-detail/order-detail').then(m => m.OrderDetail) },
  { path: 'news', loadComponent: () => import('./components/news/news').then(m => m.News) },
  { path: 'members', loadComponent: () => import('./components/members/members').then(m => m.Members) },
  { path: 'members/:id', loadComponent: () => import('./components/member-detail/member-detail').then(m => m.MemberDetail) },
  { path: '**', redirectTo: '' },
];
