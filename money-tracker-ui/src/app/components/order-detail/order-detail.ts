import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService, Order, Member } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, FormsModule, DatePipe, Sidebar],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail implements OnInit {
  order: Order | null = null;
  members: Member[] = [];
  assignTo: number | null = null;
  newStatus = '';
  error = '';
  success = '';

  statuses = [
    { value: 'pending', label: 'Ожидает' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Готово' },
  ];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.api.getOrder(id).subscribe({
        next: order => {
          this.order = order;
          this.assignTo = order.executor ?? null;
          this.newStatus = order.status;
          this.cdr.detectChanges();
        },
        error: () => this.error = 'Заказ не найден'
      });
    }
    this.api.getMembers().subscribe({
      next: members => {
        this.members = members;
        this.cdr.detectChanges();
      },
    });
  }

  assignOrder() {
    if (!this.order?.id) return;
    this.api.updateOrder(this.order.id, { executor: this.assignTo }).subscribe({
      next: order => {
        this.order = order;
        this.showSuccess('Исполнитель назначен');
      },
      error: () => this.error = 'Ошибка назначения'
    });
  }

  changeStatus() {
    if (!this.order?.id || this.newStatus === this.order.status) return;
    this.api.updateOrder(this.order.id, { status: this.newStatus }).subscribe({
      next: order => {
        this.order = order;
        this.showSuccess('Статус обновлён');
      },
      error: () => this.error = 'Ошибка обновления статуса'
    });
  }

  deleteOrder() {
    if (this.order?.id) {
      this.api.deleteOrder(this.order.id).subscribe({
        next: () => this.router.navigate(['/profile']),
        error: () => this.error = 'Ошибка удаления'
      });
    }
  }

  private showSuccess(msg: string) {
    this.success = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.success = ''; this.cdr.detectChanges(); }, 3000);
  }

  getTypeLabel(type: string): string {
    if (type === 'video') return '🎥 Видеосъёмка';
    if (type === 'photo') return '📸 Фотосъёмка';
    return '🎨 Дизайн';
  }

  getStatusLabel(status: string): string {
    if (status === 'pending') return 'Ожидает';
    if (status === 'in_progress') return 'В работе';
    return 'Готово';
  }

  getStatusClass(status: string): string {
    if (status === 'pending') return 'status-pending';
    if (status === 'in_progress') return 'status-progress';
    return 'status-done';
  }

  getMemberName(m: Member): string {
    if (m.first_name && m.last_name) return `${m.first_name} ${m.last_name}`;
    return m.username;
  }
}
