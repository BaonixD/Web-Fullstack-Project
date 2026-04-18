import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { SkeletonCard } from '../skeleton/skeleton';
import { AuthService } from '../../services/auth.service';
import { ApiService, InterviewRequest, Order } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, DatePipe, Sidebar, SkeletonCard],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  activeTab = 0;
  orders: Order[] = [];
  interviews: InterviewRequest[] = [];
  loadingOrders = true;
  loadingInterviews = true;

  tabs = [
    { label: 'Все заказы', count: 0 },
    { label: 'В работе', count: 0 },
    { label: 'Завершённые', count: 0 },
    { label: 'Интервью', count: 0 },
  ];

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.tabs[0].count = orders.length;
        this.tabs[1].count = orders.filter(o => o.status === 'in_progress').length;
        this.tabs[2].count = orders.filter(o => o.status === 'done').length;
        this.loadingOrders = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingOrders = false;
        this.toast.error('Не удалось загрузить заказы');
        this.cdr.detectChanges();
      }
    });
    this.loadInterviews();
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

  loadInterviews() {
    this.loadingInterviews = true;
    this.api.getInterviews().subscribe({
      next: interviews => {
        this.interviews = interviews;
        this.tabs[3].count = interviews.filter(i => i.status === 'new').length;
        this.loadingInterviews = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.interviews = [];
        this.tabs[3].count = 0;
        this.loadingInterviews = false;
        this.cdr.detectChanges();
      }
    });
  }

  approveInterview(interview: InterviewRequest) {
    const department = window.prompt('Департамент для нового мембера (необязательно):', '') || '';
    const feedback = window.prompt('Комментарий (необязательно):', '') || '';
    this.api.approveInterview(interview.id, { department, feedback }).subscribe({
      next: () => {
        this.toast.success(`Заявка ${interview.applicant_full_name || interview.applicant_name} одобрена`);
        this.loadInterviews();
      },
      error: () => this.toast.error('Не удалось одобрить заявку')
    });
  }

  async rejectInterview(interview: InterviewRequest) {
    const ok = await this.confirm.ask({
      title: 'Отклонить заявку?',
      message: `Заявка ${interview.applicant_full_name || interview.applicant_name} будет отклонена.`,
      confirmText: 'Отклонить',
      tone: 'danger',
    });
    if (!ok) return;
    const feedback = window.prompt('Причина отказа (будет видна кандидату):', '') || '';
    this.api.rejectInterview(interview.id, feedback).subscribe({
      next: () => {
        this.toast.info('Заявка отклонена');
        this.loadInterviews();
      },
      error: () => this.toast.error('Не удалось отклонить заявку')
    });
  }

  getInterviewStatusLabel(status: string): string {
    if (status === 'approved') return 'Одобрено';
    if (status === 'rejected') return 'Отклонено';
    return 'Новая';
  }

  skeletonPlaceholders(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('avatar', file);
    this.api.uploadAvatar(form).subscribe({
      next: (user: any) => {
        this.auth.setUser(user);
        this.toast.success('Аватар обновлён');
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Не удалось загрузить аватар'),
    });
    input.value = '';
  }
}
