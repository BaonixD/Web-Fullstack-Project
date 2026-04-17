import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  auth = inject(AuthService);

  menuLinks: SidebarLink[] = [
    { icon: '👤', label: 'Профиль', route: '/profile' },
    { icon: '📋', label: 'Создать заказ', route: '/order-create' },
    { icon: '📰', label: 'Новости', route: '/news' },
    { icon: '👥', label: 'Мемберы', route: '/members' },
  ];
}
