import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService, InterviewRequest, Member } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-members',
  imports: [Sidebar],
  templateUrl: './members.html',
  styleUrl: './members.css'
})
export class Members implements OnInit {
  members: Member[] = [];
  interviews: InterviewRequest[] = [];
  error = '';

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadMembers();
    this.loadInterviews();
  }

  loadMembers() {
    this.api.getMembers().subscribe({
      next: members => {
        this.members = members;
        this.cdr.detectChanges();
      },
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

  removeMember(member: Member) {
    this.error = '';
    this.api.removeMember(member.id).subscribe({
      next: () => {
        this.members = this.members.filter(m => m.id !== member.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Не удалось удалить мембера';
        this.cdr.detectChanges();
      }
    });
  }

  approveInterview(interview: InterviewRequest) {
    this.error = '';
    this.api.approveInterview(interview.id).subscribe({
      next: () => {
        this.interviews = this.interviews.filter(i => i.id !== interview.id);
        this.loadMembers();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Не удалось одобрить заявку';
        this.cdr.detectChanges();
      }
    });
  }

  rejectInterview(interview: InterviewRequest) {
    this.error = '';
    this.api.rejectInterview(interview.id).subscribe({
      next: () => {
        this.interviews = this.interviews.filter(i => i.id !== interview.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Не удалось отклонить заявку';
        this.cdr.detectChanges();
      }
    });
  }
}
