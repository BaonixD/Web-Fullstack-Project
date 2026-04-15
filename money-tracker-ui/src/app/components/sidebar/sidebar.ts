import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarLink {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  userName = input('Асель Касымова');
  userRole = input('Методист');
  userInitials = input('АК');

  menuLinks: SidebarLink[] = [
    { icon: '🏠', label: 'Главная', route: '/' },
    { icon: '👤', label: 'Профиль', route: '/profile' },
    { icon: '📋', label: 'Создать заказ', route: '/order-create' },
    { icon: '📰', label: 'Новости', route: '/news' },
    { icon: '👥', label: 'Мемберы', route: '/members', badge: 12 },
  ];

  orderLinks: SidebarLink[] = [
    { icon: '📦', label: 'Активные', route: '/order-detail', badge: 3 },
  ];
}
