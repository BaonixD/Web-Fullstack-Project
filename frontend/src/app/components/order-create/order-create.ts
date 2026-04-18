import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-create',
  imports: [FormsModule, RouterLink, Sidebar],
  templateUrl: './order-create.html',
  styleUrl: './order-create.css'
})
export class OrderCreate {
  selectedFormat = 0;
  orderType = 'video';
  duration = 'До 30 минут';
  orderTitle = '';
  orderDetails = '';
  needsMontage = 'no';
  montageInstructions = '';
  error = '';
  showAuthPrompt = false;
  deadline = '';
  deadlineDay: number | null = null;
  deadlineMonth: number | null = null;
  deadlineYear: number | null = null;
  coverFile: File | null = null;
  coverPreview: string | null = null;

  months = [
    { value: 1, label: 'Январь' },
    { value: 2, label: 'Февраль' },
    { value: 3, label: 'Март' },
    { value: 4, label: 'Апрель' },
    { value: 5, label: 'Май' },
    { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' },
    { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябрь' },
    { value: 10, label: 'Октябрь' },
    { value: 11, label: 'Ноябрь' },
    { value: 12, label: 'Декабрь' },
  ];

  get years(): number[] {
    const y = new Date().getFullYear();
    return [y, y + 1, y + 2];
  }

  get days(): number[] {
    const m = this.deadlineMonth;
    const y = this.deadlineYear ?? new Date().getFullYear();
    if (!m) return Array.from({ length: 31 }, (_, i) => i + 1);
    const last = new Date(y, m, 0).getDate();
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  private syncDeadline() {
    if (this.deadlineDay && this.deadlineMonth && this.deadlineYear) {
      const mm = String(this.deadlineMonth).padStart(2, '0');
      const dd = String(this.deadlineDay).padStart(2, '0');
      this.deadline = `${this.deadlineYear}-${mm}-${dd}`;
    } else {
      this.deadline = '';
    }
  }

  onDeadlinePartChange() {
    // Clamp day when month/year shortens the range
    const maxDay = this.days.length;
    if (this.deadlineDay && this.deadlineDay > maxDay) {
      this.deadlineDay = maxDay;
    }
    this.syncDeadline();
  }

  quickDeadline(offsetDays: number) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    this.deadlineYear = d.getFullYear();
    this.deadlineMonth = d.getMonth() + 1;
    this.deadlineDay = d.getDate();
    this.syncDeadline();
  }

  clearDeadline() {
    this.deadlineDay = null;
    this.deadlineMonth = null;
    this.deadlineYear = null;
    this.deadline = '';
  }

  formats = [
    { icon: '🎬', label: 'Клип', desc: 'Музыкальное видео', value: 'video' },
    { icon: '🎙', label: 'Подкаст', desc: 'Интервью, разговоры', value: 'video' },
    { icon: '📸', label: 'Фотосессия', desc: 'Портреты, события', value: 'photo' },
  ];

  constructor(
    private api: ApiService,
    private router: Router,
    public auth: AuthService
  ) {}

  selectFormat(index: number) {
    this.selectedFormat = index;
    this.orderType = this.formats[index].value;
  }

  submit() {
    if (!this.orderTitle.trim()) {
      this.error = 'Укажите название заказа';
      return;
    }
    if (!this.auth.token) {
      this.error = '';
      this.showAuthPrompt = true;
      return;
    }
    this.error = '';
    this.showAuthPrompt = false;

    const form = new FormData();
    form.append('title', this.orderTitle);
    form.append('description', this.orderDetails);
    form.append('service_type', this.orderType);
    form.append('status', 'pending');
    if (this.deadline) form.append('deadline', this.deadline);
    if (this.coverFile) form.append('cover_image', this.coverFile);

    this.api.createOrder(form).subscribe({
      next: () => this.router.navigate(['/profile']),
      error: () => this.error = 'Ошибка при создании заказа. Войдите в аккаунт.'
    });
  }

  onCoverChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.coverFile = file;
    const reader = new FileReader();
    reader.onload = () => this.coverPreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  clearCover() {
    this.coverFile = null;
    this.coverPreview = null;
  }
}
