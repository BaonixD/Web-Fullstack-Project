import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Skeleton } from '../skeleton/skeleton';
import { ApiService, InterviewRequest, Member } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-members',
  imports: [Sidebar, Skeleton, RouterLink],
  templateUrl: './members.html',
  styleUrl: './members.css'
})
export class Members implements OnInit {
  members: Member[] = [];
  interviews: InterviewRequest[] = [];
  loadingMembers = true;

  private gradients = [
    'linear-gradient(135deg,#a29bfe,#6c5ce7)',
    'linear-gradient(135deg,#fd79a8,#e84393)',
    'linear-gradient(135deg,#00cec9,#0984e3)',
    'linear-gradient(135deg,#ffeaa7,#f39c12)',
    'linear-gradient(135deg,#55efc4,#00b894)',
  ];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private confirm: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadMembers();
    this.loadInterviews();
  }

  loadMembers() {
    this.loadingMembers = true;
    this.api.getMembers().subscribe({
      next: members => {
        this.members = members;
        this.loadingMembers = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMembers = false;
        this.toast.error('Не удалось загрузить мемберов');
        this.cdr.detectChanges();
      }
    });
  }

  loadInterviews() {
    if (!this.auth.token) return;
    this.api.getInterviews().subscribe({
      next: interviews => {
        this.interviews = interviews.filter(i => i.status === 'new');
        this.cdr.detectChanges();
      },
      error: () => {
        this.interviews = [];
        this.cdr.detectChanges();
      },
    });
  }

  getInitials(m: Member): string {
    if (m.first_name && m.last_name) {
      return (m.first_name[0] + m.last_name[0]).toUpperCase();
    }
    return m.username.substring(0, 2).toUpperCase();
  }

  getDisplayName(m: Member): string {
    if (m.first_name && m.last_name) {
      return `${m.first_name} ${m.last_name}`;
    }
    return m.username;
  }

  getGradient(index: number): string {
    return this.gradients[index % this.gradients.length];
  }

  skeletonPlaceholders(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  openMember(m: Member) {
    this.router.navigate(['/members', m.id]);
  }

  async removeMember(event: Event, member: Member) {
    event.stopPropagation();
    const ok = await this.confirm.ask({
      title: 'Удалить мембера?',
      message: `${this.getDisplayName(member)} будет понижен до роли «Гость».`,
      confirmText: 'Удалить',
      tone: 'danger',
    });
    if (!ok) return;

    this.api.removeMember(member.id).subscribe({
      next: () => {
        this.members = this.members.filter(m => m.id !== member.id);
        this.toast.success('Мембер удалён');
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Не удалось удалить мембера'),
    });
  }

  approveInterview(interview: InterviewRequest) {
    const department = window.prompt('Департамент для нового мембера (необязательно):', '') || '';
    const feedback = window.prompt('Комментарий (необязательно):', '') || '';
    this.api.approveInterview(interview.id, { department, feedback }).subscribe({
      next: () => {
        this.interviews = this.interviews.filter(i => i.id !== interview.id);
        this.toast.success(`Заявка ${interview.applicant_full_name || interview.applicant_name} одобрена`);
        this.loadMembers();
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Не удалось одобрить заявку'),
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
        this.interviews = this.interviews.filter(i => i.id !== interview.id);
        this.toast.info('Заявка отклонена');
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Не удалось отклонить заявку'),
    });
  }
}
