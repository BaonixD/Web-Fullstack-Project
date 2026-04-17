import { Component, ElementRef, OnDestroy, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService, ChatMessage, Order, Member } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, FormsModule, DatePipe, Sidebar],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail implements OnInit, OnDestroy {
  @ViewChild('chatMessages') chatMessagesRef?: ElementRef<HTMLDivElement>;

  order: Order | null = null;
  members: Member[] = [];
  messages: ChatMessage[] = [];
  assignTo: number | null = null;
  newStatus = '';
  chatText = '';
  chatConnected = false;
  error = '';
  success = '';
  private socket: WebSocket | null = null;

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
          this.loadMessages(order.id!);
          this.connectChat(order.id!);
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

  ngOnDestroy() {
    this.socket?.close();
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

  canDeleteOrder(): boolean {
    const user = this.auth.user();
    if (!user || !this.order) return false;
    return user.role === 'methodist' || this.order.customer === user.id;
  }

  private showSuccess(msg: string) {
    this.success = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.success = ''; this.cdr.detectChanges(); }, 3000);
  }

  loadMessages(orderId: number) {
    this.api.getOrderMessages(orderId).subscribe({
      next: messages => {
        this.messages = messages;
        this.cdr.detectChanges();
        this.scrollChatToBottom();
      },
      error: () => {
        this.messages = [];
        this.cdr.detectChanges();
      }
    });
  }

  connectChat(orderId: number) {
    if (!this.auth.token) return;
    this.socket?.close();
    const token = encodeURIComponent(this.auth.token);
    this.socket = new WebSocket(`ws://127.0.0.1:8000/ws/orders/${orderId}/chat/?token=${token}`);

    this.socket.onopen = () => {
      this.chatConnected = true;
      this.cdr.detectChanges();
    };
    this.socket.onclose = () => {
      this.chatConnected = false;
      this.cdr.detectChanges();
    };
    this.socket.onerror = () => {
      this.chatConnected = false;
      this.cdr.detectChanges();
    };
    this.socket.onmessage = event => {
      const message = JSON.parse(event.data) as ChatMessage;
      if (!this.messages.some(m => m.id === message.id)) {
        this.messages = [...this.messages, message];
      }
      this.cdr.detectChanges();
      this.scrollChatToBottom();
    };
  }

  sendMessage() {
    const text = this.chatText.trim();
    if (!text || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ text }));
    this.chatText = '';
    this.cdr.detectChanges();
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.sender === this.auth.user()?.id;
  }

  private scrollChatToBottom() {
    setTimeout(() => {
      const el = this.chatMessagesRef?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
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
