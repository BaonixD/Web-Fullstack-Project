import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService, Order } from '../../services/api.service';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, FormsModule, DatePipe, Sidebar],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail implements OnInit {
  order: Order | null = null;
  assignTo = '';
  error = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.api.getOrder(id).subscribe({
        next: order => this.order = order,
        error: () => this.error = 'Заказ не найден'
      });
    }
  }

  deleteOrder() {
    if (this.order?.id) {
      this.api.deleteOrder(this.order.id).subscribe({
        next: () => this.router.navigate(['/profile']),
        error: () => this.error = 'Ошибка удаления'
      });
    }
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
}
