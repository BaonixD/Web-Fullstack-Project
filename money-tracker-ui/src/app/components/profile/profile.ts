import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { AuthService } from '../../services/auth.service';
import { ApiService, Order } from '../../services/api.service';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, DatePipe, Sidebar],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  activeTab = 0;
  orders: Order[] = [];

  tabs = [
    { label: 'Все заказы', count: 0 },
    { label: 'В работе', count: 0 },
    { label: 'Завершённые', count: 0 },
  ];

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.tabs[0].count = orders.length;
        this.tabs[1].count = orders.filter(o => o.status === 'in_progress').length;
        this.tabs[2].count = orders.filter(o => o.status === 'done').length;
      }
    });
  }

  get filteredOrders(): Order[] {
    if (this.activeTab === 1) return this.orders.filter(o => o.status === 'in_progress');
    if (this.activeTab === 2) return this.orders.filter(o => o.status === 'done');
    return this.orders;
  }

  getTypeClass(type: string): string {
    if (type === 'video') return 'type-video';
    if (type === 'photo') return 'type-photo';
    return 'type-sound';
  }

  getTypeLabel(type: string): string {
    if (type === 'video') return '🎥 Видео';
    if (type === 'photo') return '📸 Фото';
    return '🎙 Звук';
  }

  getStatusClass(status: string): string {
    if (status === 'pending') return 'status-pending';
    if (status === 'in_progress') return 'status-progress';
    return 'status-done';
  }

  getStatusLabel(status: string): string {
    if (status === 'pending') return 'Ожидает';
    if (status === 'in_progress') return 'В работе';
    return 'Готово';
  }

  logout() {
    this.auth.logout();
  }
}
