import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../services/api.service';
import { DatePipe } from '@angular/common';

export interface SidebarLink {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  notify = inject(NotificationService);
  private router = inject(Router);

  panelOpen = signal(false);

  menuLinks: SidebarLink[] = [
    { icon: '👤', label: 'Профиль', route: '/profile' },
    { icon: '📋', label: 'Создать заказ', route: '/order-create' },
    { icon: '📰', label: 'Новости', route: '/news' },
    { icon: '👥', label: 'Мемберы', route: '/members' },
  ];

  toggleNotifications() {
    this.panelOpen.update(v => !v);
    if (this.panelOpen()) this.notify.refresh();
  }

  closePanel() {
    this.panelOpen.set(false);
  }

  openNotification(n: Notification) {
    if (!n.is_read) this.notify.markRead(n.id);
    this.closePanel();
    if (n.link) this.router.navigateByUrl(n.link);
  }

  iconForKind(kind: string): string {
    if (kind === 'interview_approved') return '✅';
    if (kind === 'interview_rejected') return '✕';
    if (kind === 'order_assigned') return '📌';
    if (kind === 'order_status') return '🔄';
    if (kind === 'order_message') return '💬';
    return '🔔';
  }
}
