import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { SkeletonCard, Skeleton } from '../skeleton/skeleton';
import { ApiService, MemberDetail as MemberDetailDto } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-member-detail',
  imports: [RouterLink, DatePipe, Sidebar, Skeleton, SkeletonCard],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css'
})
export class MemberDetail implements OnInit {
  member: MemberDetailDto | null = null;
  loading = true;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
    private confirm: ConfirmService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/members']);
      return;
    }
    this.api.getMember(id).subscribe({
      next: m => {
        this.member = m;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Не удалось загрузить профиль мембера');
        this.router.navigate(['/members']);
      }
    });
  }

  getInitials(): string {
    if (!this.member) return 'U';
    if (this.member.first_name && this.member.last_name) {
      return (this.member.first_name[0] + this.member.last_name[0]).toUpperCase();
    }
    return this.member.username.substring(0, 2).toUpperCase();
  }

  getDisplayName(): string {
    if (!this.member) return '';
    if (this.member.first_name && this.member.last_name) {
      return `${this.member.first_name} ${this.member.last_name}`;
    }
    return this.member.username;
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

  getTypeLabel(type: string): string {
    if (type === 'video') return 'Видео';
    if (type === 'photo') return 'Фото';
    return 'Дизайн';
  }

  async onRemove() {
    if (!this.member) return;
    const ok = await this.confirm.ask({
      title: 'Удалить мембера?',
      message: `${this.getDisplayName()} будет понижен до роли «Гость». Это действие можно отменить только одобрением новой заявки на интервью.`,
      confirmText: 'Удалить',
      tone: 'danger',
    });
    if (!ok) return;
    this.api.removeMember(this.member.id).subscribe({
      next: () => {
        this.toast.success('Мембер понижен до роли «Гость»');
        this.router.navigate(['/members']);
      },
      error: () => this.toast.error('Не удалось удалить мембера'),
    });
  }
}
