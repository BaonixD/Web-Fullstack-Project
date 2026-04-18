import { Injectable, signal, inject } from '@angular/core';
import { ApiService, Notification } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  notifications = signal<Notification[]>([]);
  unread = signal(0);
  private timer: any = null;

  start() {
    if (this.timer) return;
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 30_000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  refresh() {
    if (!this.auth.token) return;
    this.api.getNotifications().subscribe({
      next: res => {
        this.notifications.set(res.notifications);
        this.unread.set(res.unread);
      },
      error: () => {},
    });
  }

  markRead(id: number) {
    this.api.markNotificationRead(id).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => n.id === id ? { ...n, is_read: true } : n));
        this.unread.update(v => Math.max(0, v - 1));
      },
    });
  }

  markAllRead() {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, is_read: true })));
        this.unread.set(0);
      },
    });
  }
}
